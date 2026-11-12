'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { CircleCheck, House, Leaf, Lock, Map, RotateCcw, Star, Trophy } from 'lucide-react';
import { useGamesQuery } from '@/api/queries';
import { playSfx } from '@/audio/store';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { GAME_BY_SLUG } from '@/features/learn/gameConfig';
import { en } from '@/strings/en';
import type { FinaleData } from '@/api/types';

type Props = { finale: FinaleData; playingAgain: boolean; onPlayAgain: () => void };

// Shown under the Game 5 score. Everything comes from the finale object the API returned.
export function FinaleSection({ finale, playingAgain, onPlayAgain }: Props) {
  const { data: games } = useGamesQuery();
  const nextUnfinished = games?.find((g) => !g.best.completed);

  return (
    <section className="flex flex-col gap-4">
      {/* divider with a small leaf */}
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-mint-3" />
        <Leaf className="size-4 text-leaf" />
        <span className="h-px flex-1 bg-mint-3" />
      </div>

      <div className="rounded-2xl border border-primary/25 bg-mint-2/70 p-4 text-center">
        <span className="mx-auto mb-2 grid size-11 place-items-center rounded-full bg-bright text-deep">
          {finale.allGamesDone ? (
            <Trophy className="size-6" aria-hidden="true" />
          ) : (
            <Star className="size-6" aria-hidden="true" />
          )}
        </span>
        <h2 className="text-2xl font-extrabold text-deep">
          {finale.allGamesDone ? en.finale.doneTitle : en.finale.notDoneTitle}
        </h2>
        <p className="mt-0.5 text-base text-ink-soft">
          {finale.allGamesDone ? en.finale.doneSubtitle : en.finale.keepGoingText}
        </p>

        <ul aria-label={en.finale.badgesLabel} className="mt-4 grid grid-cols-5 items-start gap-1">
          {finale.badges.map((badge) => (
            <li key={badge.gameSlug} className="flex flex-col items-center gap-1 text-center">
              <span
                className={clsx(
                  'relative grid size-12 place-items-center rounded-full border-2 bg-white sm:size-14',
                  badge.earned ? 'border-gold/70' : 'border-mint-3',
                )}
              >
                <span
                  className={clsx(
                    'grid place-items-center',
                    !badge.earned && 'opacity-40 grayscale',
                  )}
                >
                  <Icon name={badge.iconKey} className="size-8 sm:size-9" />
                </span>
                {!badge.earned && (
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-ink-soft text-white">
                    <Lock className="size-3" aria-hidden="true" />
                  </span>
                )}
              </span>
              <span
                className={clsx(
                  'text-[11px] font-bold leading-tight',
                  badge.earned ? 'text-deep' : 'text-ink-soft',
                )}
              >
                {badge.name}
              </span>
              <span className="sr-only">
                {badge.earned ? en.result.collectionEarned : en.lockedBadgeHint}
              </span>
            </li>
          ))}
        </ul>

        {finale.allGamesDone && (
          <ul className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <li className="inline-flex items-center gap-1.5 rounded-full border border-peach/40 bg-peach-soft px-3 py-1.5 text-sm font-extrabold text-peach-ink">
              <Star className="size-4 fill-gold text-gold" aria-hidden="true" />
              {en.finale.totalPointsChip(finale.totalPoints)}
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-white px-3 py-1.5 text-sm font-extrabold text-primary">
              <CircleCheck className="size-4" aria-hidden="true" />
              {en.finale.gamesDoneChip}
            </li>
            <li
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-extrabold',
                finale.masterBadge.earned
                  ? 'border-gold/60 bg-gold-soft text-deep'
                  : 'border-mint-3 bg-white text-ink-soft',
              )}
            >
              {finale.masterBadge.earned ? (
                <Icon name={finale.masterBadge.iconKey} className="size-5" />
              ) : (
                <Lock className="size-4" aria-hidden="true" />
              )}
              {en.finale.masterBadgeChip}
            </li>
          </ul>
        )}
      </div>

      <div className="flex flex-col items-stretch gap-2.5">
        {finale.allGamesDone ? (
          <>
            <Button href="/" sfx="nav">
              <House className="size-5" aria-hidden="true" />
              {en.finale.backHomeButton}
            </Button>
            <Button href="/explore" variant="secondary" sfx="nav">
              <Map className="size-5" aria-hidden="true" />
              {en.finale.exploreButton}
            </Button>
          </>
        ) : (
          <Button href={nextUnfinished ? `/learn/${nextUnfinished.slug}` : '/learn'} sfx="nav">
            {nextUnfinished
              ? en.finale.nextUnfinished(GAME_BY_SLUG[nextUnfinished.slug].title)
              : en.backToGamesButton}
          </Button>
        )}
        <button
          type="button"
          onClick={onPlayAgain}
          disabled={playingAgain}
          className="mx-auto inline-flex min-h-10 items-center gap-1.5 px-3 text-base font-bold text-ink-soft hover:text-deep disabled:opacity-50"
        >
          <RotateCcw
            className={playingAgain ? 'size-4 animate-spin' : 'size-4'}
            aria-hidden="true"
          />
          {en.playAgainButton}
        </button>
        {!finale.allGamesDone && (
          <Link
            href="/learn"
            onClick={() => playSfx('nav')}
            className="mx-auto min-h-10 px-3 py-2 text-sm font-bold text-ink-soft hover:text-deep"
          >
            {en.backToGamesButton}
          </Link>
        )}
      </div>
    </section>
  );
}
