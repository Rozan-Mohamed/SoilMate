'use client';

import { useEffect } from 'react';
import { Star } from 'lucide-react';
import clsx from 'clsx';
import { motion, useReducedMotion } from 'framer-motion';
import { playSfx } from '@/audio/store';
import { en } from '@/strings/en';

// Stars come straight from the API (0 to 3). They pop in one after another.
export function StarsRow({ stars }: { stars: number }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    const timers = Array.from({ length: stars }, (_, i) =>
      setTimeout(() => playSfx('star'), 500 + i * 380),
    );
    return () => timers.forEach(clearTimeout);
  }, [stars]);

  return (
    <div
      role="img"
      aria-label={en.result.starsAria(stars)}
      className="flex items-end justify-center gap-3"
    >
      {[0, 1, 2].map((i) => {
        const filled = i < stars;
        return (
          <motion.span
            key={i}
            initial={reduce ? false : { scale: 0, rotate: -30 }}
            animate={{ scale: i === 1 ? 1.15 : 1, rotate: 0 }}
            transition={{ delay: 0.5 + i * 0.38, type: 'spring', stiffness: 380, damping: 14 }}
            className={clsx(
              'grid place-items-center rounded-2xl border-2',
              i === 1 ? 'size-16' : 'size-14',
              filled ? 'border-gold bg-gold-soft' : 'border-mint-3 bg-mint-2',
            )}
          >
            <Star
              aria-hidden="true"
              className={clsx(
                i === 1 ? 'size-9' : 'size-8',
                filled ? 'fill-gold text-gold' : 'text-mint-3',
              )}
              strokeWidth={2.5}
            />
          </motion.span>
        );
      })}
    </div>
  );
}
