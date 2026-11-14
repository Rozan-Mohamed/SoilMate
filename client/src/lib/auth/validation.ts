import type { LoginRequest, SignupRequest } from '@/lib/soilmate/types';
import { en } from '@/strings/en';

export type SignupValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

export type LoginValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

/** Field name -> message. Matches the API's `details.issues[].path` names. */
export type AuthFieldErrors = Record<string, string>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return en.auth.errors.emailRequired;
  if (!EMAIL_PATTERN.test(value)) return en.auth.errors.emailInvalid;
  return null;
}

/**
 * The confirm field must match the password exactly. It is a separate helper so
 * the form can re-check it whenever either password field changes, and so the
 * submit handler can never bypass it.
 */
export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
): string | null {
  if (!confirmPassword) return en.auth.errors.confirmRequired;
  if (confirmPassword !== password) return en.auth.errors.confirmMismatch;
  return null;
}

export function validateSignup(values: SignupValues): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  const fullName = values.fullName.trim();
  if (!fullName) {
    errors.fullName = en.auth.errors.fullNameRequired;
  } else if (fullName.length < 2 || fullName.length > 80) {
    errors.fullName = en.auth.errors.fullNameLength;
  }

  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;

  if (!values.password) {
    errors.password = en.auth.errors.passwordRequired;
  } else if (values.password.length < 8 || values.password.length > 72) {
    errors.password = en.auth.errors.passwordLength;
  } else if (!/\p{L}/u.test(values.password) || !/\p{N}/u.test(values.password)) {
    errors.password = en.auth.errors.passwordComplexity;
  }

  const confirmError = validateConfirmPassword(values.password, values.confirmPassword);
  if (confirmError) errors.confirmPassword = confirmError;

  if (!values.acceptedTerms) {
    errors.acceptedTerms = en.auth.errors.termsRequired;
  }

  return errors;
}
export function validateLogin(values: LoginValues): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;

  if (!values.password) errors.password = en.auth.errors.passwordRequired;

  return errors;
}

/** Build the documented request body after client-side validation passes. */
export function toSignupRequest(values: SignupValues): SignupRequest {
  return {
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    password: values.password,
    confirmPassword: values.confirmPassword,
    acceptedTerms: true,
  };
}

export function toLoginRequest(values: LoginValues): LoginRequest {
  return {
    email: values.email.trim(),
    password: values.password,
    rememberMe: values.rememberMe,
  };
}
