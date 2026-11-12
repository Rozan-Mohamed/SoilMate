'use client';

import { Star } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { en } from '@/strings/en';

export function StarCounter({ points }: { points: number }) {
  const shown = useCountUp(points);
  return (
    <span
      role="img"
      aria-label={en.game.pointsAria(points)}
      className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-1 text-sm font-extrabold text-peach-ink"
    >
      <Star className="size-4 fill-gold text-gold" aria-hidden="true" />
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}
