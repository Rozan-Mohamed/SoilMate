'use client';

import { CheckCircle2, Mail, Phone, UserRound } from 'lucide-react';
import { Badge, Card, TextField } from '@/components/ui';
import type { ProfileErrors } from '@/lib/profile/types';
import { en } from '@/strings/en';

type Props = {
  fullName: string;
  phone: string;
  email: string;
  emailVerified: boolean;
  errors: ProfileErrors;
  disabled?: boolean;
  onChange: (field: 'fullName' | 'phone', value: string) => void;
};

export function PersonalInfoCard({
  fullName,
  phone,
  email,
  emailVerified,
  errors,
  disabled = false,
  onChange,
}: Props) {
  return (
    <Card className="h-full">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mint-2 text-primary">
          <UserRound className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-deep">{en.profile.personal.title}</h2>
          <p className="text-sm text-ink-soft">{en.profile.personal.subtitle}</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <TextField
          label={en.profile.personal.fullName}
          name="fullName"
          value={fullName}
          onChange={(event) => onChange('fullName', event.target.value)}
          error={errors.fullName}
          autoComplete="name"
          iconLeft={<UserRound className="size-4" />}
          disabled={disabled}
        />

        <div>
          <TextField
            label={en.profile.personal.email}
            type="email"
            name="email"
            value={email}
            readOnly
            autoComplete="email"
            iconLeft={<Mail className="size-4" />}
            className="opacity-90"
          />
          <p className="mt-1.5 flex flex-wrap items-center gap-2 px-1 text-xs text-ink-soft">
            {emailVerified && (
              <Badge tone="good">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                {en.profile.header.verified}
              </Badge>
            )}
            <span>{en.profile.personal.emailReadOnly}</span>
          </p>
        </div>

        <TextField
          label={en.profile.personal.phone}
          name="phone"
          value={phone}
          onChange={(event) => onChange('phone', event.target.value)}
          error={errors.phone}
          autoComplete="tel"
          inputMode="tel"
          placeholder="+20 100 000 0000"
          iconLeft={<Phone className="size-4" />}
          disabled={disabled}
        />
      </div>
    </Card>
  );
}
