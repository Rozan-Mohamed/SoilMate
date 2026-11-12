import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from './gameStore';
import type { AnswerResponse, AttemptState, QuestionForPlay } from '@/api/types';

const choices = [
  { key: 'a', label: 'A', iconKey: 'x' },
  { key: 'b', label: 'B', iconKey: 'x' },
  { key: 'c', label: 'C', iconKey: 'x' },
];
const question = (n: number, extra: Partial<QuestionForPlay> = {}): QuestionForPlay => ({
  id: `q${n}`,
  key: `q${n}`,
  position: n,
  prompt: `Question ${n}`,
  choices,
  ...extra,
});
const attempt = (extra: Partial<AttemptState> = {}): AttemptState => ({
  attemptId: 'att-1',
  gameSlug: 'fix-the-field',
  status: 'active',
  hearts: 3,
  streak: 0,
  points: 0,
  total: 6,
  questions: [question(1), question(2), question(3)],
  ...extra,
});
const correct = (extra: Partial<AnswerResponse> = {}): AnswerResponse => ({
  correct: true,
  correctChoiceKey: 'b',
  explanation: 'Because.',
  firstTry: true,
  pointsEarned: 10,
  hearts: 3,
  streak: 1,
  totalPoints: 10,
  attemptStatus: 'active',
  allResolved: false,
  ...extra,
});
const wrong = (extra: Partial<AnswerResponse> = {}): AnswerResponse => ({
  correct: false,
  firstTry: false,
  pointsEarned: 0,
  hearts: 2,
  streak: 0,
  totalPoints: 0,
  attemptStatus: 'active',
  allResolved: false,
  ...extra,
});

const store = () => useGameStore.getState();

describe('gameStore', () => {
  beforeEach(() => store().reset());

  it('startRound loads the attempt and opens the first question', () => {
    store().startRound(attempt());
    expect(store().phase).toBe('playing');
    expect(store().attemptId).toBe('att-1');
    expect(store().questions).toHaveLength(3);
    expect(store().currentIndex).toBe(0);
    expect(store().hearts).toBe(3);
  });

  it('a correct answer takes hearts, streak and points from the server, never computes them', () => {
    store().startRound(attempt({ points: 20, streak: 2 }));
    store().selectChoice('b');
    // The server says 77 on purpose: the store must not add 10 to 20 itself.
    store().applyAnswerResult(correct({ totalPoints: 77, streak: 9, hearts: 2 }));
    expect(store().points).toBe(77);
    expect(store().streak).toBe(9);
    expect(store().hearts).toBe(2);
  });

  it('a correct answer resolves the question and keeps the explanation and scene keys', () => {
    store().startRound(attempt());
    store().selectChoice('b');
    store().applyAnswerResult(
      correct({ illustrationFixedKey: 'scene-g4-x-fixed', resultAnimationKey: 'flood' }),
    );
    expect(store().resolvedIds).toEqual(['q1']);
    expect(store().correctChoiceKeyByQuestion.q1).toBe('b');
    expect(store().phase).toBe('feedbackCorrect');
    expect(store().lastFeedback).toMatchObject({
      kind: 'correct',
      explanation: 'Because.',
      illustrationFixedKey: 'scene-g4-x-fixed',
      resultAnimationKey: 'flood',
    });
  });

  it('only awards a points pop when points were earned (a retry win earns none)', () => {
    store().startRound(attempt());
    store().selectChoice('b');
    store().applyAnswerResult(correct({ pointsEarned: 0, firstTry: false }));
    expect(store().popId).toBe(0);
    store().goNext();
    store().selectChoice('b');
    store().applyAnswerResult(correct({ pointsEarned: 10, totalPoints: 10 }));
    expect(store().popId).toBe(1);
  });

  it('adds the collection item only when the server sends one', () => {
    store().startRound(attempt());
    store().selectChoice('b');
    store().applyAnswerResult(
      correct({ collectionItem: { key: 'tile-x', label: 'X', iconKey: 'tile-x', earned: true } }),
    );
    expect(store().collectionEarned).toHaveLength(1);
    store().goNext();
    store().selectChoice('b');
    store().applyAnswerResult(correct());
    expect(store().collectionEarned).toHaveLength(1);
  });

  it('a wrong answer costs a heart, remembers the wrong choice and clears the selection', () => {
    store().startRound(attempt());
    store().selectChoice('a');
    store().applyAnswerResult(wrong());
    expect(store().hearts).toBe(2);
    expect(store().wrongChoiceKeysByQuestion.q1).toEqual(['a']);
    expect(store().selectedChoiceKey).toBeNull();
    expect(store().resolvedIds).toEqual([]);
    expect(store().phase).toBe('feedbackWrong');
    expect(store().lastFeedback?.correctChoiceKey).toBeUndefined();
  });

  it('tryAgain keeps the wrong choices disabled and returns to playing', () => {
    store().startRound(attempt());
    store().selectChoice('a');
    store().applyAnswerResult(wrong());
    store().tryAgain();
    expect(store().phase).toBe('playing');
    expect(store().wrongChoiceKeysByQuestion.q1).toEqual(['a']);
  });

  it('the last heart ends the round (phase failed)', () => {
    store().startRound(attempt({ hearts: 1 }));
    store().selectChoice('a');
    store().applyAnswerResult(wrong({ hearts: 0, attemptStatus: 'failed' }));
    expect(store().phase).toBe('failed');
  });

  it('a skip resolves the question and reveals the answer without a points pop', () => {
    store().startRound(attempt({ streak: 3 }));
    store().applySkipResult({
      correctChoiceKey: 'c',
      explanation: 'Skipped.',
      hearts: 3,
      streak: 0,
      totalPoints: 0,
      attemptStatus: 'active',
      allResolved: false,
    });
    expect(store().streak).toBe(0);
    expect(store().resolvedIds).toEqual(['q1']);
    expect(store().correctChoiceKeyByQuestion.q1).toBe('c');
    expect(store().phase).toBe('feedbackSkipped');
    expect(store().popId).toBe(0);
  });

  it('goNext moves to the next open question and says so when there is none', () => {
    store().startRound(attempt());
    store().markResolvedLocally('q1');
    expect(store().goNext()).toBe(true);
    expect(store().currentIndex).toBe(1);
    store().markResolvedLocally('q2');
    store().markResolvedLocally('q3');
    expect(store().goNext()).toBe(false);
    expect(store().allResolved).toBe(true);
  });

  it('resumeRound jumps to the first unresolved question and restores wrong choices', () => {
    store().resumeRound(
      attempt({
        hearts: 2,
        points: 10,
        questions: [
          question(1, { resolved: true }),
          question(2, { resolved: false, wrongChoiceKeys: ['a'] }),
          question(3, { resolved: false }),
        ],
      }),
    );
    expect(store().currentIndex).toBe(1);
    expect(store().resolvedIds).toEqual(['q1']);
    expect(store().wrongChoiceKeysByQuestion.q2).toEqual(['a']);
    expect(store().hearts).toBe(2);
    expect(store().phase).toBe('playing');
  });

  it('resumeRound with everything answered goes straight to completing', () => {
    store().resumeRound(
      attempt({ questions: [question(1, { resolved: true }), question(2, { resolved: true })] }),
    );
    expect(store().phase).toBe('completing');
    expect(store().allResolved).toBe(true);
  });

  it('beginLoading wipes the previous round', () => {
    store().startRound(attempt({ points: 50 }));
    store().beginLoading('match-the-word');
    expect(store().phase).toBe('loading');
    expect(store().points).toBe(0);
    expect(store().questions).toEqual([]);
    expect(store().gameSlug).toBe('match-the-word');
  });
});
