'use client';

import { Star } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { en } from '@/strings/en';

// A floating "+10" that rises and fades. `popId` changes on every award so it replays.
export function PointsPop({ points, popId }: { points: number; popId: number }) {
  const reduce = useReducedMotion();
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-28 z-20 -translate-x-1/2"
    >
      <AnimatePresence>
        {points > 0 && (
          <motion.span
            key={popId}
            initial={{ opacity: 0, y: reduce ? 0 : 6 }}
            animate={{ opacity: [0, 1, 1, 0], y: reduce ? 0 : -34 }}
            transition={{ duration: 1.3, times: [0, 0.15, 0.7, 1] }}
            className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-1 text-sm font-extrabold text-peach-ink shadow-card"
          >
            <Star className="size-3.5 fill-gold text-gold" />
            {en.game.plusPoints(points)}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
