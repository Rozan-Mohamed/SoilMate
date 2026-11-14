import { apiFetch } from '@/lib/soilmate/api';
import { withPlannedMock } from '@/lib/soilmate/mock';
import type { Crop, Farm, Me, MetaOptions } from '@/lib/soilmate/types';
import {
  mockChangePassword,
  mockCrops,
  mockDeleteMe,
  mockGetFarm,
  mockGetMe,
  mockGetOptions,
  mockPatchFarm,
  mockPatchMe,
} from './mock';
import type {
  PasswordChangePayload,
  ProfileFarmPayload,
  ProfileMePayload,
} from './types';

/**
 * Profile endpoints (API contract section 2, 3, 4 and 5).
 * Every call goes through the shared Stage 0A client and the shared mock
 * adapter, so the real backend needs no special handling.
 */

/** GET /me — account only. */
export function fetchMe(): Promise<Me> {
  return withPlannedMock(
    () => apiFetch<Me>('/me', { auth: 'identity' }),
    () => mockGetMe(),
  );
}

/** PATCH /me — any subset of fullName and phone. */
export function updateMe(payload: ProfileMePayload): Promise<Me> {
  return withPlannedMock(
    () => apiFetch<Me>('/me', { method: 'PATCH', body: payload, auth: 'identity' }),
    () => mockPatchMe(payload),
  );
}

/** POST /me/password — 204 on success. */
export function changePassword(payload: PasswordChangePayload): Promise<void> {
  return withPlannedMock(
    () => apiFetch<void>('/me/password', { method: 'POST', body: payload, auth: 'identity' }),
    () => mockChangePassword(payload),
  );
}

/** DELETE /me — 204 on success. */
export function deleteMe(confirmEmail: string): Promise<void> {
  return withPlannedMock(
    () => apiFetch<void>('/me', { method: 'DELETE', body: { confirmEmail }, auth: 'identity' }),
    () => mockDeleteMe(confirmEmail),
  );
}

/** GET /farm — never 404; the empty farm is returned. */
export function fetchFarm(): Promise<Farm> {
  return withPlannedMock(
    () => apiFetch<Farm>('/farm', { auth: 'identity' }),
    () => mockGetFarm(),
  );
}

/** PATCH /farm — only the fields the Profile page owns. */
export function updateFarm(payload: ProfileFarmPayload): Promise<Farm> {
  return withPlannedMock(
    () => apiFetch<Farm>('/farm', { method: 'PATCH', body: payload, auth: 'identity' }),
    () => mockPatchFarm(payload),
  );
}

/** GET /meta/options — public, drives every dropdown and chip label. */
export function fetchOptions(): Promise<MetaOptions> {
  return withPlannedMock(
    () => apiFetch<MetaOptions>('/meta/options', { auth: 'none' }),
    () => mockGetOptions(),
  );
}

/** GET /crops?use=current — the crops that can be selected on the farm form. */
export function fetchCurrentCrops(): Promise<{ crops: Crop[] }> {
  return withPlannedMock(
    () => apiFetch<{ crops: Crop[] }>('/crops?use=current', { auth: 'none' }),
    () => ({ crops: mockCrops() }),
  );
}
