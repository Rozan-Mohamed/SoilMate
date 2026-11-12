import clsx from 'clsx';
import { Lock } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { en } from '@/strings/en';
import type { GameSummary, ProgressResponse } from '@/api/types';

type Props = { progress: ProgressResponse; games: GameSummary[] };

// The Soil Expert badge: locked until all 5 game badges are earned (data: GET /players/me/progress).
export function MasterBadgeCard({ progress, games }: Props) {
  const { masterBadge } = progress;
  const earnedCount = games.filter((g) => g.best.badgeEarned).length;

  return (
    <section
      aria-labelledby="master-title"
      className={clsx(
        'rounded-3xl border p-4 shadow-card',
        masterBadge.earned ? 'border-gold/60 bg-gold-soft/60' : 'border-mint-3 bg-card',
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={clsx(
            'relative grid size-16 shrink-0 place-items-center rounded-full border-2 bg-white',
            masterBadge.earned ? 'border-gold' : 'border-mint-3',
          )}
        >
          <span
            className={clsx(
              'grid place-items-center',
              !masterBadge.earned && 'opacity-40 grayscale',
            )}
          >
            <Icon name={masterBadge.iconKey} className="size-11" />
          </span>
          {!masterBadge.earned && (
            <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-ink-soft text-white">
              <Lock className="size-3.5" aria-hidden="true" />
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="master-title" className="text-xl font-extrabold text-deep">
            {en.hub.masterTitle}
          </h2>
          <p className="text-sm text-ink-soft">
            {masterBadge.earned ? en.hub.masterEarned : en.hub.masterLocked}
          </p>
          <p className="mt-1 text-xs font-bold text-primary">
            {en.hub.badgesProgress(earnedCount)} · {en.hub.gamesDone(progress.gamesDone)}
          </p>
        </div>
      </div>
    </section>
  );
}
