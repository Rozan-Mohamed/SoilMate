'use client';

import { Check, Circle, Minus } from 'lucide-react';
import clsx from 'clsx';
import { motion, useReducedMotion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { en } from '@/strings/en';
import type { Choice } from '@/api/types';

export type AnswerState = 'default' | 'selected' | 'correct' | 'wrong' | 'disabled';

type Props = {
  choice: Choice;
  state: AnswerState;
  /** row = icon left, label right (Game 1). tile = icon on top (Games 2 to 5). */
  layout?: 'row' | 'tile';
  hotkey?: number;
  onSelect: (key: string) => void;
};

const stateClasses: Record<AnswerState, string> = {
  default: 'border-mint-3 bg-white hover:bg-mint-2',
  selected: 'border-deep bg-white ring-2 ring-deep/10',
  correct: 'border-primary bg-bright/40',
  wrong: 'border-peach bg-peach-soft text-peach-ink',
  disabled: 'border-mint-3 bg-white opacity-50',
};

export function AnswerButton({ choice, state, layout = 'row', hotkey, onSelect }: Props) {
  const reduce = useReducedMotion();
  const locked = state === 'correct' || state === 'wrong' || state === 'disabled';

  return (
    <motion.button
      type="button"
      aria-pressed={state === 'selected'}
      // Wrong/disabled choices stay in the page but cannot be used again.
      disabled={state === 'wrong' || state === 'disabled'}
      aria-disabled={locked}
      onClick={() => !locked && onSelect(choice.key)}
      animate={state === 'wrong' && !reduce ? { x: [0, -9, 9, -6, 6, 0] } : { x: 0 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        'relative flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left',
        'shadow-press-soft transition-colors duration-150 select-none',
        layout === 'tile' &&
          'sm:min-h-32 sm:flex-col sm:justify-center sm:px-2 sm:py-4 sm:text-center',
        stateClasses[state],
        state === 'correct' ? 'text-deep' : state !== 'wrong' && 'text-ink',
        !locked && 'active:translate-y-0.5 active:shadow-none',
      )}
    >
      <span
        className={clsx(
          'grid shrink-0 place-items-center rounded-full bg-mint-2',
          layout === 'tile' ? 'size-10 sm:size-14' : 'size-10',
        )}
      >
        <Icon
          name={choice.iconKey}
          className={layout === 'tile' ? 'size-7 sm:size-10' : 'size-6'}
        />
      </span>
      <span
        className={clsx(
          'flex-1 text-base font-bold leading-snug sm:text-lg',
          layout === 'tile' && 'sm:flex-none',
        )}
      >
        {choice.label}
      </span>

      {/* State is never colour alone: each state has its own mark and screen-reader text. */}
      <span
        aria-hidden="true"
        className={clsx(
          'grid size-7 shrink-0 place-items-center rounded-full',
          layout === 'tile' && 'sm:absolute sm:right-2 sm:top-2',
        )}
      >
        {state === 'correct' ? (
          <span className="grid size-7 place-items-center rounded-full bg-primary text-white">
            <Check className="size-4" strokeWidth={3} />
          </span>
        ) : state === 'wrong' ? (
          <span className="grid size-7 place-items-center rounded-full bg-peach text-white">
            <Minus className="size-4" strokeWidth={3} />
          </span>
        ) : state === 'selected' ? (
          <span className="grid size-7 place-items-center rounded-full bg-deep text-white">
            <Check className="size-4" strokeWidth={3} />
          </span>
        ) : (
          <Circle className="size-6 text-mint-3" strokeWidth={2.5} />
        )}
      </span>
      {state === 'correct' && <span className="sr-only">{en.game.correctChoice}</span>}
      {state === 'wrong' && <span className="sr-only">{en.game.wrongChoice}</span>}
      {hotkey !== undefined && <kbd className="sr-only">{hotkey}</kbd>}
    </motion.button>
  );
}
