'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { GameSlug } from '@/api/types';
import { playSfx } from '@/audio/store';
import { ActionBar } from '@/components/game/ActionBar';
import { AnswerGrid } from '@/components/game/AnswerGrid';
import { ExitConfirmModal } from '@/components/game/ExitConfirmModal';
import { FeedbackBanner } from '@/components/game/FeedbackBanner';
import { GameShell } from '@/components/game/GameShell';
import { GameTopBar } from '@/components/game/GameTopBar';
import { OutOfHeartsModal } from '@/components/game/OutOfHeartsModal';
import { PointsPop } from '@/components/game/PointsPop';
import { QuestionCard } from '@/components/game/QuestionCard';
import { SpeechBubble } from '@/components/game/SpeechBubble';
import { StreakChip } from '@/components/game/StreakChip';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { CardSpinner } from '@/components/ui/Spinner';
import { useGameFlow } from '@/hooks/useGameFlow';
import { useLeaveGuard } from '@/hooks/useLeaveGuard';
import { useOnline } from '@/hooks/useOnline';
import { selectCurrentQuestion, useGameStore } from '@/store/gameStore';
import { en } from '@/strings/en';
import { GAME_BY_SLUG } from './gameConfig';

const NO_KEYS: string[] = []; // a stable empty array: a new [] per render would loop the store hook

export function GamePlayPage({ slug }: { slug: GameSlug }) {
  // key={slug}: moving from one game to the next always starts from a clean component.
  return <GamePlay key={slug} slug={slug} />;
}

function GamePlay({ slug }: { slug: GameSlug }) {
  const game = GAME_BY_SLUG[slug];
  const router = useRouter();
  const flow = useGameFlow(slug);
  const online = useOnline();

  const phase = useGameStore((s) => s.phase);
  const question = useGameStore(selectCurrentQuestion);
  const total = useGameStore((s) => s.total);
  const hearts = useGameStore((s) => s.hearts);
  const streak = useGameStore((s) => s.streak);
  const points = useGameStore((s) => s.points);
  const resolvedCount = useGameStore((s) => Object.keys(s.resolvedIds).length);
  const selectedKey = useGameStore((s) => s.selectedChoiceKey);
  const wrongKeys = useGameStore((s) =>
    question
      ? (s.wrongChoiceKeysByQuestion[question.id] ?? NO_KEYS)
      : NO_KEYS,
  );
  const feedback = useGameStore((s) => s.lastFeedback);
  const notice = useGameStore((s) => s.notice);
  const pointsPopKey = useGameStore((s) => s.pointsPopKey);
  const heartLostKey = useGameStore((s) => s.heartLostKey);
  const selectChoice = useGameStore((s) => s.selectChoice);

  const [exitTarget, setExitTarget] = useState<string | null>(null);

  // React StrictMode runs effects twice in development. Starting the round twice would
  // abandon the first attempt and the next answer would fail with ATTEMPT_NOT_ACTIVE.
  const startedFor = useRef<GameSlug | null>(null);
  useEffect(() => {
    if (startedFor.current === slug) return;
    startedFor.current = slug;
    useGameStore.getState().reset();
    void flow.init();
  }, [slug, flow]);

  const inRound =
    phase === 'playing' ||
    phase === 'checking' ||
    phase === 'feedbackCorrect' ||
    phase === 'feedbackWrong' ||
    phase === 'feedbackSkipped';

  // Anything that would leave mid-round asks first (tab close, navbar, pipeline, Back).
  useLeaveGuard(inRound && exitTarget === null, setExitTarget);

  const confirmLeave = useCallback(() => {
    const href = exitTarget ?? '/learn';
    setExitTarget(null);
    void flow.leave(href);
  }, [exitTarget, flow]);

  // Keyboard play: 1, 2, 3 pick a choice. Enter presses the main button. A focused button
  // or link keeps its own Enter behaviour, so nothing fires twice.
  useEffect(() => {
    if (!inRound || exitTarget !== null) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const onControl = !!el?.closest?.('button, a, input, textarea, select, [role="dialog"]');
      const s = useGameStore.getState();
      const q = s.questions[s.currentIndex];

      if (e.key >= '1' && e.key <= '3' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const choice = q?.choices[Number(e.key) - 1];
        if (choice) {
          selectChoice(choice.key);
          playSfx('tap');
        }
        return;
      }
      if (e.key === 'Enter' && !onControl) {
        e.preventDefault();
        if (s.phase === 'playing') void flow.check();
        else if (s.phase === 'feedbackWrong') flow.tryAgain();
        else flow.next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inRound, exitTarget, flow, selectChoice]);

  if (phase === 'error') {
    return (
      <GameShell>
        <ErrorState onRetry={flow.retry} />
      </GameShell>
    );
  }

  if (phase === 'failed' && !question) {
    return (
      <GameShell>
        <OutOfHeartsModal
          onTryAgain={() => void flow.startFresh()}
          onBack={() => router.push('/learn')}
        />
      </GameShell>
    );
  }

  if (phase === 'loading' || phase === 'completing' || !question) {
    return (
      <GameShell>
        <CardSpinner />
      </GameShell>
    );
  }

  const answered = phase === 'feedbackCorrect' || phase === 'feedbackSkipped';
  const correctKey = answered ? feedback?.correctChoiceKey : undefined;
  const correctLabel = question.choices.find((c) => c.key === correctKey)?.label;
  const showBanner = answered || phase === 'feedbackWrong';

  return (
    <GameShell>
      {/* Floating chips above the card (the PDF shows them there). */}
      <div className="relative mb-3 flex min-h-8 items-center justify-between gap-2 px-1">
        <StreakChip streak={streak} />
        <PointsPop popKey={pointsPopKey} />
      </div>

      <section
        aria-label={game.title}
        className="rounded-card bg-card p-4 shadow-card sm:p-6"
      >
        <GameTopBar
          onClose={() => setExitTarget('/learn')}
          done={resolvedCount}
          total={total}
          current={question.position}
          stageLabel={en.game.gameLabel(game.position)}
          hearts={hearts}
          heartLostKey={heartLostKey}
          points={points}
        />

        <div className="mt-4 flex flex-col gap-4">
          {!online && <OfflineBanner />}
          <SpeechBubble outfit={game.mascotOutfit} text={game.speechBubble} />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-4"
            >
              <QuestionCard
                prompt={question.prompt}
                subtitle={question.subtitle}
                illustrationKey={question.illustrationKey}
                speakable={slug === 'match-the-word'}
              />
              <AnswerGrid
                gameSlug={slug}
                choices={question.choices}
                selectedKey={selectedKey}
                wrongKeys={wrongKeys}
                correctKey={correctKey}
                interactive={phase === 'playing'}
                onSelect={(key) => {
                  playSfx('tap');
                  selectChoice(key);
                }}
              />
            </motion.div>
          </AnimatePresence>

          {notice && (
            <p role="alert" className="rounded-btn bg-peach-soft px-3 py-2 text-center text-sm font-bold text-peach-ink">
              {notice}
            </p>
          )}

          {/* Always in the DOM, so screen readers announce what appears inside it. */}
          <div aria-live="polite">
            <AnimatePresence mode="wait">
              {showBanner && feedback && (
                <FeedbackBanner
                  key={`${question.id}-${feedback.kind}-${wrongKeys.length}`}
                  feedback={feedback}
                  correctTitle={game.correctBannerTitle}
                  correctLabel={correctLabel}
                  onContinue={flow.next}
                  onTryAgain={flow.tryAgain}
                />
              )}
            </AnimatePresence>
          </div>

          {!showBanner && (
            <ActionBar
              canCheck={!!selectedKey && phase === 'playing' && online}
              checking={phase === 'checking'}
              onCheck={() => void flow.check()}
              onSkip={() => void flow.skip()}
            />
          )}
        </div>
      </section>

      {exitTarget !== null && (
        <ExitConfirmModal onKeepPlaying={() => setExitTarget(null)} onLeave={confirmLeave} />
      )}

      {phase === 'failed' && (
        <OutOfHeartsModal
          onTryAgain={() => void flow.startFresh()}
          onBack={() => router.push('/learn')}
        />
      )}
    </GameShell>
  );
}
