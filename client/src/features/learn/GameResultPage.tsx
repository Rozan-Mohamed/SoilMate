'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { CollectionItem, GameSlug } from '@/api/types';
import { Mascot } from '@/components/game/Mascot';
import { GameShell } from '@/components/game/GameShell';
import { CollectionGrid } from '@/components/result/CollectionGrid';
import { RecapChips } from '@/components/result/RecapChips';
import { ResultButtons } from '@/components/result/ResultButtons';
import { RewardChips } from '@/components/result/RewardChips';
import { ScoreRing } from '@/components/result/ScoreRing';
import { StarsRow } from '@/components/result/StarsRow';
import { CardSpinner } from '@/components/ui/Spinner';
import { useSpeech } from '@/hooks/useSpeech';
import { ensureStoredResult, useGameStore } from '@/store/gameStore';
import { en } from '@/strings/en';
import { GAME_BY_SLUG, type CollectionKind } from './gameConfig';

const COLLECTION_TITLES: Record<Exclude<CollectionKind, 'none'>, string> = {
  terms: en.result.wordsReviewed,
  powerBadges: 'Collected powers',
  fieldTiles: 'Field treatments',
  weatherStickers: 'Weather sticker collection',
};

// Terms and tiles show a soft orange dot when missed; badges and stickers show a lock.
const MISSED_STYLE: Record<Exclude<CollectionKind, 'none'>, 'dot' | 'lock'> = {
  terms: 'dot',
  powerBadges: 'lock',
  fieldTiles: 'dot',
  weatherStickers: 'lock',
};

async function fireConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const { default: confetti } = await import('canvas-confetti');
  const colors = ['#48b080', '#90f4c0', '#006c4a', '#f5b50a'];
  confetti({ particleCount: 90, spread: 75, origin: { y: 0.28 }, colors, disableForReducedMotion: true });
  window.setTimeout(
    () => confetti({ particleCount: 50, spread: 100, origin: { y: 0.3 }, colors, scalar: 0.8 }),
    350,
  );
}

export function GameResultPage({ slug }: { slug: GameSlug }) {
  const router = useRouter();
  const game = GAME_BY_SLUG[slug];
  const result = useGameStore((s) => s.result);
  const { speak } = useSpeech();

  // The result lives in memory (and sessionStorage for a refresh). Without it, go back to the game.
  // ensureStoredResult fills the store when it can, which re-renders this page with the result.
  useEffect(() => {
    if (!ensureStoredResult(slug)) router.replace(`/learn/${slug}`);
  }, [slug, router]);

  const present = result?.gameSlug === slug;
  useEffect(() => {
    if (present) void fireConfetti();
  }, [present]);

  if (!present || !result) {
    return (
      <GameShell>
        <CardSpinner />
      </GameShell>
    );
  }

  const playAgain = () => {
    // The finished attempt is gone on the server, so the play screen simply starts a new round.
    useGameStore.getState().reset();
    router.push(`/learn/${slug}`);
  };

  const kind = game.collectionKind;
  const earnedCount = result.collection.filter((c) => c.earned).length;
  const nextGame = result.nextGame && game.nextGame
    ? {
        href: `/learn/${result.nextGame.slug}`,
        label: game.nextGame.buttonLabel,
        iconKey: game.nextGame.buttonIconKey,
      }
    : undefined;

  return (
    <GameShell className="pb-16 sm:pb-16">
      <motion.section
        aria-labelledby="result-title"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        className="flex flex-col gap-5 rounded-card bg-card p-5 text-center shadow-card sm:p-8"
      >
        <div className="flex flex-col items-center gap-2">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1.2, repeat: 2, ease: 'easeInOut' }}
          >
            <Mascot outfit={game.mascotOutfit} mood={game.resultMascotMood} className="size-32" />
          </motion.div>
          <p className="rounded-full bg-bright px-3 py-1 text-xs font-extrabold tracking-wide text-deep uppercase">
            {en.result.gameComplete(game.position)}
          </p>
          <h1 id="result-title" className="text-3xl font-extrabold text-deep sm:text-4xl">
            {game.resultTitle}
          </h1>
          {game.resultBigMessage && (
            <p className="text-lg font-extrabold text-deep">{game.resultBigMessage}</p>
          )}
          {game.resultSubtitle && <p className="text-base text-ink-soft">{game.resultSubtitle}</p>}
        </div>

        <StarsRow stars={result.stars} />

        <div className="flex items-center justify-center gap-4 rounded-2xl border border-mint-3 bg-mint-2/60 p-4 text-left">
          <ScoreRing score={result.score} total={result.total} />
          <p className="text-lg font-extrabold text-deep">{game.resultScoreLine(result.score)}</p>
        </div>

        <RewardChips points={result.points} bestStreak={result.bestStreak} badge={result.badge} />

        {kind !== 'none' && (
          <CollectionGrid
            title={COLLECTION_TITLES[kind]}
            aside={
              kind === 'terms'
                ? en.result.tapToReplay
                : `${earnedCount} of ${result.collection.length}`
            }
            items={result.collection}
            missed={MISSED_STYLE[kind]}
            onItemClick={kind === 'terms' ? (item: CollectionItem) => speak(item.label) : undefined}
          />
        )}

        {result.recap && <RecapChips chips={result.recap} />}

        {/* Game 5: the finale section is added in stage 5 (result.finale is already typed). */}

        <ResultButtons next={nextGame} onPlayAgain={playAgain} />
      </motion.section>
    </GameShell>
  );
}
