'use client';

import { Heart } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { en } from '@/strings/en';

const MAX = 3;

export function Hearts({ hearts }: { hearts: number }) {
  const reduce = useReducedMotion();
  return (
    <div role="img" aria-label={en.game.heartsLeft(hearts)} className="flex items-center gap-0.5">
      {Array.from({ length: MAX }, (_, i) => {
        const full = i < hearts;
        return (
          // Re-keyed when the state flips so the lost heart pops.
          <motion.span
            key={`${i}-${full}`}
            initial={reduce || full ? false : { scale: 1.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 14 }}
            className="grid size-6 place-items-center"
          >
            <Heart
              aria-hidden="true"
              className={full ? 'size-5 fill-heart text-heart' : 'size-5 text-mint-3'}
              strokeWidth={full ? 2 : 2.5}
            />
          </motion.span>
        );
      })}
    </div>
  );
}
