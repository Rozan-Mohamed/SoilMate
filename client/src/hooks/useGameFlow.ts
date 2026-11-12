'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { abandon, answer, complete, skip } from '@/api/attempts.api';
import { getCurrentAttempt, startAttempt } from '@/api/games.api';
import { isApiError } from '@/api/client';
import { queryKeys } from '@/api/queries';
import type { AttemptState, GameSlug } from '@/api/types';
import { playSfx } from '@/audio/store';
import { useGameStore } from '@/store/gameStore';
import { en } from '@/strings/en';

/**
 * All game actions. They read the store with getState() so they never act on stale values,
 * and every number (hearts, streak, points) is taken from the server's reply.
 */
export function useGameFlow(slug: GameSlug) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const store = useGameStore;

  const applyAttempt = useCallback(
    (attempt: AttemptState, resumed: boolean) => {
      if (resumed) store.getState().resumeRound(attempt);
      else store.getState().startRound(attempt);
    },
    [store],
  );

  const finish = useCallback(async () => {
    const s = store.getState();
    if (!s.attemptId) return;
    s.setPhase('completing');
    try {
      const result = await complete(s.attemptId);
      store.getState().setResult(result);
      // The hub and the pipeline read these.
      void queryClient.invalidateQueries({ queryKey: queryKeys.games });
      void queryClient.invalidateQueries({ queryKey: queryKeys.progress });
      playSfx('complete');
      router.push(`/learn/${slug}/result`);
    } catch (e) {
      handleError(e, 'complete');
    }
    // handleError is declared below and only used at call time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, router, slug, store]);

  // Reload the attempt from the server. Used after a 409 so we never guess the state.
  const resync = useCallback(async () => {
    try {
      const attempt = await getCurrentAttempt(slug);
      applyAttempt(attempt, true);
      if (store.getState().allResolved && store.getState().phase === 'playing') await finish();
    } catch (e) {
      if (isApiError(e) && e.status === 404) {
        // The attempt is gone (failed or abandoned). Treat it like out of hearts.
        store.getState().setPhase('failed');
        playSfx('fail');
      } else {
        store.getState().setPhase('error');
      }
    }
  }, [applyAttempt, finish, slug, store]);

  function handleError(e: unknown, from: 'answer' | 'skip' | 'complete') {
    const s = store.getState();
    if (isApiError(e)) {
      if (e.code === 'ATTEMPT_NOT_ACTIVE') {
        s.setPhase('failed');
        playSfx('fail');
        return;
      }
      if (e.code === 'QUESTION_ALREADY_RESOLVED' || e.code === 'ATTEMPT_NOT_FINISHED') {
        void resync();
        return;
      }
    }
    if (from === 'complete') s.setPhase('error');
    else s.restorePlaying(en.errorState.text);
  }

  /** Called once when the play screen opens: resume the active attempt or start a new one. */
  const init = useCallback(async () => {
    store.getState().setPhase('loading');
    try {
      let attempt: AttemptState;
      let resumed = false;
      try {
        attempt = await getCurrentAttempt(slug);
        resumed = true;
      } catch (e) {
        if (isApiError(e) && e.status === 404) attempt = await startAttempt(slug);
        else throw e;
      }
      applyAttempt(attempt, resumed);
      const s = store.getState();
      if (s.phase === 'failed') playSfx('fail');
      else if (s.allResolved) await finish();
    } catch {
      store.getState().setPhase('error');
    }
  }, [applyAttempt, finish, slug, store]);

  /** A brand new round (Try Again after out of hearts). The server abandons the old one. */
  const startFresh = useCallback(async () => {
    store.getState().reset();
    try {
      applyAttempt(await startAttempt(slug), false);
    } catch {
      store.getState().setPhase('error');
    }
  }, [applyAttempt, slug, store]);

  const check = useCallback(async () => {
    const s = store.getState();
    const q = s.questions[s.currentIndex];
    const choiceKey = s.selectedChoiceKey;
    if (s.phase !== 'playing' || !choiceKey || !q || !s.attemptId) return;

    s.markChecking();
    try {
      const res = await answer(s.attemptId, q.id, choiceKey);
      store.getState().applyAnswerResult(res, q.id, choiceKey);
      if (res.correct) {
        playSfx('correct');
      } else {
        playSfx('wrong');
        window.setTimeout(() => playSfx('heartLost'), 260);
        if (res.attemptStatus === 'failed') window.setTimeout(() => playSfx('fail'), 700);
      }
    } catch (e) {
      handleError(e, 'answer');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const skipQuestion = useCallback(async () => {
    const s = store.getState();
    const q = s.questions[s.currentIndex];
    if (s.phase !== 'playing' || !q || !s.attemptId) return;

    s.markChecking();
    try {
      const res = await skip(s.attemptId, q.id);
      store.getState().applySkipResult(res, q.id);
    } catch (e) {
      handleError(e, 'skip');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  /** After a wrong answer: clear the selection. The wrong choice stays disabled. */
  const tryAgain = useCallback(() => store.getState().clearSelection(), [store]);

  const next = useCallback(() => {
    const s = store.getState();
    if (s.phase !== 'feedbackCorrect' && s.phase !== 'feedbackSkipped') return;
    if (s.allResolved) void finish();
    else s.goNext();
  }, [finish, store]);

  /** Leave the game: abandon the attempt (best effort) and go somewhere else. */
  const leave = useCallback(
    async (href = '/learn') => {
      const { attemptId, phase } = store.getState();
      if (attemptId && phase !== 'failed' && phase !== 'result') {
        try {
          await abandon(attemptId);
        } catch {
          /* leaving must never be blocked by a failed request */
        }
      }
      store.getState().reset();
      router.push(href);
    },
    [router, store],
  );

  /** Retry button on the error card. */
  const retry = useCallback(() => {
    const s = store.getState();
    if (s.attemptId && s.allResolved) void finish();
    else void init();
  }, [finish, init, store]);

  return useMemo(
    () => ({ init, startFresh, check, skip: skipQuestion, tryAgain, next, leave, retry }),
    [init, startFresh, check, skipQuestion, tryAgain, next, leave, retry],
  );
}
