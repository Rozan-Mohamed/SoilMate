import clsx from 'clsx';
import { Lock, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { GAME_BY_SLUG } from '@/features/learn/gameConfig';
import { en } from '@/strings/en';
import type { GameSummary } from '@/api/types';

function StarsInline({ stars }: { stars: number }) {
  return (
    <span
      role="img"
      aria-label={en.hub.statusStars(stars)}
      className="inline-flex items-center gap-0.5"
    >
      {[0, 1, 2].map((i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={clsx('size-4', i < stars ? 'fill-gold text-gold' : 'text-mint-3')}
          strokeWidth={2.5}
        />
      ))}
    </span>
  );
}

// One hub card. Everything shown comes from GET /games (GameSummary).
export function GameCard({ game }: { game: GameSummary }) {
  const config = GAME_BY_SLUG[game.slug];
  const { best } = game;
  const started = best.completed || game.questionsSeen > 0;
  const chip =
    game.slug === 'match-the-word'
      ? en.hub.termsChip(game.poolSize, game.questionsPerRound)
      : en.hub.questionsChip(game.poolSize, game.questionsPerRound);

  return (
    <li className="rounded-3xl border border-mint-3 bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-mint-2">
          <Icon name={config.hubIconKey} className="size-9" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold leading-tight text-deep">
            <span className="mr-1.5 text-ink-soft">{game.position}.</span>
            {game.title}
          </h2>
          <p className="mt-1 text-sm font-bold text-ink-soft">
            {best.completed ? (
              <StarsInline stars={best.stars ?? 0} />
            ) : started ? (
              en.hub.statusInProgress
            ) : (
              en.hub.statusNotStarted
            )}
          </p>
        </div>

        <span
          className={clsx(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-extrabold',
            best.badgeEarned
              ? 'border-gold/60 bg-gold-soft text-deep'
              : 'border-mint-3 bg-mint-2 text-ink-soft',
          )}
        >
          {best.badgeEarned ? (
            <Icon name={game.badge.iconKey} className="size-4" />
          ) : (
            <Lock className="size-3.5" aria-hidden="true" />
          )}
          <span className="max-w-[7rem] truncate">{game.badge.name}</span>
          <span className="sr-only">
            {best.badgeEarned ? en.result.collectionEarned : en.lockedBadgeHint}
          </span>
        </span>
      </div>

      <ul className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-ink-soft">
        <li className="rounded-full bg-mint-2 px-2.5 py-1">{chip}</li>
        <li className="rounded-full bg-mint-2 px-2.5 py-1">
          {en.hub.seenChip(game.questionsSeen, game.poolSize)}
        </li>
      </ul>

      <Button
        href={`/learn/${game.slug}`}
        variant={best.completed ? 'secondary' : 'primary'}
        sfx="nav"
        className="mt-4 w-full"
      >
        {best.completed ? en.hub.playAgain : en.hub.play}
      </Button>
    </li>
  );
}

export function GameCardSkeleton() {
  return (
    <li
      aria-hidden="true"
      className="animate-pulse rounded-3xl border border-mint-3 bg-card p-4 shadow-card"
    >
      <div className="flex items-start gap-3">
        <span className="size-14 rounded-2xl bg-mint-2" />
        <div className="flex-1 space-y-2 pt-1">
          <span className="block h-5 w-2/3 rounded-full bg-mint-2" />
          <span className="block h-4 w-1/3 rounded-full bg-mint-2" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <span className="h-6 w-28 rounded-full bg-mint-2" />
        <span className="h-6 w-20 rounded-full bg-mint-2" />
      </div>
      <span className="mt-4 block h-12 rounded-btn bg-mint-2" />
    </li>
  );
}
