'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Star } from 'lucide-react';
import { useGamesQuery, useProgressQuery } from '@/api/queries';
import { resetProgress } from '@/api/players.api';
import { useGameStore } from '@/store/gameStore';
import { Mascot } from '@/components/game/Mascot';
import { GameCard, GameCardSkeleton } from '@/components/hub/GameCard';
import { MasterBadgeCard } from '@/components/hub/MasterBadgeCard';
import { SoundSwitches } from '@/components/hub/SoundSwitches';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Modal } from '@/components/ui/Modal';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { en } from '@/strings/en';

export function LearnHubPage() {
  const queryClient = useQueryClient();
  const games = useGamesQuery({ fresh: true });
  const progress = useProgressQuery({ fresh: true });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [done, setDone] = useState(false);

  const reset = useMutation({
    mutationFn: resetProgress,
    onSuccess: async () => {
      // Everything the player saw is now out of date, including any score screen kept in memory.
      useGameStore.getState().reset();
      queryClient.removeQueries({ queryKey: ['result'] });
      await Promise.all([games.refetch(), progress.refetch()]);
      setConfirmOpen(false);
      setDone(true);
    },
  });

  const failed = (games.isError || progress.isError) && !games.data;
  const retry = () => {
    void games.refetch();
    void progress.refetch();
  };

  return (
    <section className="mx-auto max-w-xl px-3 pb-12 pt-4 sm:px-4">
      <OfflineBanner />

      <header className="flex items-center gap-3 rounded-3xl border border-mint-3 bg-card p-4 shadow-card">
        <Mascot mood="happy" className="size-20 shrink-0" decorative />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-extrabold leading-tight text-deep">{en.hubTitle}</h1>
          <p className="text-base text-ink-soft">{en.hubSubtitle}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-2.5 py-1 text-sm font-extrabold text-peach-ink">
              <Star className="size-4 fill-gold text-gold" aria-hidden="true" />
              {progress.data ? en.hub.pointsChip(progress.data.totalPoints) : '…'}
            </span>
            <span className="text-xs font-bold text-ink-soft">{en.hubNewQuestionsLine}</span>
          </div>
        </div>
      </header>

      <div className="mt-3">
        <SoundSwitches />
      </div>

      {failed ? (
        <div className="mt-3 rounded-3xl border border-mint-3 bg-card shadow-card">
          <ErrorState onRetry={retry} />
        </div>
      ) : (
        <>
          <div className="mt-3">
            {progress.data && games.data ? (
              <MasterBadgeCard progress={progress.data} games={games.data} />
            ) : (
              <div
                aria-hidden="true"
                className="h-24 animate-pulse rounded-3xl border border-mint-3 bg-card shadow-card"
              />
            )}
          </div>

          <ul
            aria-label={en.hub.cardsLabel}
            aria-busy={!games.data}
            className="mt-3 flex flex-col gap-3"
          >
            {games.data
              ? [...games.data]
                  .sort((a, b) => a.position - b.position)
                  .map((game) => <GameCard key={game.slug} game={game} />)
              : Array.from({ length: 5 }, (_, i) => <GameCardSkeleton key={i} />)}
          </ul>
        </>
      )}

      <div className="mt-6 flex flex-col items-center gap-2">
        {done && (
          <p
            role="status"
            className="rounded-full bg-mint-2 px-4 py-1.5 text-sm font-bold text-primary"
          >
            {en.hub.resetDone}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setConfirmOpen(true);
          }}
          className="inline-flex min-h-10 items-center gap-1.5 px-3 text-sm font-bold text-ink-soft underline-offset-4 hover:text-deep hover:underline"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          {en.startOverLink}
        </button>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => !reset.isPending && setConfirmOpen(false)}
        labelledBy="reset-title"
      >
        <h2 id="reset-title" className="text-xl font-extrabold text-deep">
          {en.hub.resetTitle}
        </h2>
        <p className="mt-2 text-base text-ink-soft">{en.hub.resetText}</p>
        {reset.isError && (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-peach-soft px-3 py-2 text-sm font-bold text-peach-ink"
          >
            {en.errorState.text}
          </p>
        )}
        <div className="mt-5 flex flex-col gap-2.5">
          <Button onClick={() => reset.mutate()} disabled={reset.isPending}>
            {reset.isPending ? en.hub.resetting : en.hub.resetConfirm}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setConfirmOpen(false)}
            disabled={reset.isPending}
          >
            {en.hub.resetKeep}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
