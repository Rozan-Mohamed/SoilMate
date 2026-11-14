'use client';

import { KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { passwordUpdatedLabel } from '@/lib/profile/format';
import { en } from '@/strings/en';

type Props = {
  passwordChangedAt?: string;
  busy?: boolean;
  onChangePassword: () => void;
  onLogOut: () => void;
};

export function AccountSettingsCard({
  passwordChangedAt,
  busy = false,
  onChangePassword,
  onLogOut,
}: Props) {
  const updated = passwordUpdatedLabel(passwordChangedAt);

  return (
    <Card className="h-full">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mint-2 text-primary">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-deep">{en.profile.account.title}</h2>
          <p className="text-sm text-ink-soft">{en.profile.account.subtitle}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-mint-2/70 px-4 py-3">
        <div className="flex items-center gap-3">
          <KeyRound className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-bold text-deep">{en.profile.account.password}</p>
            {updated && <p className="text-xs text-ink-soft">{updated}</p>}
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={onChangePassword} disabled={busy}>
          {en.profile.account.changePassword}
        </Button>
      </div>

      <Button
        variant="secondary"
        onClick={onLogOut}
        disabled={busy}
        iconLeft={<LogOut className="size-4" />}
        className="mt-3 w-full"
      >
        {en.profile.account.logOut}
      </Button>
    </Card>
  );
}
