import { apiFetch } from '@/lib/soilmate/api';
import type {
  Farm,
  RotationLabMeta,
  RotationLabOptionsResponse,
  RotationLabPlansResponse,
  RotationLabSeason,
  RotationLabUiText,
} from './types';

/**
 * Rotation Lab (updated backend / Phase 1-2).
 *
 * Public, read-only data:
 * - GET /rotation-lab/options
 * - GET /rotation-lab/plans?center=&winter=&summer=
 * - GET /rotation-lab/meta
 * - GET /rotation-lab/ui-text
 *
 * Saving the farmer's rotation:
 * - PUT /farm/rotation { winter?, summer? } (identity)
 * - GET /farm (identity) to read the saved rotationInput and center
 */

export function fetchRotationLabOptions(): Promise<RotationLabOptionsResponse> {
  return apiFetch<RotationLabOptionsResponse>('/rotation-lab/options', { auth: 'none' });
}

export function fetchRotationLabMeta(): Promise<RotationLabMeta> {
  return apiFetch<RotationLabMeta>('/rotation-lab/meta', { auth: 'none' });
}

export function fetchRotationLabUiText(): Promise<RotationLabUiText> {
  return apiFetch<RotationLabUiText>('/rotation-lab/ui-text', { auth: 'none' });
}

export function lookupRotationLabPlans(params: {
  center: string;
  winter?: RotationLabSeason;
  summer?: RotationLabSeason;
}): Promise<RotationLabPlansResponse> {
  const q = new URLSearchParams({ center: params.center });
  if (params.winter) q.set('winter', params.winter);
  if (params.summer) q.set('summer', params.summer);
  return apiFetch<RotationLabPlansResponse>(`/rotation-lab/plans?${q.toString()}`, { auth: 'none' });
}

export function saveFarmRotation(body: {
  winter?: RotationLabSeason;
  summer?: RotationLabSeason;
}): Promise<Farm> {
  return apiFetch<Farm>('/farm/rotation', {
    method: 'PUT',
    body,
    auth: 'identity',
  });
}

export function fetchFarm(): Promise<Farm> {
  return apiFetch<Farm>('/farm', { auth: 'identity' });
}
