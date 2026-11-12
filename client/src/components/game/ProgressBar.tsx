'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { en } from '@/strings/en';

type Props = { current: number; total: number; stage: number };

export function ProgressBar({ current, total, stage }: Props) {
  const reduce = useReducedMotion();
  const pct = Math.min(100, (current / total) * 100);
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-baseline justify-between text-xs font-bold text-ink-soft">
        <span>{en.game.stage(stage)}</span>
        <span className="text-deep">{en.progressLabel(current, total)}</span>
      </div>
      <div
        role="progressbar"
        aria-label={en.game.progressAria}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={en.game.questionLabel(current, total)}
        className="h-3 overflow-hidden rounded-full bg-mint-3"
      >
        <motion.div
          className="h-full rounded-full bg-bright"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 22 }}
        />
      </div>
    </div>
  );
}
