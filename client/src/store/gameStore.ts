'use client';

import { create } from 'zustand';
import type {
  AnswerResponse,
  AttemptState,
  CollectionItem,
  CompleteResponse,
  GameSlug,
  QuestionForPlay,
  SkipResponse,
} from '@/api/types';

export type Phase =
  | 'loading'
  | 'playing'
  | 'checking'
  | 'feedbackCorrect'
  | 'feedbackWrong'
  | 'feedbackSkipped'
  | 'completing'
  | 'result'
  | 'failed'
  | 'error';

export type LastFeedback = {
  kind: 'correct' | 'wrong' | 'skipped';
  correctChoiceKey?: string;
  explanation?: string;
  pointsEarned: number;
  /** Fix the Field (stage 4) and Weather and Crops (stage 5) use these. */
  illustrationFixedKey?: string;
  resultAnimationKey?: string;
};

type GameState = {
  attemptId: string | null;
  gameSlug: GameSlug | null;
  total: number;
  questions: QuestionForPlay[];
  currentIndex: number;
  selectedChoiceKey: string | null;
  phase: Phase;
  hearts: number;
  streak: number;
  points: number;
  resolvedIds: string[];
  wrongChoiceKeysByQuestion: Record<string, string[]>;
  correctChoiceKeyByQuestion: Record<string, string>;
  collectionEarned: CollectionItem[];
  lastFeedback: LastFeedback | null;
  allResolved: boolean;
  /** Changes on every point award so PointsPop replays. */
  popId: number;
  /** Small inline message when a request fails but the game can continue. */
  inlineError: string | null;
  /** Set once complete() returned. Kept in memory so the score screen opens instantly. */
  result: CompleteResponse | null;

  beginLoading: (slug: GameSlug) => void;
  startRound: (attempt: AttemptState) => void;
  resumeRound: (attempt: AttemptState) => void;
  selectChoice: (key: string) => void;
  markChecking: () => void;
  applyAnswerResult: (res: AnswerResponse) => void;
  applySkipResult: (res: SkipResponse) => void;
  markResolvedLocally: (questionId: string) => void;
  tryAgain: () => void;
  /** Moves to the next unresolved question. Returns false when there is none left. */
  goNext: () => boolean;
  setPhase: (phase: Phase) => void;
  setInlineError: (message: string | null) => void;
  setResult: (result: CompleteResponse) => void;
  reset: () => void;
};

const initial = {
  attemptId: null,
  gameSlug: null,
  total: 5,
  questions: [] as QuestionForPlay[],
  currentIndex: 0,
  selectedChoiceKey: null,
  phase: 'loading' as Phase,
  hearts: 3,
  streak: 0,
  points: 0,
  resolvedIds: [] as string[],
  wrongChoiceKeysByQuestion: {} as Record<string, string[]>,
  correctChoiceKeyByQuestion: {} as Record<string, string>,
  collectionEarned: [] as CollectionItem[],
  lastFeedback: null,
  allResolved: false,
  popId: 0,
  inlineError: null,
  result: null,
};

const firstUnresolved = (questions: QuestionForPlay[], resolved: string[], after = -1) => {
  const open = (q: QuestionForPlay) => !resolved.includes(q.id);
  const next = questions.findIndex((q, i) => i > after && open(q));
  return next !== -1 ? next : questions.findIndex(open);
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initial,

  beginLoading: (slug) => set({ ...initial, gameSlug: slug, phase: 'loading' }),

  startRound: (attempt) =>
    set({
      ...initial,
      attemptId: attempt.attemptId,
      gameSlug: attempt.gameSlug,
      total: attempt.total,
      questions: attempt.questions,
      hearts: attempt.hearts,
      streak: attempt.streak,
      points: attempt.points,
      phase: 'playing',
    }),

  resumeRound: (attempt) => {
    const resolvedIds = attempt.questions.filter((q) => q.resolved).map((q) => q.id);
    const wrong: Record<string, string[]> = {};
    for (const q of attempt.questions)
      if (q.wrongChoiceKeys?.length) wrong[q.id] = q.wrongChoiceKeys;
    const allResolved = resolvedIds.length === attempt.questions.length;
    set({
      ...initial,
      attemptId: attempt.attemptId,
      gameSlug: attempt.gameSlug,
      total: attempt.total,
      questions: attempt.questions,
      hearts: attempt.hearts,
      streak: attempt.streak,
      points: attempt.points,
      resolvedIds,
      wrongChoiceKeysByQuestion: wrong,
      allResolved,
      currentIndex: Math.max(0, firstUnresolved(attempt.questions, resolvedIds)),
      // The resume response does not say which earlier questions were first-try wins,
      // so the collection row starts empty after a refresh (backend change requested).
      phase: allResolved ? 'completing' : 'playing',
    });
  },

  selectChoice: (key) => set({ selectedChoiceKey: key, inlineError: null }),

  markChecking: () => set({ phase: 'checking', inlineError: null }),

  applyAnswerResult: (res) => {
    const { questions, currentIndex, selectedChoiceKey, wrongChoiceKeysByQuestion, resolvedIds } =
      get();
    const q = questions[currentIndex];
    if (!q) return;

    // Hearts, streak and points ALWAYS come from the server. Never computed here.
    const server = { hearts: res.hearts, streak: res.streak, points: res.totalPoints };

    if (res.correct) {
      set((s) => ({
        ...server,
        resolvedIds: [...resolvedIds, q.id],
        correctChoiceKeyByQuestion: {
          ...s.correctChoiceKeyByQuestion,
          [q.id]: res.correctChoiceKey ?? selectedChoiceKey ?? '',
        },
        collectionEarned: res.collectionItem
          ? [...s.collectionEarned, res.collectionItem]
          : s.collectionEarned,
        allResolved: res.allResolved,
        selectedChoiceKey: res.correctChoiceKey ?? selectedChoiceKey,
        popId: res.pointsEarned > 0 ? s.popId + 1 : s.popId,
        lastFeedback: {
          kind: 'correct',
          correctChoiceKey: res.correctChoiceKey,
          explanation: res.explanation,
          pointsEarned: res.pointsEarned,
          illustrationFixedKey: res.illustrationFixedKey,
          resultAnimationKey: res.resultAnimationKey,
        },
        phase: 'feedbackCorrect',
      }));
      return;
    }

    const wrongKey = selectedChoiceKey;
    set({
      ...server,
      wrongChoiceKeysByQuestion: wrongKey
        ? {
            ...wrongChoiceKeysByQuestion,
            [q.id]: [...(wrongChoiceKeysByQuestion[q.id] ?? []), wrongKey],
          }
        : wrongChoiceKeysByQuestion,
      selectedChoiceKey: null,
      lastFeedback: { kind: 'wrong', pointsEarned: 0 },
      phase: res.attemptStatus === 'failed' ? 'failed' : 'feedbackWrong',
    });
  },

  applySkipResult: (res) => {
    const { questions, currentIndex, resolvedIds } = get();
    const q = questions[currentIndex];
    if (!q) return;
    set((s) => ({
      hearts: res.hearts,
      streak: res.streak,
      points: res.totalPoints,
      resolvedIds: [...resolvedIds, q.id],
      correctChoiceKeyByQuestion: { ...s.correctChoiceKeyByQuestion, [q.id]: res.correctChoiceKey },
      allResolved: res.allResolved,
      selectedChoiceKey: res.correctChoiceKey,
      lastFeedback: {
        kind: 'skipped',
        correctChoiceKey: res.correctChoiceKey,
        explanation: res.explanation,
        pointsEarned: 0,
      },
      phase: 'feedbackSkipped',
    }));
  },

  markResolvedLocally: (questionId) =>
    set((s) => {
      const resolvedIds = s.resolvedIds.includes(questionId)
        ? s.resolvedIds
        : [...s.resolvedIds, questionId];
      return { resolvedIds, allResolved: resolvedIds.length === s.questions.length };
    }),

  tryAgain: () => set({ selectedChoiceKey: null, lastFeedback: null, phase: 'playing' }),

  goNext: () => {
    const { questions, resolvedIds, currentIndex } = get();
    const next = firstUnresolved(questions, resolvedIds, currentIndex);
    if (next === -1) return false;
    set({ currentIndex: next, selectedChoiceKey: null, lastFeedback: null, phase: 'playing' });
    return true;
  },

  setPhase: (phase) => set({ phase }),
  setInlineError: (inlineError) => set({ inlineError, phase: 'playing' }),
  setResult: (result) => set({ result, phase: 'result' }),
  reset: () => set({ ...initial }),
}));
