'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { abandon, answer, complete, skip } from '@/api/attempts.api';
import { startAttempt } from '@/api/games.api';
import { isApiError } from '@/api/client';
import { queryKeys } from '@/api/queries';
import type { GameSlug } from '@/api/types';
import { playSfx } from '@/audio/store';
import { useGameStore } from '@/store/gameStore';
import { useExitGuard } from '@/hooks/useExitGuard';
import { useOnline } from '@/hooks/useOnline';
import { loadAttempt } from '../attemptLoader';
import { en } from '@/strings/en';

const IN_ROUND = ['playing', 'checking', 'feedbackCorrect', 'feedbackWrong', 'feedbackSkipped'];

export function useGameFlow(slug: GameSlug) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const online = useOnline();
  const store = useGameStore();

  // Where the player was heading when the exit modal opened (null = modal closed).
  const [exitHref, setExitHref] = useState<string | null>(null);

  // ------------------------------------------------------------------ loading
  const finish = useCallback(async () => {
    const { attemptId } = useGameStore.getState();
    if (!attemptId) return;
    useGameStore.getState().setPhase('completing');
    try {
      const result = await complete(attemptId);
      useGameStore.getState().setResult(result);
      void queryClient.invalidateQueries({ queryKey: queryKeys.games });
      void queryClient.invalidateQueries({ queryKey: queryKeys.progress });
      router.push(`/learn/${slug}/result?attempt=${attemptId}`);
    } catch (error) {
      if (isApiError(error) && error.code === 'ATTEMPT_NOT_ACTIVE') {
        useGameStore.getState().setPhase('failed');
      } else {
        useGameStore.getState().setPhase('error');
      }
    }
  }, [queryClient, router, slug]);

  const load = useCallback(() => {
    let cancelled = false;
    useGameStore.getState().beginLoading(slug);
    loadAttempt(slug)
      .then(({ attempt, resumed }) => {
        if (cancelled) return;
        if (resumed) useGameStore.getState().resumeRound(attempt);
        else useGameStore.getState().startRound(attempt);
        if (useGameStore.getState().phase === 'completing') void finish();
      })
      .catch(() => {
        if (!cancelled) useGameStore.getState().setPhase('error');
      });
    return () => {
      cancelled = true;
    };
  }, [slug, finish]);

  useEffect(() => load(), [load]);

  // ------------------------------------------------------------------ playing
  const select = useCallback((choiceKey: string) => {
    const s = useGameStore.getState();
    if (s.phase !== 'playing') return;
    const q = s.questions[s.currentIndex];
    if (!q || s.resolvedIds.includes(q.id)) return;
    if (s.wrongChoiceKeysByQuestion[q.id]?.includes(choiceKey)) return;
    playSfx('tap');
    s.selectChoice(choiceKey);
  }, []);

  const moveOnAfterConflict = useCallback(
    (questionId: string) => {
      // The server says this question is already done: skip ahead instead of getting stuck.
      useGameStore.getState().markResolvedLocally(questionId);
      if (!useGameStore.getState().goNext()) void finish();
    },
    [finish],
  );

  const handleFailure = useCallback(
    (error: unknown, questionId: string) => {
      const s = useGameStore.getState();
      if (isApiError(error) && error.code === 'ATTEMPT_NOT_ACTIVE') {
        playSfx('fail');
        s.setPhase('failed');
      } else if (isApiError(error) && error.code === 'QUESTION_ALREADY_RESOLVED') {
        moveOnAfterConflict(questionId);
      } else {
        s.setInlineError(en.game.requestFailed);
      }
    },
    [moveOnAfterConflict],
  );

  const check = useCallback(async () => {
    const s = useGameStore.getState();
    const q = s.questions[s.currentIndex];
    if (s.phase !== 'playing' || !q || !s.selectedChoiceKey || !s.attemptId || !online) return;

    const heartsBefore = s.hearts;
    s.markChecking();
    try {
      const res = await answer(s.attemptId, q.id, s.selectedChoiceKey);
      useGameStore.getState().applyAnswerResult(res);
      if (res.correct) {
        playSfx('correct');
        if (slug === 'crop-superpowers') setTimeout(() => playSfx('powerUp'), 220);
      } else {
        playSfx('wrong');
        if (res.hearts < heartsBefore) setTimeout(() => playSfx('heartLost'), 280);
        if (res.attemptStatus === 'failed') setTimeout(() => playSfx('fail'), 700);
      }
    } catch (error) {
      handleFailure(error, q.id);
    }
  }, [handleFailure, online, slug]);

  const skipQuestion = useCallback(async () => {
    const s = useGameStore.getState();
    const q = s.questions[s.currentIndex];
    if (s.phase !== 'playing' || !q || !s.attemptId || !online) return;
    s.markChecking();
    try {
      const res = await skip(s.attemptId, q.id);
      useGameStore.getState().applySkipResult(res);
      playSfx('tap');
    } catch (error) {
      handleFailure(error, q.id);
    }
  }, [handleFailure, online]);

  const tryAgain = useCallback(() => {
    playSfx('tap');
    useGameStore.getState().tryAgain();
  }, []);

  const continueFlow = useCallback(() => {
    const s = useGameStore.getState();
    if (s.phase !== 'feedbackCorrect' && s.phase !== 'feedbackSkipped') return;
    if (s.allResolved || !s.goNext()) void finish();
  }, [finish]);

  const retryAfterError = useCallback(() => {
    const s = useGameStore.getState();
    // If the round was already fully answered, only the finishing step failed.
    if (s.attemptId && s.allResolved) void finish();
    else load();
  }, [finish, load]);

  // ---------------------------------------------------------------- play again
  const playAgain = useCallback(async () => {
    useGameStore.getState().beginLoading(slug);
    try {
      // The server abandons the old round and builds a new random set.
      useGameStore.getState().startRound(await startAttempt(slug));
    } catch {
      useGameStore.getState().setPhase('error');
    }
  }, [slug]);

  // --------------------------------------------------------------------- exit
  const inRound = IN_ROUND.includes(store.phase);
  useExitGuard({
    active: inRound,
    onAttemptLeave: (href) => setExitHref(href),
  });

  const requestExit = useCallback((href = '/learn') => setExitHref(href), []);
  const keepPlaying = useCallback(() => setExitHref(null), []);
  const leave = useCallback(async () => {
    const href = exitHref ?? '/learn';
    const { attemptId } = useGameStore.getState();
    setExitHref(null);
    if (attemptId) await abandon(attemptId).catch(() => undefined);
    useGameStore.getState().reset();
    router.push(href);
  }, [exitHref, router]);

  const goToGames = useCallback(() => {
    useGameStore.getState().reset();
    router.push('/learn');
  }, [router]);

  // ----------------------------------------------------------------- keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (exitHref !== null || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const typing = target?.closest?.('input, textarea, select, [contenteditable="true"]');
      if (typing) return;
      const s = useGameStore.getState();
      const q = s.questions[s.currentIndex];

      if (['1', '2', '3'].includes(e.key) && q) {
        const choice = q.choices[Number(e.key) - 1];
        if (choice) select(choice.key);
        return;
      }
      // Buttons handle their own Enter. This covers Enter pressed with nothing focused.
      if (e.key === 'Enter' && !target?.closest?.('button, a')) {
        if (s.phase === 'playing' && s.selectedChoiceKey) void check();
        else if (s.phase === 'feedbackWrong') tryAgain();
        else continueFlow();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [check, continueFlow, exitHref, select, tryAgain]);

  return {
    online,
    exitOpen: exitHref !== null,
    select,
    check,
    skip: skipQuestion,
    tryAgain,
    continueFlow,
    retryAfterError,
    playAgain,
    requestExit,
    keepPlaying,
    leave,
    goToGames,
  };
}
