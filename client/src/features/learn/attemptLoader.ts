import { getCurrentAttempt, startAttempt } from '@/api/games.api';
import { isApiError } from '@/api/client';
import type { AttemptState, GameSlug } from '@/api/types';

type Loaded = { attempt: AttemptState; resumed: boolean };

async function load(slug: GameSlug): Promise<Loaded> {
  try {
    return { attempt: await getCurrentAttempt(slug), resumed: true };
  } catch (error) {
    // 404 simply means "no round in progress": start a fresh one.
    if (isApiError(error) && error.code === 'NOT_FOUND') {
      return { attempt: await startAttempt(slug), resumed: false };
    }
    throw error;
  }
}

// React Strict Mode runs effects twice in development. Without this, two "start" requests race
// and the server abandons the round the player is actually holding (answers then return 409).
// Both calls share one request instead.
const inflight = new Map<GameSlug, Promise<Loaded>>();

export function loadAttempt(slug: GameSlug): Promise<Loaded> {
  let promise = inflight.get(slug);
  if (!promise) {
    promise = load(slug).finally(() => inflight.delete(slug));
    inflight.set(slug, promise);
  }
  return promise;
}
