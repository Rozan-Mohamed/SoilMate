import { apiFetch } from '@/lib/soilmate/api';
import { ApiError } from '@/lib/soilmate/errors';
import type { CenterId } from '@/lib/soilmate/types';
import type {
  AreaNote,
  CropHealthResponse,
  HeatStressResponse,
  LandRiskResponse,
  SoilMoistureResponse,
} from './types';

/**
 * The Explore Land layer detail endpoints (API contract section 6, "Layer
 * detail endpoints"). All of them are public, so no identity header is sent.
 *
 * The website API in server/ implements all of them, so they are called
 * directly: there is no planned mock for this feature any more.
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

/**
 * GET /centers/:centerId/layers/crop-health
 *
 * `?include=monthly` adds the 123-month series. It is only sent when the
 * caller asks for it; the contract rejects any other value of `include` with
 * 400 VALIDATION_ERROR and `details: { include: ... }`.
 */
export function fetchCropHealth(
  centerId: CenterId,
  options: { includeMonthly?: boolean } = {},
): Promise<CropHealthResponse> {
  const query = options.includeMonthly ? '?include=monthly' : '';

  return withRateLimitRetry(() =>
    apiFetch<CropHealthResponse>(`/centers/${centerId}/layers/crop-health${query}`, {
      auth: 'none',
    }),
  );
}

/** GET /centers/:centerId/layers/soil-moisture */
export function fetchSoilMoisture(centerId: CenterId): Promise<SoilMoistureResponse> {
  return withRateLimitRetry(() =>
    apiFetch<SoilMoistureResponse>(`/centers/${centerId}/layers/soil-moisture`, { auth: 'none' }),
  );
}

/** GET /centers/:centerId/layers/heat-stress */
export function fetchHeatStress(centerId: CenterId): Promise<HeatStressResponse> {
  return withRateLimitRetry(() =>
    apiFetch<HeatStressResponse>(`/centers/${centerId}/layers/heat-stress`, { auth: 'none' }),
  );
}

/** GET /centers/:centerId/layers/land-risk */
export function fetchLandRisk(centerId: CenterId): Promise<LandRiskResponse> {
  return withRateLimitRetry(() =>
    apiFetch<LandRiskResponse>(`/centers/${centerId}/layers/land-risk`, { auth: 'none' }),
  );
}

/**
 * The area warning and the reading month of the selected area. The detail
 * responses carry `dataThrough`, but not the warning, so it comes from the
 * overview of the same area.
 */
export function fetchAreaNote(centerId: CenterId): Promise<AreaNote> {
  return withRateLimitRetry(async () => {
    const overview = await apiFetch<{
      center: { name: string };
      areaWarning: string;
      dataThrough: { cropHealth: string };
    }>(`/centers/${centerId}/overview`, { auth: 'none' });

    return {
      areaWarning: overview.areaWarning,
      dataThrough: overview.dataThrough?.cropHealth ?? null,
      centerName: overview.center.name,
      centerId,
    };
  });
}
