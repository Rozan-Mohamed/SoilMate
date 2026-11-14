import { beforeEach, describe, expect, it } from 'vitest';
import type { LoginRequest, SignupRequest } from '@/lib/soilmate/types';
import { mockForgotPassword, mockLogin, mockSignup } from './mock';

const signupRequest = (overrides: Partial<SignupRequest> = {}): SignupRequest => ({
  fullName: '  Alex Henderson  ',
  email: '  Alex@Example.com ',
  password: 'Str0ngPass1',
  confirmPassword: 'Str0ngPass1',
  acceptedTerms: true,
  ...overrides,
});

const loginRequest = (overrides: Partial<LoginRequest> = {}): LoginRequest => ({
  email: 'alex@example.com',
  password: 'Str0ngPass1',
  rememberMe: true,
  ...overrides,
});

const daysFromNow = (iso: string) => (new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000);

describe('mock auth', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('creates an account, adopts a guest farm and normalizes the email', () => {
    const response = mockSignup(signupRequest(), 'guest-1');

    expect(response.guestData).toBe('adopted');
    expect(response.token).toMatch(/^mock-token-/);
    expect(response.user).toMatchObject({
      fullName: 'Alex Henderson',
      email: 'alex@example.com',
      emailVerified: false,
    });
    expect(daysFromNow(response.expiresAt)).toBeGreaterThan(29);
    expect(daysFromNow(response.expiresAt)).toBeLessThan(31);
  });

  it('rejects a duplicate email with EMAIL_ALREADY_REGISTERED', () => {
    mockSignup(signupRequest(), 'guest-1');

    try {
      mockSignup(signupRequest({ fullName: 'Someone Else' }), 'guest-2');
      expect.unreachable('signup should have failed');
    } catch (error) {
      expect(error).toMatchObject({ status: 409, code: 'EMAIL_ALREADY_REGISTERED' });
    }
  });

  it('marks the first guest merge as adopted and later merges as discarded', () => {
    mockSignup(signupRequest());

    expect(mockLogin(loginRequest(), 'guest-1').guestData).toBe('adopted');
    expect(mockLogin(loginRequest(), 'guest-2').guestData).toBe('discarded');
    expect(mockLogin(loginRequest()).guestData).toBeUndefined();
  });

  it('does not mutate account or guest state on a failed login', () => {
    mockSignup(signupRequest());

    try {
      mockLogin(loginRequest({ password: 'WrongPass1' }), 'guest-1');
      expect.unreachable('login should have failed');
    } catch (error) {
      expect(error).toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    }

    // If the failed attempt had stamped hasFarm, this would be "discarded".
    expect(mockLogin(loginRequest(), 'guest-1').guestData).toBe('adopted');
  });

  it('uses rememberMe to choose the documented token lifetime', () => {
    mockSignup(signupRequest());

    const remembered = mockLogin(loginRequest({ rememberMe: true }));
    const sessionOnly = mockLogin(loginRequest({ rememberMe: false }));

    expect(daysFromNow(remembered.expiresAt)).toBeGreaterThan(29);
    expect(daysFromNow(sessionOnly.expiresAt)).toBeGreaterThan(0.9);
    expect(daysFromNow(sessionOnly.expiresAt)).toBeLessThan(1.1);
  });

  it('always returns the generic forgot-password message', () => {
    expect(mockForgotPassword()).toEqual({
      message: 'If this email is registered, you will receive reset instructions.',
    });
  });
});
