'use client';

import { useEffect, useRef } from 'react';
import { ArrowRight, PartyPopper, RotateCcw, Sprout, Star } from 'lucide-react';
import clsx from 'clsx';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Mascot } from './Mascot';
import { en } from '@/strings/en';
import type { MascotOutfit } from '@/api/types';

type Common = { outfit?: MascotOutfit };
type Props =
  | (Common & {
      kind: 'correct';
      title: string;
      explanation: string;
      pointsEarned: number;
      onContinue: () => void;
    })
  | (Common & { kind: 'wrong'; onTryAgain: () => void })
  | (Common & {
      kind: 'skipped';
      explanation: string;
      correctLabel: string;
      onContinue: () => void;
    });

const tone = {
  correct: 'bg-mint-2 border-primary/30',
  wrong: 'bg-peach-soft border-peach/40',
  skipped: 'bg-mint-2 border-mint-3',
} as const;

// Slides up in place of the action bar. aria-live announces it, and focus moves to its button.
export function FeedbackBanner(props: Props) {
  const reduce = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  const outfit = props.outfit ?? 'none';

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      aria-live="polite"
      className={clsx('rounded-2xl border-2 p-4', tone[props.kind])}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          {props.kind === 'correct' ? (
            <Mascot outfit={outfit} mood="cheer" className="size-14" decorative />
          ) : props.kind === 'wrong' ? (
            <Mascot outfit={outfit} mood="oops" className="size-14" decorative />
          ) : (
            <Mascot outfit={outfit} mood="happy" className="size-14" decorative />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {props.kind === 'correct' && (
            <>
              <p className="flex flex-wrap items-center gap-2 text-lg font-extrabold text-primary">
                <PartyPopper className="size-5" aria-hidden="true" />
                {props.title}
                {props.pointsEarned > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-bright px-2 py-0.5 text-xs font-extrabold text-deep">
                    <Star className="size-3 fill-current" aria-hidden="true" />
                    {en.game.plusPoints(props.pointsEarned)}
                  </span>
                )}
              </p>
              <p className="mt-1 text-base text-ink">{props.explanation}</p>
            </>
          )}
          {props.kind === 'wrong' && (
            <p className="flex items-center gap-2 pt-1 text-lg font-extrabold text-peach-ink">
              <Sprout className="size-5" aria-hidden="true" />
              {en.wrongBannerTitle}
            </p>
          )}
          {props.kind === 'skipped' && (
            <>
              <p className="text-lg font-extrabold text-deep">{en.skippedBannerTitle}</p>
              <p className="mt-1 text-sm font-semibold text-ink-soft">
                {en.game.skippedAnswerLabel}{' '}
                <span className="text-base font-extrabold text-deep">{props.correctLabel}</span>
              </p>
              <p className="mt-1 text-base text-ink">{props.explanation}</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-3">
        {props.kind === 'wrong' ? (
          <Button
            ref={buttonRef}
            variant="secondary"
            onClick={props.onTryAgain}
            className="w-full border-peach/60 text-peach-ink"
          >
            <RotateCcw className="size-5" aria-hidden="true" />
            {en.wrongBannerButton}
          </Button>
        ) : (
          <Button ref={buttonRef} onClick={props.onContinue} sfx="nav" className="w-full">
            {en.continueButton}
            <ArrowRight className="size-5" aria-hidden="true" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
