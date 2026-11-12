import { Flame, Lock, Star } from 'lucide-react';
import clsx from 'clsx';
import { Icon } from '@/components/ui/Icon';
import { en } from '@/strings/en';
import type { Badge } from '@/api/types';

type Props = { points: number; bestStreak: number; badge: Badge };

export function RewardChips({ points, bestStreak, badge }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li className="inline-flex items-center gap-1.5 rounded-full border border-peach/40 bg-peach-soft px-3 py-1.5 text-sm font-extrabold text-peach-ink">
          <Star className="size-4 fill-gold text-gold" aria-hidden="true" />
          {en.pointsChip(points)}
        </li>
        <li className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-mint-2 px-3 py-1.5 text-sm font-extrabold text-primary">
          <Flame className="size-4" aria-hidden="true" />
          {en.streakChip(bestStreak)}
        </li>
        <li
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-extrabold',
            badge.earned
              ? 'border-gold/60 bg-gold-soft text-deep'
              : 'border-mint-3 bg-mint-2 text-ink-soft opacity-80',
          )}
        >
          {badge.earned ? (
            <Icon name={badge.iconKey} className="size-5" />
          ) : (
            <Lock className="size-4" aria-hidden="true" />
          )}
          {en.result.badgeChip(badge.name)}
        </li>
      </ul>
      {!badge.earned && <p className="text-sm font-semibold text-ink-soft">{en.lockedBadgeHint}</p>}
    </div>
  );
}
