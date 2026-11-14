'use client';

import { useState } from 'react';
import { Banner, Button, Modal, TextField } from '@/components/ui';
import { changePassword } from '@/lib/profile/api';
import { validatePasswordChange } from '@/lib/profile/validation';
import type { ProfileErrors } from '@/lib/profile/types';
import { ApiError, fieldErrors, friendlyMessage } from '@/lib/soilmate/errors';
import { en } from '@/strings/en';

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

/** Mounted only while it is open, so it always starts empty. */
export function ChangePasswordModal({ onClose, onSuccess }: Props) {
  const [values, setValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = validatePasswordChange(values);
    setErrors(nextErrors);
    setBanner(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await changePassword(values);
      onSuccess();
    } catch (err) {
      const mapped = mapPasswordError(err);
      setErrors(mapped.fields);
      setBanner(mapped.banner);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={en.profile.password.title}
      size="sm"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {en.ui.cancel}
          </Button>
          <Button
            type="submit"
            form="change-password-form"
            loading={submitting}
            disabled={submitting}
          >
            {en.profile.password.submit}
          </Button>
        </div>
      }
    >
      <form id="change-password-form" noValidate onSubmit={(event) => void onSubmit(event)}>
        <p className="mb-4 text-sm text-ink-soft">{en.profile.password.text}</p>
        {banner && (
          <Banner tone="error" className="mb-4">
            {banner}
          </Banner>
        )}

        <div className="space-y-3">
          <TextField
            id="current-password"
            label={en.profile.password.current}
            type="password"
            name="currentPassword"
            value={values.currentPassword}
            onChange={(event) => update('currentPassword', event.target.value)}
            error={errors.currentPassword}
            autoComplete="current-password"
            disabled={submitting}
          />

          <TextField
            id="new-password"
            label={en.profile.password.new}
            type="password"
            name="newPassword"
            value={values.newPassword}
            onChange={(event) => update('newPassword', event.target.value)}
            error={errors.newPassword}
            hint={en.profile.password.hint}
            autoComplete="new-password"
            disabled={submitting}
          />

          <TextField
            id="confirm-password"
            label={en.profile.password.confirm}
            type="password"
            name="confirmNewPassword"
            value={values.confirmNewPassword}
            onChange={(event) => update('confirmNewPassword', event.target.value)}
            error={errors.confirmNewPassword}
            autoComplete="new-password"
            disabled={submitting}
          />
        </div>
      </form>
    </Modal>
  );
}

/** The contract answers a wrong current password with 401 INVALID_CREDENTIALS. */
function mapPasswordError(err: unknown): { fields: ProfileErrors; banner: string | null } {
  const fields = fieldErrors(err);

  if (err instanceof ApiError && err.status === 401) {
    return { fields, banner: en.profile.password.currentIncorrect };
  }
  if (Object.keys(fields).length > 0) {
    return { fields, banner: null };
  }
  return { fields, banner: friendlyMessage(err) };
}
