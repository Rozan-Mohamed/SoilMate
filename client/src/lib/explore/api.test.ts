import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearGuestId } from '@/lib/soilmate/guest';
import { clearToken, setToken } from '@/lib/soilmate/token';
import {
  fetchCenterOverview,
  fetchCenters,
  fetchMapLayer,
  fetchMapLayers,
  setFarmCenter,
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

describe('explore API', () => {
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

  it('GET /centers is public', async () => {
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(json({ centers: [] })));
    vi.stubGlobal('fetch', fetchMock);

    await fetchCenters();

    expect(fetchMock.mock.calls[0][0]).toBe('/api/centers');
    const headers = new Headers(callInit(fetchMock).headers);
    expect(headers.get('Authorization')).toBeNull();
    expect(headers.get('X-Guest-Id')).toBeNull();
  });

  it('GET /centers sends the search query', async () => {
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(json({ centers: [] })));
    vi.stubGlobal('fetch', fetchMock);

    await fetchCenters('des');

    expect(fetchMock.mock.calls[0][0]).toBe('/api/centers?q=des');
  });

  it('GET /map/layers and GET /map/layers/:id are public', async () => {
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(json({ layers: [] })));
    vi.stubGlobal('fetch', fetchMock);

    await fetchMapLayers();
    await fetchMapLayer('crop_health');

    expect(fetchMock.mock.calls[0][0]).toBe('/api/map/layers');
    expect(fetchMock.mock.calls[1][0]).toBe('/api/map/layers/crop_health');
    const headers = new Headers(callInit(fetchMock, 1).headers);
    expect(headers.get('Authorization')).toBeNull();
  });

  it('GET /centers/:id/overview is public', async () => {
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(json({ center: {} })));
    vi.stubGlobal('fetch', fetchMock);

    await fetchCenterOverview('desouk');

    expect(fetchMock.mock.calls[0][0]).toBe('/api/centers/desouk/overview');
  });

  it('PUT /farm/center sends the identity header and the area', async () => {
    setToken('jwt-1', false);
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(json({ id: 'farm-1' })));
    vi.stubGlobal('fetch', fetchMock);

    await setFarmCenter('desouk');

    const init = callInit(fetchMock);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/farm/center');
    expect(init.method).toBe('PUT');
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer jwt-1');
    expect(JSON.parse(String(init.body))).toEqual({ centerId: 'desouk' });
  });

  it('waits for RateLimit-Reset and retries once after a 429', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        json(
          { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
          { status: 429, headers: { 'RateLimit-Reset': '0.05' } },
        ),
      )
      .mockResolvedValueOnce(json({ centers: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchCenters();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry more than once after a 429', async () => {
    const fetchMock = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        json(
          { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
          { status: 429, headers: { 'RateLimit-Reset': '0.01' } },
        ),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchCenters()).rejects.toMatchObject({ status: 429 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('always calls the API, even while the planned mocks are on', async () => {
    // The website API implements Explore Land, so there is no mock any more:
    // the request always reaches the server.
    vi.resetModules();
    process.env.NEXT_PUBLIC_MOCK_PLANNED = 'true';
    const fetchMock = vi.fn<typeof fetch>(() =>
      Promise.resolve(json({ centers: [], coverageNote: '' })),
    );
    vi.stubGlobal('fetch', fetchMock);

    try {
      const api = await import('./api');
      await api.fetchCenters();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe('/api/centers');
    } finally {
      delete process.env.NEXT_PUBLIC_MOCK_PLANNED;
      vi.resetModules();
    }
  });
});
