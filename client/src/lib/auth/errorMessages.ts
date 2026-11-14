import { ApiError, fieldErrors, friendlyMessage } from '@/lib/soilmate/errors';
import { en } from '@/strings/en';
import type { AuthFieldErrors } from './validation';

export type AuthErrorMode = 'signup' | 'login';

export type AuthErrorResult = {
  fields: AuthFieldErrors;
  banner: string | null;
  emailTaken: boolean;
};

const SIGNUP_FIELDS = new Set([
  'fullName',
  'email',
  'password',
  'confirmPassword',
  'acceptedTerms',
]);
const LOGIN_FIELDS = new Set(['email', 'password']);

/**
 * Turn any signup/login failure into the documented UI states. A failed call
 * never mutates storage; guest identity is owned by AuthProvider/Stage 0A.
 */
export function mapAuthError(err: unknown, mode: AuthErrorMode): AuthErrorResult {
  if (!(err instanceof ApiError)) {
    return { fields: {}, banner: en.auth.errors.generic, emailTaken: false };
  }

  if (err.status === 409 || err.code === 'EMAIL_ALREADY_REGISTERED') {
    return {
      fields: { email: en.auth.errors.emailTaken },
      banner: null,
      emailTaken: true,
    };
  }

  if (err.status === 401 || err.code === 'INVALID_CREDENTIALS') {
    return {
      fields: {},
      banner: en.api.invalidCredentials,
      emailTaken: false,
    };
  }

  if (err.status === 429 || err.code === 'RATE_LIMITED') {
    return {
      fields: {},
      banner: en.auth.errors.rateLimited,
      emailTaken: false,
    };
  }

  if (err.status === 400 || err.code === 'VALIDATION_ERROR') {
    const allowed = mode === 'signup' ? SIGNUP_FIELDS : LOGIN_FIELDS;
    const fields: AuthFieldErrors = {};
    let banner: string | null = null;

    for (const [field, message] of Object.entries(fieldErrors(err))) {
      if (allowed.has(field)) {
        fields[field] = message;
      } else {
        // Keep an issue visible even if the current form has no control for it.
        banner ??= message;
      }
    }

    if (!banner && Object.keys(fields).length === 0) {
      banner = en.auth.errors.invalidForm;
    }

    return { fields, banner, emailTaken: false };
  }

  return { fields: {}, banner: friendlyMessage(err), emailTaken: false };
}
