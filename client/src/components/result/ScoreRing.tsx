'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { en } from '@/strings/en';

export function ScoreRing({ score, total }: { score: number; total: number }) {
  const reduce = useReducedMotion();
  const fraction = total > 0 ? score / total : 0;
  return (
    <div
      role="img"
      aria-label={en.result.scoreAria(score, total)}
      className="relative mx-auto grid size-28 place-items-center"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#d4ece0" strokeWidth="9" />
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#006c4a"
          strokeWidth="9"
          strokeLinecap="round"
          initial={{ pathLength: reduce ? fraction : 0 }}
          animate={{ pathLength: fraction }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
        />
      </svg>
      <span aria-hidden="true" className="text-3xl font-extrabold text-deep">
        {score}
        <span className="text-xl text-ink-soft"> / {total}</span>
      </span>
    </div>
  );
}
