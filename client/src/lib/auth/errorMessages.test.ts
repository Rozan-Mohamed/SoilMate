import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/soilmate/errors';
import { en } from '@/strings/en';
import { mapAuthError } from './errorMessages';

describe('mapAuthError', () => {
  it('maps VALIDATION_ERROR issues onto signup fields', () => {
    const error = new ApiError(400, 'VALIDATION_ERROR', 'Invalid request', {
      issues: [
        { path: 'body.email', message: 'That email looks wrong.' },
        { path: 'body.acceptedTerms', message: 'You must accept the terms.' },
      ],
    });

    expect(mapAuthError(error, 'signup')).toEqual({
      fields: {
        email: 'That email looks wrong.',
        acceptedTerms: 'You must accept the terms.',
      },
      banner: null,
      emailTaken: false,
    });
  });

  it('keeps a server field message instead of the client message', () => {
    const error = new ApiError(400, 'VALIDATION_ERROR', 'Invalid request', {
      issues: [{ path: 'body.password', message: 'Server says this password is too common.' }],
    });

    expect(mapAuthError(error, 'signup').fields.password).toBe(
      'Server says this password is too common.',
    );
  });

  it('surfaces an issue with no matching control as a banner', () => {
    const error = new ApiError(400, 'VALIDATION_ERROR', 'Invalid request', {
      issues: [{ path: 'body.rememberMe', message: 'Remember me is invalid.' }],
    });

    expect(mapAuthError(error, 'login')).toEqual({
      fields: {},
      banner: 'Remember me is invalid.',
      emailTaken: false,
    });
  });

  it('turns a validation error without issues into a friendly banner', () => {
    const error = new ApiError(400, 'VALIDATION_ERROR', 'Invalid request');

    expect(mapAuthError(error, 'login').banner).toBe('Please check the form and try again.');
  });

  it('maps EMAIL_ALREADY_REGISTERED under the email field', () => {
    const error = new ApiError(409, 'EMAIL_ALREADY_REGISTERED', 'Email already registered');

    expect(mapAuthError(error, 'signup')).toEqual({
      fields: { email: en.auth.errors.emailTaken },
      banner: null,
      emailTaken: true,
    });
  });

  it('maps INVALID_CREDENTIALS to one banner', () => {
    const error = new ApiError(401, 'INVALID_CREDENTIALS', 'Wrong email or password');

    expect(mapAuthError(error, 'login')).toEqual({
      fields: {},
      banner: 'Email or password is incorrect.',
      emailTaken: false,
    });
  });

  it('maps 429 to the documented rate-limit sentence', () => {
    const error = new ApiError(429, 'RATE_LIMITED', 'Too many requests');

    expect(mapAuthError(error, 'login').banner).toBe('Too many tries. Please wait a few minutes.');
  });

  it('uses friendly messages for network and unknown failures', () => {
    expect(mapAuthError(new ApiError(0, 'NETWORK', 'offline'), 'login').banner).toBe(
      "We couldn't reach the server. Check your connection and try again.",
    );
    expect(mapAuthError(new Error('boom'), 'login').banner).toBe(
      'Something went wrong. Please try again.',
    );
  });
});
