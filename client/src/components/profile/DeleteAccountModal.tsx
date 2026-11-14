'use client';

import { useState } from 'react';
import { Banner, Button, Modal, TextField } from '@/components/ui';
import { deleteMe } from '@/lib/profile/api';
import { validateDeleteEmail } from '@/lib/profile/validation';
import { fieldErrors, friendlyMessage } from '@/lib/soilmate/errors';
import { en } from '@/strings/en';

type Props = {
  email: string;
  onClose: () => void;
  onDeleted: () => void;
};

/** Mounted only while it is open, so it always starts empty. */
export function DeleteAccountModal({ email, onClose, onDeleted }: Props) {
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const validation = validateDeleteEmail(typed, email);
    setError(validation);
    setBanner(null);
    if (validation) return;

    setSubmitting(true);
    try {
      await deleteMe(typed.trim());
      onDeleted();
    } catch (err) {
      const serverFields = fieldErrors(err);
      setError(serverFields.confirmEmail ?? null);
      setBanner(friendlyMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={en.profile.delete.title}
      size="sm"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {en.ui.cancel}
          </Button>
          <Button
            variant="danger"
            type="submit"
            form="delete-account-form"
            loading={submitting}
            disabled={submitting}
          >
            {en.profile.delete.submit}
          </Button>
        </div>
      }
    >
      <form id="delete-account-form" noValidate onSubmit={(event) => void onSubmit(event)}>
        <p className="mb-4 text-sm text-ink-soft">{en.profile.delete.text}</p>
        {banner && (
          <Banner tone="error" className="mb-4">
            {banner}
          </Banner>
        )}
        <TextField
          id="confirm-email"
          label={en.profile.delete.label}
          type="email"
          name="confirmEmail"
          value={typed}
          onChange={(event) => {
            setTyped(event.target.value);
            if (error) setError(null);
          }}
          error={error ?? undefined}
          placeholder={email}
          autoComplete="email"
          disabled={submitting}
        />
      </form>
    </Modal>
  );
}
