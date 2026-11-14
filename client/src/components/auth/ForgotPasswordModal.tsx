'use client';

import { useState } from 'react';
import { Banner, Button, Modal, TextField } from '@/components/ui';
import { forgotPassword } from '@/lib/auth/api';
import { mapAuthError } from '@/lib/auth/errorMessages';
import { validateEmail } from '@/lib/auth/validation';
import { en } from '@/strings/en';

type Props = {
  onClose: () => void;
  initialEmail: string;
};

export function ForgotPasswordModal({ onClose, initialEmail }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const emailError = validateEmail(email);
    setError(emailError);
    setBanner(null);
    if (emailError) return;

    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      const mapped = mapAuthError(err, 'login');
      setError(mapped.fields.email ?? null);
      setBanner(mapped.banner);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={en.auth.forgot.title}
      size="sm"
      footer={
        success ? (
          <Button onClick={onClose} className="w-full">
            {en.auth.forgot.close}
          </Button>
        ) : (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              {en.ui.cancel}
            </Button>
            <Button
              type="submit"
              form="forgot-password-form"
              loading={submitting}
              disabled={submitting}
            >
              {en.auth.forgot.submit}
            </Button>
          </div>
        )
      }
    >
      {success ? (
        <p
          role="status"
          className="rounded-2xl border border-leaf/40 bg-mint-2 px-4 py-3 text-sm font-semibold text-primary"
        >
          {en.auth.forgot.success}
        </p>
      ) : (
        <form id="forgot-password-form" noValidate onSubmit={(event) => void onSubmit(event)}>
          <p className="mb-4 text-sm text-ink-soft">{en.auth.forgot.text}</p>
          {banner && (
            <Banner tone="error" className="mb-4">
              {banner}
            </Banner>
          )}
          <TextField
            id="forgot-email"
            label={en.auth.fields.email}
            type="email"
            name="forgotEmail"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) setError(null);
            }}
            error={error ?? undefined}
            placeholder={en.auth.placeholders.email}
            autoComplete="email"
            autoFocus
            disabled={submitting}
          />
        </form>
      )}
    </Modal>
  );
}
