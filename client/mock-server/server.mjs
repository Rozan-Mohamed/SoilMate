// A tiny stand-in for the SoilMate API: same routes, same response shapes, same rules, but it keeps
// everything in memory and needs NO MongoDB. Use it to work on the frontend without the real backend
// (or when the real one is not running).   npm run mock   ->   http://localhost:4000/api
//
// It is a development tool. The real backend in /server is the source of truth.
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'data');
const load = (f) => JSON.parse(readFileSync(join(dir, f), 'utf8'));
const GAMES = load('games.json');
const POOLS = Object.fromEntries(
  [
    'match-the-word',
    'satellite-or-ground',
    'crop-superpowers',
    'fix-the-field',
    'weather-and-crops',
  ].map((slug, i) => [slug, load(`g${i + 1}.json`).filter((q) => q.active !== false)]),
);
const PORT = Number(process.env.PORT ?? 4000);
const LATENCY = Number(process.env.MOCK_LATENCY ?? 120);
const GROUPS2 = ['satellite', 'both', 'ground'];

const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);
const pick = (a, n) => shuffle(a).slice(0, n);
const choice = ({ key, label, iconKey }) => ({ key, label, iconKey });

const players = new Map(); // id -> { progress: {slug: {...}}, seen: {slug: Set}, attempts: Map }
const attemptsById = new Map();
const player = (id) => {
  if (!players.has(id)) players.set(id, { progress: {}, seen: {}, attempts: new Map() });
  return players.get(id);
};

class ApiErr extends Error {
  constructor(status, code, message, details) {
    super(message);
    Object.assign(this, { status, code, details });
  }
}

const stars = (score, total) =>
  total === 5
    ? score === 5
      ? 3
      : score >= 3
        ? 2
        : score >= 1
          ? 1
          : 0
    : score === 6
      ? 3
      : score >= 4
        ? 2
        : score >= 2
          ? 1
          : 0;

function buildChoices(slug, q, pool) {
  if (slug === 'match-the-word') {
    const others = pool.filter((p) => p.key !== q.key).map((p) => choice(p.choices[0]));
    return shuffle([choice(q.choices[0]), ...pick(others, 2)]);
  }
  if (slug === 'satellite-or-ground')
    return GROUPS2.map((k) => choice(q.choices.find((c) => c.key === k)));
  return shuffle(q.choices.map(choice));
}

function selectQuestions(slug, game) {
  const pool = POOLS[slug];
  const n = game.questionsPerRound;
  if (slug === 'satellite-or-ground')
    return shuffle(
      GROUPS2.flatMap((g) =>
        pick(
          pool.filter((q) => q.group === g),
          n / 3,
        ),
      ),
    );
  if (slug === 'crop-superpowers') {
    const groups = pick([...new Set(pool.map((q) => q.group))], n);
    return groups.map(
      (g) =>
        pick(
          pool.filter((q) => q.group === g),
          1,
        )[0],
    );
  }
  return pick(pool, n);
}

const forPlay = (aq, withState) => {
  const q = aq.question;
  const out = { id: q.key, key: q.key, position: aq.position, prompt: q.prompt };
  if (q.subtitle) out.subtitle = q.subtitle;
  if (q.illustrationKey) out.illustrationKey = q.illustrationKey;
  out.choices = aq.choices;
  if (withState) {
    out.resolved = aq.resolved;
    out.wrongChoiceKeys = [...aq.wrongChoiceKeys];
    // Contract v1.1.0 proposal: lets the client restore its collection row after a refresh.
    out.firstTryCorrect = aq.firstTryCorrect;
  }
  return out;
};

const attemptState = (a, withState) => ({
  attemptId: a.id,
  gameSlug: a.slug,
  status: a.status,
  hearts: a.hearts,
  streak: a.streak,
  points: a.points,
  total: a.total,
  questions: a.questions.map((aq) => forPlay(aq, withState)),
});

function startAttempt(pid, slug) {
  const game = GAMES.find((g) => g.slug === slug);
  if (!game) throw new ApiErr(404, 'NOT_FOUND', 'Game not found');
  const p = player(pid);
  const old = p.attempts.get(slug);
  if (old && old.status === 'active') old.status = 'abandoned';
  const pool = POOLS[slug];
  const questions = selectQuestions(slug, game).map((q, i) => ({
    question: q,
    position: i + 1,
    choices: buildChoices(slug, q, pool),
    resolved: false,
    skipped: false,
    firstTryCorrect: false,
    wrongChoiceKeys: [],
  }));
  const seen = (p.seen[slug] ??= new Set());
  questions.forEach((aq) => seen.add(aq.question.key));
  const a = {
    id: randomUUID(),
    pid,
    slug,
    status: 'active',
    hearts: 3,
    streak: 0,
    points: 0,
    bestStreak: 0,
    total: game.questionsPerRound,
    questions,
    result: null,
  };
  p.attempts.set(slug, a);
  attemptsById.set(a.id, a);
  return a;
}

function owned(pid, id) {
  const a = attemptsById.get(id);
  if (!a) throw new ApiErr(404, 'NOT_FOUND', 'Attempt not found');
  if (a.pid !== pid) throw new ApiErr(403, 'FORBIDDEN', 'Not your attempt');
  return a;
}

function openQuestion(a, body) {
  if (!body || typeof body.questionId !== 'string')
    throw new ApiErr(400, 'VALIDATION_ERROR', 'questionId is required');
  const aq = a.questions.find((q) => q.question.key === body.questionId);
  if (!aq) throw new ApiErr(400, 'QUESTION_NOT_IN_ATTEMPT', 'Question is not part of this attempt');
  if (a.status !== 'active')
    throw new ApiErr(409, 'ATTEMPT_NOT_ACTIVE', 'This attempt is not active');
  if (aq.resolved) throw new ApiErr(409, 'QUESTION_ALREADY_RESOLVED', 'Question already resolved');
  return aq;
}

const allResolved = (a) => a.questions.every((q) => q.resolved);

function answer(pid, id, body) {
  const a = owned(pid, id);
  const aq = openQuestion(a, body);
  if (typeof body.choiceKey !== 'string' || !aq.choices.some((c) => c.key === body.choiceKey)) {
    throw new ApiErr(400, 'VALIDATION_ERROR', 'choiceKey is not one of the choices');
  }
  const q = aq.question;
  const correct = body.choiceKey === q.correctChoiceKey;
  const out = { correct };
  let firstTry = false;
  let pointsEarned = 0;
  if (correct) {
    firstTry = aq.wrongChoiceKeys.length === 0;
    aq.resolved = true;
    aq.firstTryCorrect = firstTry;
    if (firstTry) {
      pointsEarned = 10;
      a.points += 10;
      a.streak += 1;
      a.bestStreak = Math.max(a.bestStreak, a.streak);
    }
    out.correctChoiceKey = q.correctChoiceKey;
    out.explanation = q.explanation;
  } else {
    aq.wrongChoiceKeys.push(body.choiceKey);
    a.hearts -= 1;
    a.streak = 0;
    if (a.hearts <= 0) a.status = 'failed';
  }
  Object.assign(out, {
    firstTry,
    pointsEarned,
    hearts: a.hearts,
    streak: a.streak,
    totalPoints: a.points,
    attemptStatus: a.status,
    allResolved: allResolved(a),
  });
  if (correct) {
    if (firstTry && q.collectionItem) out.collectionItem = { ...q.collectionItem, earned: true };
    if (q.illustrationFixedKey) out.illustrationFixedKey = q.illustrationFixedKey;
    if (q.resultAnimationKey) out.resultAnimationKey = q.resultAnimationKey;
  }
  return out;
}

function skip(pid, id, body) {
  const a = owned(pid, id);
  const aq = openQuestion(a, body);
  aq.resolved = true;
  aq.skipped = true;
  a.streak = 0;
  return {
    correctChoiceKey: aq.question.correctChoiceKey,
    explanation: aq.question.explanation,
    hearts: a.hearts,
    streak: 0,
    totalPoints: a.points,
    attemptStatus: a.status,
    allResolved: allResolved(a),
  };
}

const badgeOf = (g, earned) => ({ name: g.badge.name, iconKey: g.badge.iconKey, earned });

function progressSummary(pid) {
  const p = player(pid);
  const games = GAMES.map((g) => {
    const b = p.progress[g.slug];
    return {
      slug: g.slug,
      completed: Boolean(b),
      bestScore: b?.score ?? null,
      bestStars: b?.stars ?? null,
      bestPoints: b?.points ?? null,
      badgeEarned: Boolean(b?.badgeEarned),
      questionsSeen: p.seen[g.slug]?.size ?? 0,
    };
  });
  return {
    totalPoints: games.reduce((s, g) => s + (g.bestPoints ?? 0), 0),
    gamesDone: games.filter((g) => g.completed).length,
    games,
    masterBadge: {
      name: 'Soil Expert',
      iconKey: 'badge-soil-expert',
      earned: games.every((g) => g.badgeEarned),
    },
  };
}

function complete(pid, id) {
  const a = owned(pid, id);
  if (a.status !== 'completed') {
    if (a.status !== 'active')
      throw new ApiErr(409, 'ATTEMPT_NOT_ACTIVE', 'This attempt is not active');
    if (!allResolved(a))
      throw new ApiErr(409, 'ATTEMPT_NOT_FINISHED', 'Answer or skip every question first');
    const score = a.questions.filter((q) => q.firstTryCorrect).length;
    a.result = { score, stars: stars(score, a.total), badgeEarned: score >= 4 };
    a.status = 'completed';
    const p = player(pid);
    const prev = p.progress[a.slug];
    p.progress[a.slug] = {
      score: !prev || a.points > prev.points ? score : prev.score,
      stars: !prev || a.points > prev.points ? a.result.stars : prev.stars,
      points: Math.max(prev?.points ?? 0, a.points),
      badgeEarned: Boolean(prev?.badgeEarned) || a.result.badgeEarned,
    };
  }
  const game = GAMES.find((g) => g.slug === a.slug);
  const next = GAMES.find((g) => g.slug === game.nextGameSlug);
  const res = {
    attemptId: a.id,
    gameSlug: a.slug,
    score: a.result.score,
    total: a.total,
    stars: a.result.stars,
    points: a.points,
    bestStreak: a.bestStreak,
    badge: badgeOf(game, a.result.badgeEarned),
    collection:
      game.collectionKind === 'none'
        ? []
        : a.questions.map((q) => ({ ...q.question.collectionItem, earned: q.firstTryCorrect })),
    nextGame: next ? { slug: next.slug, title: next.title } : null,
  };
  if (game.recapChips?.length) res.recap = game.recapChips;
  if (game.isFinale) {
    const sum = progressSummary(pid);
    res.finale = {
      allGamesDone: sum.gamesDone === 5,
      totalPoints: sum.totalPoints,
      gamesDone: sum.gamesDone,
      badges: GAMES.map((g, i) => ({
        gameSlug: g.slug,
        ...g.badge,
        earned: sum.games[i].badgeEarned,
      })),
      masterBadge: sum.masterBadge,
    };
  }
  return res;
}

function listGames(pid) {
  const p = player(pid);
  return {
    games: GAMES.map((g) => {
      const b = p.progress[g.slug];
      return {
        slug: g.slug,
        title: g.title,
        position: g.position,
        questionsPerRound: g.questionsPerRound,
        poolSize: g.poolSize,
        questionsSeen: p.seen[g.slug]?.size ?? 0,
        mascotOutfit: g.mascotOutfit,
        badge: g.badge,
        best: {
          score: b?.score ?? null,
          stars: b?.stars ?? null,
          points: b?.points ?? null,
          badgeEarned: Boolean(b?.badgeEarned),
          completed: Boolean(b),
          timesPlayed: b ? 1 : 0,
        },
      };
    }),
  };
}

function route(method, path, pid, body) {
  let m;
  if (method === 'GET' && path === '/api/health') return [200, { status: 'ok', mock: true }];
  if (method === 'GET' && path === '/api/games') return [200, listGames(pid)];
  if (method === 'POST' && (m = path.match(/^\/api\/games\/([^/]+)\/attempts$/)))
    return [201, attemptState(startAttempt(pid, m[1]), false)];
  if (method === 'GET' && (m = path.match(/^\/api\/games\/([^/]+)\/attempts\/current$/))) {
    if (!GAMES.some((g) => g.slug === m[1])) throw new ApiErr(404, 'NOT_FOUND', 'Game not found');
    const a = player(pid).attempts.get(m[1]);
    if (!a || a.status !== 'active') throw new ApiErr(404, 'NOT_FOUND', 'No active attempt');
    return [200, attemptState(a, true)];
  }
  if (
    method === 'POST' &&
    (m = path.match(/^\/api\/attempts\/([^/]+)\/(answer|skip|complete|abandon)$/))
  ) {
    const [, id, action] = m;
    if (action === 'answer') return [200, answer(pid, id, body)];
    if (action === 'skip') return [200, skip(pid, id, body)];
    if (action === 'complete') return [200, complete(pid, id)];
    const a = owned(pid, id);
    if (a.status === 'active') a.status = 'abandoned';
    return [200, { status: 'abandoned' }];
  }
  if (method === 'GET' && path === '/api/players/me/progress') return [200, progressSummary(pid)];
  if (method === 'POST' && path === '/api/players/me/reset') {
    players.delete(pid);
    return [200, { reset: true }];
  }
  throw new ApiErr(404, 'NOT_FOUND', 'Route not found');
}

createServer((req, res) => {
  const pid = req.headers['x-player-id'] || randomUUID();
  const base = {
    'Access-Control-Allow-Origin': req.headers.origin ?? '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Player-Id',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Expose-Headers': 'X-Player-Id',
    'X-Player-Id': pid,
    'Cache-Control': 'no-store',
  };
  if (req.method === 'OPTIONS') return res.writeHead(204, base).end();

  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    setTimeout(() => {
      let status = 200;
      let payload;
      try {
        const body = raw ? JSON.parse(raw) : undefined;
        [status, payload] = route(req.method, new URL(req.url, 'http://x').pathname, pid, body);
      } catch (e) {
        status = e instanceof ApiErr ? e.status : e instanceof SyntaxError ? 400 : 500;
        payload = {
          error: {
            code:
              e instanceof ApiErr
                ? e.code
                : e instanceof SyntaxError
                  ? 'VALIDATION_ERROR'
                  : 'INTERNAL',
            message: e.message,
          },
        };
      }
      res
        .writeHead(status, { ...base, 'Content-Type': 'application/json' })
        .end(JSON.stringify(payload));
    }, LATENCY);
  });
}).listen(PORT, () =>
  console.log(`SoilMate MOCK API on http://localhost:${PORT}/api  (in-memory, no MongoDB)`),
);
