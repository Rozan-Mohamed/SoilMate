'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { complete } from '@/api/attempts.api';
import { startAttempt } from '@/api/games.api';
import { isApiError } from '@/api/client';
import { queryKeys } from '@/api/queries';
import type { GameSlug } from '@/api/types';
import { useGameStore } from '@/store/gameStore';
import { GAME_BY_SLUG } from '../gameConfig';
import { ResultShell } from '@/components/result/ResultShell';
import { StarsRow } from '@/components/result/StarsRow';
import { ScoreRing } from '@/components/result/ScoreRing';
import { CollectionGrid } from '@/components/result/CollectionGrid';
import { RecapChips } from '@/components/result/RecapChips';
import { RewardChips } from '@/components/result/RewardChips';
import { ResultButtons } from '@/components/result/ResultButtons';
import { FinaleSection } from '@/components/result/FinaleSection';
import { RainbowHero } from '@/components/result/RainbowHero';
import { Icon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { en } from '@/strings/en';

type Props = { slug: GameSlug; attemptId?: string };

export function GameResultPage({ slug, attemptId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const config = GAME_BY_SLUG[slug];
  const [playingAgain, setPlayingAgain] = useState(false);

  // The result is normally already in memory. After a refresh it is fetched again:
  // complete() is idempotent on the server, so asking twice never double counts.
  const stored = useGameStore((s) => s.result);
  const inMemory =
    stored && stored.gameSlug === slug && (!attemptId || stored.attemptId === attemptId)
      ? stored
      : null;

  const refetch = useQuery({
    queryKey: ['result', attemptId],
    queryFn: () => complete(attemptId as string),
    enabled: !inMemory && Boolean(attemptId),
    retry: 0,
    staleTime: Infinity,
  });

  const result = inMemory ?? refetch.data ?? null;
  const networkProblem =
    refetch.isError && isApiError(refetch.error) && refetch.error.code === 'NETWORK';
  const missing = !inMemory && (!attemptId || (refetch.isError && !networkProblem));

  // No completed result to show: send the player back to the game (as the steps require).
  useEffect(() => {
    if (missing) router.replace(`/learn/${slug}`);
  }, [missing, router, slug]);

  const playAgain = async () => {
    setPlayingAgain(true);
    try {
      await startAttempt(slug); // the server abandons the old round and builds a new one
      useGameStore.getState().reset();
      void queryClient.invalidateQueries({ queryKey: queryKeys.games });
      router.push(`/learn/${slug}`);
    } catch {
      setPlayingAgain(false);
    }
  };

  let content: React.ReactNode;
  if (networkProblem) {
    content = <ErrorState onRetry={() => void refetch.refetch()} />;
  } else if (!result) {
    content = <Spinner label={en.result.loading} />;
  } else {
    const nextConfig = config.nextGame;
    content = (
      <ResultShell
        outfit={config.mascotOutfit}
        mood={config.resultMascotMood}
        hero={
          config.resultHeroIconKey ? (
            <Icon name={config.resultHeroIconKey} className="h-32 w-auto" label={config.title} />
          ) : config.resultRainbow ? (
            <RainbowHero outfit={config.mascotOutfit} mood={config.resultMascotMood} />
          ) : undefined
        }
        title={config.resultTitle}
        bigMessage={config.resultBigMessage}
        subtitle={config.resultSubtitle}
        celebrateKey={result.attemptId}
        confettiStyle={config.confetti}
        big={Boolean(result.finale?.allGamesDone)}
      >
        <StarsRow stars={result.stars} />
        <div className="flex flex-col items-center gap-2">
          <ScoreRing score={result.score} total={result.total} />
          <p className="text-base font-extrabold text-deep">
            {config.resultScoreLine(result.score)}
          </p>
        </div>

        {result.recap && result.recap.length > 0 ? (
          <RecapChips chips={result.recap} />
        ) : (
          <CollectionGrid
            items={result.collection}
            title={config.collectionTitle}
            missedMark={
              config.collectionKind === 'terms' || config.collectionKind === 'fieldTiles'
                ? 'dot'
                : 'lock'
            }
          />
        )}

        <RewardChips points={result.points} bestStreak={result.bestStreak} badge={result.badge} />

        {result.finale ? (
          <FinaleSection
            finale={result.finale}
            playingAgain={playingAgain}
            onPlayAgain={playAgain}
          />
        ) : (
          <ResultButtons
            next={
              result.nextGame && nextConfig
                ? {
                    slug: result.nextGame.slug,
                    title: result.nextGame.title,
                    iconKey: nextConfig.buttonIconKey,
                  }
                : null
            }
            playingAgain={playingAgain}
            onPlayAgain={playAgain}
          />
        )}
      </ResultShell>
    );
  }

  return <section className="mx-auto max-w-xl px-3 pb-10 pt-4 sm:px-4">{content}</section>;
}
