import { apiRequest } from './client';
import type { AttemptState, GameSlug, GameSummary } from './types';

export const listGames = () => apiRequest<{ games: GameSummary[] }>('/games').then((r) => r.games);

export const startAttempt = (slug: GameSlug) =>
  apiRequest<AttemptState>(`/games/${slug}/attempts`, { method: 'POST' });

/** Throws ApiError with status 404 / code NOT_FOUND when there is no active attempt. */
export const getCurrentAttempt = (slug: GameSlug) =>
  apiRequest<AttemptState>(`/games/${slug}/attempts/current`);
