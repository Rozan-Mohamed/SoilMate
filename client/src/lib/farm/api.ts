import { apiFetch } from '@/lib/soilmate/api';
import type { Crop, MetaOptions } from '@/lib/soilmate/types';
import type { FarmPayload, FarmResponse } from './types';

/**
 * The My Farm endpoints (API contract sections 3, 4 and 5).
 *
 * GET /meta/options and GET /crops?use=current are public. The farm itself is
 * an 👤 endpoint: the token or the guest id is sent, so a guest can fill the
 * form too.
 *
 * The website API in server/ implements all of them, so they are called
 * directly: there is no planned mock for this feature any more.
 */

/** GET /farm — never 404; the empty farm is returned. */
export function fetchFarm(): Promise<FarmResponse> {
  return apiFetch<FarmResponse>('/farm', { auth: 'identity' });
}

/** GET /meta/options — public, drives every label of the form. */
export function fetchOptions(): Promise<MetaOptions> {
  return apiFetch<MetaOptions>('/meta/options', { auth: 'none' });
}

/** GET /crops?use=current — the crops that can be chosen on this form. */
export function fetchCurrentCrops(): Promise<{ crops: Crop[] }> {
  return apiFetch<{ crops: Crop[] }>('/crops?use=current', { auth: 'none' });
}

/**
 * PUT /farm — the whole form. The body never carries `centerId` and never
 * carries a key the contract does not know.
 */
export function saveFarm(payload: FarmPayload): Promise<FarmResponse> {
  return apiFetch<FarmResponse>('/farm', { method: 'PUT', body: payload, auth: 'identity' });
}
