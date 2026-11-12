import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, PLAYER_ID_KEY, apiRequest, getPlayerId, isApiError } from './client';

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

type Init = RequestInit & { headers: Record<string, string> };
const mockFetch = (make: () => Response) => vi.fn<typeof fetch>(() => Promise.resolve(make()));
const initOf = (m: ReturnType<typeof mockFetch>, call: number) => m.mock.calls[call][1] as Init;

describe('apiRequest', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('sends no player id on the very first request and keeps the one the server returns', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(json({ ok: 1 }, { headers: { 'X-Player-Id': 'player-42' } })),
    );
    vi.stubGlobal('fetch', fetchMock);

    await apiRequest('/games');
    const firstHeaders = initOf(fetchMock, 0).headers;
    expect(firstHeaders['X-Player-Id']).toBeUndefined();
    expect(getPlayerId()).toBe('player-42');
    expect(window.localStorage.getItem(PLAYER_ID_KEY)).toBe('player-42');

    await apiRequest('/games');
    const secondHeaders = initOf(fetchMock, 1).headers;
    expect(secondHeaders['X-Player-Id']).toBe('player-42');
  });

  it('sends JSON only when there is a body, and never caches', async () => {
    const fetchMock = mockFetch(() => json({}));
    vi.stubGlobal('fetch', fetchMock);

    await apiRequest('/a', { method: 'POST' });
    const noBody = initOf(fetchMock, 0);
    expect(noBody.headers['Content-Type']).toBeUndefined();
    expect(noBody.body).toBeUndefined();
    expect(noBody.cache).toBe('no-store');

    await apiRequest('/b', { method: 'POST', body: { questionId: 'q1', choiceKey: 'a' } });
    const withBody = initOf(fetchMock, 1);
    expect(withBody.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(withBody.body as string)).toEqual({ questionId: 'q1', choiceKey: 'a' });
  });

  it('turns the API error shape into an ApiError with code, status and details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        json(
          {
            error: { code: 'QUESTION_ALREADY_RESOLVED', message: 'done', details: { id: 'q1' } },
          },
          { status: 409 },
        ),
      ),
    );
    const error = await apiRequest('/x').catch((e: unknown) => e);
    expect(isApiError(error)).toBe(true);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('QUESTION_ALREADY_RESOLVED');
    expect((error as ApiError).status).toBe(409);
    expect((error as ApiError).details).toEqual({ id: 'q1' });
  });

  it('maps a server error that is not JSON to INTERNAL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html>oops</html>', { status: 502 })),
    );
    const error = (await apiRequest('/x').catch((e: unknown) => e)) as ApiError;
    expect(error.code).toBe('INTERNAL');
    expect(error.status).toBe(502);
  });

  it('maps a request that never arrived to NETWORK', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const error = (await apiRequest('/x').catch((e: unknown) => e)) as ApiError;
    expect(error.code).toBe('NETWORK');
    expect(error.status).toBe(0);
  });

  it('lets an abort through untouched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')));
    const error = await apiRequest('/x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DOMException);
  });

  it('keeps working when localStorage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(json({ ok: true }, { headers: { 'X-Player-Id': 'p' } })),
    );
    await expect(apiRequest('/x')).resolves.toEqual({ ok: true });
  });
});
