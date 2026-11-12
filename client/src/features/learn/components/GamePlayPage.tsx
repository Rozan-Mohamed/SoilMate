'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { GameSlug } from '@/api/types';
import { useGameStore } from '@/store/gameStore';
import { GAME_BY_SLUG } from '../gameConfig';
import { useGameFlow } from '../hooks/useGameFlow';
import { GameTopBar } from '@/components/game/GameTopBar';
import { CollectionRow } from '@/components/game/CollectionRow';
import { Mascot } from '@/components/game/Mascot';
import { SpeechBubble } from '@/components/game/SpeechBubble';
import { QuestionCard } from '@/components/game/QuestionCard';
import { AnswerGrid } from '@/components/game/AnswerGrid';
import { ActionBar } from '@/components/game/ActionBar';
import { FeedbackBanner } from '@/components/game/FeedbackBanner';
import { StreakChip } from '@/components/game/StreakChip';
import { PointsPop } from '@/components/game/PointsPop';
import { ExitConfirmModal } from '@/components/game/ExitConfirmModal';
import { OutOfHeartsModal } from '@/components/game/OutOfHeartsModal';
import type { AnswerState } from '@/components/game/AnswerButton';
import { Icon } from '@/components/ui/Icon';
import { FieldScene } from '@/components/scene/FieldScene';
import { FieldSceneFade } from '@/components/scene/FieldSceneFade';
import { FieldSceneEffect } from '@/components/scene/FieldSceneEffect';
import { CropHero } from '@/components/game/CropHero';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { en } from '@/strings/en';

export function GamePlayPage({ slug }: { slug: GameSlug }) {
  const config = GAME_BY_SLUG[slug];
  const reduce = useReducedMotion();
  const flow = useGameFlow(slug);
  const s = useGameStore();

  const question = s.questions[s.currentIndex];
  const resolved = question ? s.resolvedIds.includes(question.id) : false;
  const wrongKeys = (question && s.wrongChoiceKeysByQuestion[question.id]) || [];
  const correctKey = question ? s.correctChoiceKeyByQuestion[question.id] : undefined;

  const stateOf = (choiceKey: string): AnswerState => {
    if (resolved) return choiceKey === correctKey ? 'correct' : 'disabled';
    if (wrongKeys.includes(choiceKey)) return 'wrong';
    if (s.selectedChoiceKey === choiceKey) return 'selected';
    return 'default';
  };

  // Games 2, 4 and 5 show a FieldScene picture above the question.
  const usesScene =
    slug === 'satellite-or-ground' || slug === 'fix-the-field' || slug === 'weather-and-crops';
  const showCollection = config.collectionKind !== 'terms' && config.collectionKind !== 'none';
  const loading = s.phase === 'loading' || s.phase === 'completing' || !question;
  const inFeedback = ['feedbackCorrect', 'feedbackWrong', 'feedbackSkipped'].includes(s.phase);

  const correctLabel =
    question?.choices.find((c) => c.key === s.lastFeedback?.correctChoiceKey)?.label ?? '';

  let body: React.ReactNode;
  if (s.phase === 'error') {
    body = <ErrorState onRetry={flow.retryAfterError} />;
  } else if (loading) {
    body = <Spinner label={en.game.loading} />;
  } else {
    body = (
      <>
        <GameTopBar
          stage={config.position}
          current={s.currentIndex + 1}
          total={s.total}
          hearts={s.hearts}
          points={s.points}
          onClose={() => flow.requestExit('/learn')}
        />
        {showCollection && <CollectionRow items={s.collectionEarned} total={s.total} />}

        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Mascot outfit={config.mascotOutfit} mood="neutral" className="size-16 shrink-0" />
            <SpeechBubble>{config.speechBubble}</SpeechBubble>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={question.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: -40 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-4"
            >
              <QuestionCard
                prompt={question.prompt}
                subtitle={question.subtitle}
                speakable={slug === 'match-the-word'}
                illustrationVariant={
                  usesScene ? 'scene' : slug === 'crop-superpowers' ? 'hero' : 'icon'
                }
                illustration={
                  slug === 'fix-the-field' ? (
                    <FieldSceneFade
                      problemKey={question.illustrationKey}
                      fixedKey={
                        s.phase === 'feedbackCorrect'
                          ? s.lastFeedback?.illustrationFixedKey
                          : undefined
                      }
                    />
                  ) : slug === 'weather-and-crops' ? (
                    <FieldSceneEffect
                      sceneKey={question.illustrationKey}
                      animationKey={
                        s.phase === 'feedbackCorrect'
                          ? s.lastFeedback?.resultAnimationKey
                          : undefined
                      }
                    />
                  ) : usesScene ? (
                    <FieldScene sceneKey={question.illustrationKey} />
                  ) : slug === 'crop-superpowers' ? (
                    <CropHero
                      iconKey={question.illustrationKey}
                      powered={s.phase === 'feedbackCorrect'}
                    />
                  ) : // Game 1 shows NO icon: it is the same icon as the correct answer and would give it away.
                  slug !== 'match-the-word' && question.illustrationKey ? (
                    <Icon name={question.illustrationKey} className="size-12" />
                  ) : undefined
                }
              />
              <AnswerGrid
                choices={question.choices}
                stateOf={stateOf}
                onSelect={flow.select}
                layout={slug === 'match-the-word' ? 'stack' : 'columns'}
              />
            </motion.div>
          </AnimatePresence>

          {s.inlineError && (
            <p
              role="alert"
              className="rounded-xl bg-peach-soft px-3 py-2 text-center text-sm font-bold text-peach-ink"
            >
              {s.inlineError}
            </p>
          )}
        </div>

        {/* Footer: sticks to the bottom of the screen on phones. */}
        <div className="sticky bottom-0 z-10 rounded-b-[28px] border-t border-mint-3 bg-white/95 px-4 pb-safe pt-3 backdrop-blur">
          {inFeedback && s.lastFeedback ? (
            s.lastFeedback.kind === 'correct' ? (
              <FeedbackBanner
                kind="correct"
                outfit={config.mascotOutfit}
                title={config.correctBannerTitle}
                explanation={s.lastFeedback.explanation ?? ''}
                pointsEarned={s.lastFeedback.pointsEarned}
                onContinue={flow.continueFlow}
              />
            ) : s.lastFeedback.kind === 'wrong' ? (
              <FeedbackBanner
                kind="wrong"
                outfit={config.mascotOutfit}
                onTryAgain={flow.tryAgain}
              />
            ) : (
              <FeedbackBanner
                kind="skipped"
                outfit={config.mascotOutfit}
                explanation={s.lastFeedback.explanation ?? ''}
                correctLabel={correctLabel}
                onContinue={flow.continueFlow}
              />
            )
          ) : (
            <ActionBar
              canCheck={Boolean(s.selectedChoiceKey) && s.phase === 'playing'}
              checking={s.phase === 'checking'}
              offline={!flow.online}
              onCheck={flow.check}
              onSkip={flow.skip}
            />
          )}
        </div>
      </>
    );
  }

  return (
    <section className="mx-auto max-w-xl px-3 pb-10 pt-4 sm:px-4">
      <OfflineBanner />
      <div className="mb-2 flex min-h-8 justify-end">
        <StreakChip streak={s.streak} />
      </div>
      <div className="relative rounded-[28px] border border-mint-3 bg-card shadow-card">
        <PointsPop points={s.lastFeedback?.pointsEarned ?? 0} popId={s.popId} />
        {body}
      </div>

      <ExitConfirmModal open={flow.exitOpen} onKeep={flow.keepPlaying} onLeave={flow.leave} />
      <OutOfHeartsModal
        open={s.phase === 'failed'}
        onTryAgain={flow.playAgain}
        onBack={flow.goToGames}
      />
    </section>
  );
}
