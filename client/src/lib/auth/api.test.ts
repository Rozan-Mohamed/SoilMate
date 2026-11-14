import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearGuestId, getOrCreateGuestId } from '@/lib/soilmate/guest';
import type { AuthResponse } from '@/lib/soilmate/types';
import { forgotPassword, login, signup } from './api';
import type { LoginValues, SignupValues } from './validation';

const signupValues: SignupValues = {
  fullName: '  Alex Henderson ',
  email: ' alex@example.com ',
  password: 'Str0ngPass1',
  confirmPassword: 'Str0ngPass1',
  acceptedTerms: true,
};

const loginValues: LoginValues = {
  email: ' alex@example.com ',
  password: 'Str0ngPass1',
  rememberMe: false,
};

const response: AuthResponse = {
  token: 'jwt-1',
  expiresAt: '2026-12-12T10:00:00.000Z',
  user: {
    id: 'user-1',
    fullName: 'Alex Henderson',
    email: 'alex@example.com',
    phone: null,
    avatarUrl: null,
    emailVerified: false,
    createdAt: '2026-11-12T10:00:00.000Z',
  },
};

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

type FetchInit = RequestInit & { headers: Headers };
const callInit = (fetchMock: ReturnType<typeof vi.fn<typeof fetch>>, call = 0) =>
  fetchMock.mock.calls[call][1] as FetchInit;

describe('auth API', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    clearGuestId();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearGuestId();
  });

  it('posts the exact signup body with the guest header and no token', async () => {
    const guestId = getOrCreateGuestId();
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(json(response, { status: 201 })));
    vi.stubGlobal('fetch', fetchMock);

    await expect(signup(signupValues)).resolves.toEqual(response);

    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/signup');
    const init = callInit(fetchMock);
    const headers = new Headers(init.headers);
    expect(init.method).toBe('POST');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('X-Guest-Id')).toBe(guestId);
    expect(headers.get('Authorization')).toBeNull();
    expect(JSON.parse(String(init.body))).toEqual({
      fullName: 'Alex Henderson',
      email: 'alex@example.com',
      password: 'Str0ngPass1',
      confirmPassword: 'Str0ngPass1',
      acceptedTerms: true,
    });
  });

  it('posts the exact login body including rememberMe', async () => {
    const guestId = getOrCreateGuestId();
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(json(response)));
    vi.stubGlobal('fetch', fetchMock);

    await login(loginValues);

    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/login');
    const init = callInit(fetchMock);
    expect(new Headers(init.headers).get('X-Guest-Id')).toBe(guestId);
    expect(JSON.parse(String(init.body))).toEqual({
      email: 'alex@example.com',
      password: 'Str0ngPass1',
      rememberMe: false,
    });
  });

  it('calls the forgot-password stub without an identity header', async () => {
    getOrCreateGuestId();
    const fetchMock = vi.fn<typeof fetch>(() =>
      Promise.resolve(json({ message: 'If this email is registered, you will receive reset instructions.' })),
    );
    vi.stubGlobal('fetch', fetchMock);

    await forgotPassword(' alex@example.com ');

    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/forgot-password');
    const init = callInit(fetchMock);
    const headers = new Headers(init.headers);
    expect(headers.get('X-Guest-Id')).toBeNull();
    expect(headers.get('Authorization')).toBeNull();
    expect(JSON.parse(String(init.body))).toEqual({ email: 'alex@example.com' });
  });

  it('leaves the guest id untouched after a failed login', async () => {
    const guestId = getOrCreateGuestId();
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          json(
            { error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } },
            { status: 401 },
          ),
        ),
      ),
    );

    await expect(login(loginValues)).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
    });
    expect(getOrCreateGuestId()).toBe(guestId);
  });

  it('passes validation issues through as an ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          json(
            {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request',
                details: { issues: [{ path: 'body.email', message: 'Invalid email' }] },
              },
            },
            { status: 400 },
          ),
        ),
      ),
    );

    await expect(signup(signupValues)).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      issues: [{ path: 'body.email', message: 'Invalid email' }],
    });
  });
});
