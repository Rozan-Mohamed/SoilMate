'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Mail, UserRound } from 'lucide-react';
import { Banner, Button, Spinner, TextField } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { signup } from '@/lib/auth/api';
import { mapAuthError } from '@/lib/auth/errorMessages';
import { setAuthNotice } from '@/lib/auth/notice';
import {
  validateConfirmPassword,
  validateSignup,
  type AuthFieldErrors,
  type SignupValues,
} from '@/lib/auth/validation';
import { en } from '@/strings/en';
import { usePostAuthRedirect } from './usePostAuthRedirect';

const INITIAL_VALUES: SignupValues = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
};

export function SignupForm() {
  const router = useRouter();
  const { status, applyAuthResponse } = useAuth();
  const redirect = usePostAuthRedirect();

  const [values, setValues] = useState<SignupValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authSucceeded, setAuthSucceeded] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const busy = submitting || redirect.pending;

  /**
   * The confirm error is derived from the current values, so it can never be
   * stale: editing either password field re-checks it immediately.
   */
  const confirmError = validateConfirmPassword(values.password, values.confirmPassword);
  const visibleConfirmError =
    errors.confirmPassword ?? ((touchedConfirm || submitAttempted) ? confirmError : null);

  useEffect(() => {
    if (status === 'account' && !authSucceeded) router.replace('/profile');
  }, [status, authSucceeded, router]);

  function update<K extends keyof SignupValues>(field: K, value: SignupValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      if (field === 'password' || field === 'confirmPassword') {
        // The stored confirm message is replaced by the derived one.
        delete next.confirmPassword;
      }
      return next;
    });
    if (field === 'email') setEmailTaken(false);
    if (field === 'confirmPassword') setTouchedConfirm(true);
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    setSubmitAttempted(true);

    const nextErrors = validateSignup(values);
    setErrors(nextErrors);
    setBanner(null);
    setEmailTaken(false);

    // A mismatch always blocks the request, whatever the field state is.
    if (validateConfirmPassword(values.password, values.confirmPassword)) return;
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const response = await signup(values);
      setAuthSucceeded(true);
      const guestData = applyAuthResponse(response, true);
      if (guestData === 'discarded') setAuthNotice(en.auth.notice);
      redirect.start();
    } catch (err) {
      const mapped = mapAuthError(err, 'signup');
      setErrors(mapped.fields);
      setBanner(mapped.banner);
      setEmailTaken(mapped.emailTaken);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') return <Spinner label={en.ui.loading} />;
  if (authSucceeded || redirect.pending) return <Spinner label={en.auth.redirecting} />;
  if (status === 'account') return <Spinner label={en.auth.redirectingProfile} />;

  return (
    <form noValidate aria-busy={busy} onSubmit={(event) => void onSubmit(event)}>
      {banner && (
        <Banner tone="error" className="mb-5">
          {banner}
        </Banner>
      )}

      <div className="space-y-3">
        <TextField
          label={en.auth.fields.fullName}
          name="fullName"
          value={values.fullName}
          onChange={(event) => update('fullName', event.target.value)}
          error={errors.fullName}
          placeholder={en.auth.placeholders.fullName}
          autoComplete="name"
          maxLength={80}
          iconLeft={<UserRound className="size-4" />}
          disabled={busy}
        />

        <div>
          <TextField
            label={en.auth.fields.email}
            type="email"
            name="email"
            value={values.email}
            onChange={(event) => update('email', event.target.value)}
            error={errors.email}
            placeholder={en.auth.placeholders.email}
            autoComplete="email"
            inputMode="email"
            iconLeft={<Mail className="size-4" />}
            disabled={busy}
          />
          {emailTaken && (
            <p className="mt-1.5 px-1 text-sm">
              <Link
                href="/login"
                className="font-extrabold text-primary underline underline-offset-2 hover:text-deep"
              >
                {en.auth.errors.loginInstead}
              </Link>
            </p>
          )}
        </div>

        <TextField
          label={en.auth.fields.password}
          type="password"
          name="password"
          value={values.password}
          onChange={(event) => update('password', event.target.value)}
          error={errors.password}
          hint={en.auth.passwordHint}
          placeholder={en.auth.placeholders.password}
          autoComplete="new-password"
          iconLeft={<Lock className="size-4" />}
          disabled={busy}
        />

        <TextField
          label={en.auth.fields.confirmPassword}
          type="password"
          name="confirmPassword"
          value={values.confirmPassword}
          onChange={(event) => update('confirmPassword', event.target.value)}
          error={visibleConfirmError ?? undefined}
          placeholder={en.auth.placeholders.confirmPassword}
          autoComplete="new-password"
          iconLeft={<Lock className="size-4" />}
          disabled={busy}
        />
      </div>

      <div className="mt-4">
        <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
          <input
            type="checkbox"
            name="acceptedTerms"
            checked={values.acceptedTerms}
            onChange={(event) => update('acceptedTerms', event.target.checked)}
            disabled={busy}
            aria-invalid={errors.acceptedTerms ? true : undefined}
            aria-describedby={errors.acceptedTerms ? 'signup-terms-error' : undefined}
            className="mt-0.5 size-5 shrink-0 accent-primary"
          />
          <span>
            {en.auth.terms.prefix}{' '}
            <a
              href="#"
              className="font-bold text-primary underline underline-offset-2 hover:text-deep"
            >
              {en.auth.terms.service}
            </a>{' '}
            {en.auth.terms.conjunction}{' '}
            <a
              href="#"
              className="font-bold text-primary underline underline-offset-2 hover:text-deep"
            >
              {en.auth.terms.privacy}
            </a>{' '}
            {en.auth.terms.suffix}
          </span>
        </label>
        {errors.acceptedTerms && (
          <p id="signup-terms-error" role="alert" className="mt-1.5 px-1 text-sm font-semibold text-peach-ink">
            {errors.acceptedTerms}
          </p>
        )}
      </div>

      <Button
        type="submit"
        loading={busy}
        disabled={!values.acceptedTerms || busy}
        iconRight={<ArrowRight className="size-4" />}
        className="mt-5 w-full"
      >
        {en.auth.signup.submit}
      </Button>
    </form>
  );
}
