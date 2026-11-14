import { apiFetch } from '@/lib/soilmate/api';
import { ApiError } from '@/lib/soilmate/errors';
import type { CenterId } from '@/lib/soilmate/types';
import type {
  CenterOverview,
  CentersResponse,
  MapLayerData,
  MapLayersResponse,
} from './types';

/**
 * Explore Land endpoints (API contract section 6).
 *
 * The website API in server/ implements all of them, so they are called
 * directly: there is no planned mock for this feature any more.
 *
 * The 429 handling is the one of the contract: a rate limit is answered with
 * the standard RateLimit-* headers, and the frontend waits for
 * "RateLimit-Reset" seconds and tries once more.
 */
async function withRateLimitRetry<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if (err instanceof ApiError && err.status === 429) {
      const seconds = Number(err.headers?.['ratelimit-reset']);
      if (Number.isFinite(seconds) && seconds > 0 && seconds <= 120) {
        await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
        return run();
      }
    }
    throw err;
  }
}

/** GET /centers?q= — public. An empty result is not an error. */
export function fetchCenters(query?: string): Promise<CentersResponse> {
  const trimmed = (query ?? '').trim().slice(0, 100);
  const path = trimmed ? `/centers?q=${encodeURIComponent(trimmed)}` : '/centers';

  return withRateLimitRetry(() => apiFetch<CentersResponse>(path, { auth: 'none' }));
}

/** GET /map/layers — public. */
export function fetchMapLayers(): Promise<MapLayersResponse> {
  return withRateLimitRetry(() => apiFetch<MapLayersResponse>('/map/layers', { auth: 'none' }));
}

/** GET /map/layers/:layerId — public. */
export function fetchMapLayer(layerId: string): Promise<MapLayerData> {
  return withRateLimitRetry(() =>
    apiFetch<MapLayerData>(`/map/layers/${layerId}`, { auth: 'none' }),
  );
}

/** GET /centers/:centerId/overview — public. */
export function fetchCenterOverview(centerId: CenterId): Promise<CenterOverview> {
  return withRateLimitRetry(() =>
    apiFetch<CenterOverview>(`/centers/${centerId}/overview`, { auth: 'none' }),
  );
}

/** PUT /farm/center — the only identity call on this page (guests included). */
export function setFarmCenter(centerId: CenterId): Promise<unknown> {
  return withRateLimitRetry(() =>
    apiFetch('/farm/center', { method: 'PUT', body: { centerId }, auth: 'identity' }),
  );
}
