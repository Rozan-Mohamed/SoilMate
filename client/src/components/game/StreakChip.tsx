'use client';

import { Flame } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { en } from '@/strings/en';

// Only appears from 2 in a row. Bounces a little each time it grows.
export function StreakChip({ streak }: { streak: number }) {
  return (
    <AnimatePresence>
      {streak >= 2 && (
        <motion.span
          key={streak}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          aria-label={en.game.streakAria(streak)}
          className="inline-flex items-center gap-1.5 rounded-full border border-peach/40 bg-peach-soft px-3 py-1 text-sm font-bold text-peach-ink"
        >
          <Flame className="size-4 text-peach" aria-hidden="true" />
          {en.streakChip(streak)}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
