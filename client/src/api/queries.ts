import { useQuery } from '@tanstack/react-query';
import { listGames } from './games.api';
import { getProgress } from './players.api';

export const queryKeys = {
  games: ['games'] as const,
  progress: ['progress'] as const,
};

type QueryOptions = {
  /** Refetch every time the component mounts, even if the data is still fresh (the hub uses this). */
  fresh?: boolean;
};

// Attempt data is NOT cached here: the game store owns it.
export const useGamesQuery = ({ fresh = false }: QueryOptions = {}) =>
  useQuery({
    queryKey: queryKeys.games,
    queryFn: listGames,
    staleTime: 30_000,
    retry: 1,
    refetchOnMount: fresh ? 'always' : true,
  });

export const useProgressQuery = ({ fresh = false }: QueryOptions = {}) =>
  useQuery({
    queryKey: queryKeys.progress,
    queryFn: getProgress,
    staleTime: 30_000,
    retry: 1,
    refetchOnMount: fresh ? 'always' : true,
  });
