import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './api';
import { ApiError, fieldErrors, friendlyMessage } from './errors';
import { clearGuestId, getOrCreateGuestId } from './guest';
import { clearToken, getToken, setToken } from './token';

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

type FetchInit = RequestInit & { headers: Headers };
const initOf = (fetchMock: ReturnType<typeof vi.fn<typeof fetch>>, call = 0) =>
  fetchMock.mock.calls[call][1] as FetchInit;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('website apiFetch', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearToken();
    clearGuestId();
  });

  it('sends only X-Guest-Id for identity calls when logged out', async () => {
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(json({ ok: true })));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/farm');

    const init = initOf(fetchMock);
    const headers = new Headers(init.headers);
    expect(headers.get('X-Guest-Id')).toMatch(uuid);
    expect(headers.get('Authorization')).toBeNull();
    expect(init.cache).toBe('no-store');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/farm');
  });

  it('sends only Authorization when a token exists, even if a guest header was passed', async () => {
    setToken('jwt-1', true);
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(json({ ok: true })));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/farm', { headers: { 'X-Guest-Id': '00000000-0000-4000-8000-000000000000' } });

    const headers = new Headers(initOf(fetchMock).headers);
    expect(headers.get('Authorization')).toBe('Bearer jwt-1');
    expect(headers.get('X-Guest-Id')).toBeNull();
  });

  it('sends no identity header to public endpoints', async () => {
    getOrCreateGuestId();
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(json({ terms: [] })));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/glossary', { auth: 'none' });

    const headers = new Headers(initOf(fetchMock).headers);
    expect(headers.get('X-Guest-Id')).toBeNull();
    expect(headers.get('Authorization')).toBeNull();
  });

  it('turns a non-JSON error body into INTERNAL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() => Promise.resolve(new Response('Bad gateway', { status: 502 }))),
    );

    await expect(apiFetch('/journey')).rejects.toMatchObject({
      name: 'ApiError',
      status: 502,
      code: 'INTERNAL',
    });
  });

  it('replaces a malformed guest id and retries exactly once', async () => {
    const oldId = getOrCreateGuestId();
    expect(oldId).toMatch(uuid);

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        json(
          { error: { code: 'INVALID_GUEST_ID', message: 'Invalid guest id' } },
          { status: 400 },
        ),
      )
      .mockResolvedValueOnce(json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/farm');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const first = new Headers(initOf(fetchMock, 0).headers).get('X-Guest-Id');
    const second = new Headers(initOf(fetchMock, 1).headers).get('X-Guest-Id');
    expect(first).toBe(oldId);
    expect(second).toMatch(uuid);
    expect(second).not.toBe(oldId);
    expect(getOrCreateGuestId()).toBe(second);
  });

  it('clears the token and announces a 401 on an authenticated call', async () => {
    setToken('jwt-2', false);
    const onUnauthorized = vi.fn();
    window.addEventListener('soilmate:unauthorized', onUnauthorized);
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          json({ error: { code: 'UNAUTHENTICATED', message: 'Please log in again.' } }, { status: 401 }),
        ),
      ),
    );

    await expect(apiFetch('/me')).rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
    expect(getToken()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);

    window.removeEventListener('soilmate:unauthorized', onUnauthorized);
  });

  it('maps validation issues and friendly messages without exposing raw codes', () => {
    const validation = new ApiError(400, 'VALIDATION_ERROR', 'Invalid request', {
      issues: [{ path: 'body.email', message: 'Enter a valid email' }],
    });

    expect(fieldErrors(validation)).toEqual({ email: 'Enter a valid email' });
    expect(friendlyMessage(new ApiError(429, 'RATE_LIMITED', 'Rate limit'))).toBe(
      'Too many requests, please wait a moment',
    );
    expect(friendlyMessage(new ApiError(500, 'INTERNAL', 'Stack trace'))).not.toContain('Stack trace');
  });

  it('keeps a guest id until storage is cleared, and never reuses it afterwards', () => {
    const first = getOrCreateGuestId();
    expect(first).toMatch(uuid);
    expect(getOrCreateGuestId()).toBe(first);

    window.localStorage.clear();
    const second = getOrCreateGuestId();
    expect(second).toMatch(uuid);
    expect(second).not.toBe(first);
  });
});
