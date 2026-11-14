'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { Banner, Button, Spinner, TextField } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { login } from '@/lib/auth/api';
import { mapAuthError } from '@/lib/auth/errorMessages';
import { setAuthNotice } from '@/lib/auth/notice';
import {
  validateLogin,
  type AuthFieldErrors,
  type LoginValues,
} from '@/lib/auth/validation';
import { en } from '@/strings/en';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { usePostAuthRedirect } from './usePostAuthRedirect';

const INITIAL_VALUES: LoginValues = {
  email: '',
  password: '',
  rememberMe: true,
};

export function LoginForm() {
  const router = useRouter();
  const { status, applyAuthResponse } = useAuth();
  const redirect = usePostAuthRedirect();

  const [values, setValues] = useState<LoginValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [authSucceeded, setAuthSucceeded] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const busy = submitting || redirect.pending;

  useEffect(() => {
    if (status === 'account' && !authSucceeded) router.replace('/profile');
  }, [status, authSucceeded, router]);

  function update<K extends keyof LoginValues>(field: K, value: LoginValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    setBanner(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const response = await login(values);
      setAuthSucceeded(true);
      const guestData = applyAuthResponse(response, values.rememberMe);
      if (guestData === 'discarded') setAuthNotice(en.auth.notice);
      redirect.start();
    } catch (err) {
      const mapped = mapAuthError(err, 'login');
      setErrors(mapped.fields);
      setBanner(mapped.banner);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') return <Spinner label={en.ui.loading} />;
  if (authSucceeded || redirect.pending) return <Spinner label={en.auth.redirecting} />;
  if (status === 'account') return <Spinner label={en.auth.redirectingProfile} />;

  return (
    <>
      <form noValidate aria-busy={busy} onSubmit={(event) => void onSubmit(event)}>
        {banner && (
          <Banner tone="error" className="mb-5">
            {banner}
          </Banner>
        )}

        <div className="space-y-3">
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

          <TextField
            label={en.auth.fields.password}
            type="password"
            name="password"
            value={values.password}
            onChange={(event) => update('password', event.target.value)}
            error={errors.password}
            placeholder={en.auth.placeholders.loginPassword}
            autoComplete="current-password"
            iconLeft={<Lock className="size-4" />}
            disabled={busy}
          />
        </div>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
            <input
              type="checkbox"
              name="rememberMe"
              checked={values.rememberMe}
              onChange={(event) => update('rememberMe', event.target.checked)}
              disabled={busy}
              className="size-5 accent-primary"
            />
            {en.auth.fields.rememberMe}
          </label>

          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            disabled={busy}
            className="text-sm font-extrabold text-primary underline underline-offset-2 hover:text-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {en.auth.forgot.prompt}
          </button>
        </div>

        <Button
          type="submit"
          loading={busy}
          disabled={busy}
          iconRight={<ArrowRight className="size-4" />}
          className="mt-5 w-full"
        >
          {en.auth.login.submit}
        </Button>
      </form>

      {forgotOpen && (
        <ForgotPasswordModal
          onClose={() => setForgotOpen(false)}
          initialEmail={values.email}
        />
      )}
    </>
  );
}
