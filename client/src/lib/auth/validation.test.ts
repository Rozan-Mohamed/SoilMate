import { describe, expect, it } from 'vitest';
import {
  toLoginRequest,
  toSignupRequest,
  validateConfirmPassword,
  validateEmail,
  validateLogin,
  validateSignup,
  type LoginValues,
  type SignupValues,
} from './validation';

const signupValues = (overrides: Partial<SignupValues> = {}): SignupValues => ({
  fullName: 'Alex Henderson',
  email: 'alex@example.com',
  password: 'Str0ngPass1',
  confirmPassword: 'Str0ngPass1',
  acceptedTerms: true,
  ...overrides,
});

const loginValues = (overrides: Partial<LoginValues> = {}): LoginValues => ({
  email: 'alex@example.com',
  password: 'Str0ngPass1',
  rememberMe: true,
  ...overrides,
});

describe('signup validation', () => {
  it('accepts the documented valid form', () => {
    expect(validateSignup(signupValues())).toEqual({});
  });

  it('requires a full name of 2–80 characters', () => {
    expect(validateSignup(signupValues({ fullName: '   ' })).fullName).toBe('Enter your full name.');
    expect(validateSignup(signupValues({ fullName: 'A' })).fullName).toBe(
      'Full name must be 2–80 characters.',
    );
    expect(validateSignup(signupValues({ fullName: 'A'.repeat(81) })).fullName).toBe(
      'Full name must be 2–80 characters.',
    );
  });

  it('requires a valid email', () => {
    expect(validateSignup(signupValues({ email: '' })).email).toBe('Enter your email address.');
    expect(validateSignup(signupValues({ email: 'not-an-email' })).email).toBe(
      'Enter a valid email address.',
    );
  });

  it('enforces 8–72 characters with at least one letter and one number', () => {
    expect(validateSignup(signupValues({ password: 'short', confirmPassword: 'short' })).password).toBe(
      'Password must be 8–72 characters.',
    );
    expect(
      validateSignup(signupValues({ password: 'allletters', confirmPassword: 'allletters' })).password,
    ).toBe('Password must include at least 1 letter and 1 number.');
    expect(
      validateSignup(signupValues({ password: '12345678', confirmPassword: '12345678' })).password,
    ).toBe('Password must include at least 1 letter and 1 number.');
  });

  it('requires confirmation and a matching password', () => {
    expect(
      validateSignup(signupValues({ confirmPassword: '' })).confirmPassword,
    ).toBe('Re-enter your password.');
    expect(
      validateSignup(signupValues({ confirmPassword: 'Different1' })).confirmPassword,
    ).toBe('Passwords do not match.');
  });

  it('accepts a confirm password that matches exactly', () => {
    expect(
      validateSignup(signupValues({ password: 'Str0ngPass1', confirmPassword: 'Str0ngPass1' })),
    ).toEqual({});
  });

  it('checks the confirm password on its own', () => {
    expect(validateConfirmPassword('Str0ngPass1', 'Str0ngPass1')).toBeNull();
    expect(validateConfirmPassword('Str0ngPass1', 'Str0ngPass2')).toBe(
      'Passwords do not match.',
    );
    expect(validateConfirmPassword('Str0ngPass1', '')).toBe('Re-enter your password.');
  });

  it('requires the terms checkbox', () => {
    expect(validateSignup(signupValues({ acceptedTerms: false })).acceptedTerms).toBe(
      'Please accept the Terms of Service and Privacy Policy.',
    );
  });

  it('builds the exact request and trims text fields', () => {
    const request = toSignupRequest(
      signupValues({ fullName: '  Alex Henderson  ', email: '  alex@example.com  ' }),
    );

    expect(request).toEqual({
      fullName: 'Alex Henderson',
      email: 'alex@example.com',
      password: 'Str0ngPass1',
      confirmPassword: 'Str0ngPass1',
      acceptedTerms: true,
    });
  });
});

describe('login validation', () => {
  it('accepts the documented valid form', () => {
    expect(validateLogin(loginValues())).toEqual({});
  });

  it('checks email format and the required password', () => {
    expect(validateLogin(loginValues({ email: 'nope' })).email).toBe('Enter a valid email address.');
    expect(validateLogin(loginValues({ password: '' })).password).toBe('Enter your password.');
  });

  it('builds the exact request with rememberMe', () => {
    expect(toLoginRequest(loginValues({ email: ' alex@example.com ', rememberMe: false }))).toEqual({
      email: 'alex@example.com',
      password: 'Str0ngPass1',
      rememberMe: false,
    });
  });
});

describe('email helper', () => {
  it('trims before validation', () => {
    expect(validateEmail('  alex@example.com  ')).toBeNull();
  });
});
