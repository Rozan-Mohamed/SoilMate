import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearGuestId } from '@/lib/soilmate/guest';
import { clearToken, setToken } from '@/lib/soilmate/token';
import {
  changePassword,
  deleteMe,
  fetchCurrentCrops,
  fetchFarm,
  fetchMe,
  fetchOptions,
  updateFarm,
  updateMe,
} from './api';

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

type FetchInit = RequestInit & { headers: Headers };
const callInit = (fetchMock: ReturnType<typeof vi.fn<typeof fetch>>, call = 0) =>
  fetchMock.mock.calls[call][1] as FetchInit;

describe('profile API', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    clearToken();
    clearGuestId();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearToken();
    clearGuestId();
  });

  it('GET /me sends the account token', async () => {
    setToken('jwt-1', false);
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(json({ id: 'user-1' })));
    vi.stubGlobal('fetch', fetchMock);

    await fetchMe();

    expect(fetchMock.mock.calls[0][0]).toBe('/api/me');
    const headers = new Headers(callInit(fetchMock).headers);
    expect(headers.get('Authorization')).toBe('Bearer jwt-1');
  });

  it('PATCH /me sends only the editable fields', async () => {
    setToken('jwt-1', false);
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(json({ id: 'user-1' })));
    vi.stubGlobal('fetch', fetchMock);

    await updateMe({ fullName: 'Alex Henderson', phone: null });

    const init = callInit(fetchMock);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(String(init.body))).toEqual({
      fullName: 'Alex Henderson',
      phone: null,
    });
  });

  it('GET /farm sends the identity header', async () => {
    setToken('jwt-1', false);
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(json({ id: 'farm-1' })));
    vi.stubGlobal('fetch', fetchMock);

    await fetchFarm();

    expect(fetchMock.mock.calls[0][0]).toBe('/api/farm');
    expect(new Headers(callInit(fetchMock).headers).get('Authorization')).toBe('Bearer jwt-1');
  });

  it('PATCH /farm sends only the profile fields', async () => {
    setToken('jwt-1', false);
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(json({ id: 'farm-1' })));
    vi.stubGlobal('fetch', fetchMock);

    await updateFarm({
      farmName: 'My Farm',
      farmLocationText: 'Desouk',
      landArea: { value: 42.5, unit: 'acres' },
      currentCrops: ['field-corn'],
      waterSource: 'rain',
      waterSourceOther: null,
      priorities: ['save_water'],
    });

    const init = callInit(fetchMock);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(String(init.body))).toEqual({
      farmName: 'My Farm',
      farmLocationText: 'Desouk',
      landArea: { value: 42.5, unit: 'acres' },
      currentCrops: ['field-corn'],
      waterSource: 'rain',
      waterSourceOther: null,
      priorities: ['save_water'],
    });
  });

  it('GET /meta/options is public', async () => {
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(json({ waterSource: [] })));
    vi.stubGlobal('fetch', fetchMock);

    await fetchOptions();

    expect(fetchMock.mock.calls[0][0]).toBe('/api/meta/options');
    const headers = new Headers(callInit(fetchMock).headers);
    expect(headers.get('Authorization')).toBeNull();
    expect(headers.get('X-Guest-Id')).toBeNull();
  });

  it('GET /crops?use=current asks for the selectable crops', async () => {
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(json({ crops: [] })));
    vi.stubGlobal('fetch', fetchMock);

    await fetchCurrentCrops();

    expect(fetchMock.mock.calls[0][0]).toBe('/api/crops?use=current');
  });

  it('POST /me/password sends the three password fields', async () => {
    setToken('jwt-1', false);
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);

    await changePassword({
      currentPassword: 'Old1Pass',
      newPassword: 'Str0ngPass1',
      confirmNewPassword: 'Str0ngPass1',
    });

    const init = callInit(fetchMock);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/me/password');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({
      currentPassword: 'Old1Pass',
      newPassword: 'Str0ngPass1',
      confirmNewPassword: 'Str0ngPass1',
    });
  });

  it('DELETE /me sends the confirmation email', async () => {
    setToken('jwt-1', false);
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);

    await deleteMe('demo@example.com');

    const init = callInit(fetchMock);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/me');
    expect(init.method).toBe('DELETE');
    expect(JSON.parse(String(init.body))).toEqual({ confirmEmail: 'demo@example.com' });
  });

  it('serves the local mock when NEXT_PUBLIC_MOCK_PLANNED is on', async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_MOCK_PLANNED = 'true';
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(json({})));
    vi.stubGlobal('fetch', fetchMock);

    try {
      const api = await import('./api');
      const me = await api.fetchMe();
      expect(me.email).toBe('demo.farmer@example.com');
      expect(me.fullName).toBe('Demo Farmer');

      const updated = await api.updateMe({ fullName: 'Mocked Farmer', phone: null });
      expect(updated.fullName).toBe('Mocked Farmer');

      const farm = await api.updateFarm({
        farmName: 'Mock Farm',
        farmLocationText: null,
        currentCrops: ['field-corn'],
        waterSource: 'rain',
        waterSourceOther: null,
        priorities: ['save_water'],
      });
      expect(farm.farmName).toBe('Mock Farm');
      expect(farm.currentCrops).toEqual(['field-corn']);

      // The mock answers locally, so no request reaches the network.
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      delete process.env.NEXT_PUBLIC_MOCK_PLANNED;
      vi.resetModules();
    }
  });
});
