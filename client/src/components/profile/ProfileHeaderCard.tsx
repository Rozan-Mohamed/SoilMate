'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui';
import { initials } from '@/lib/profile/format';
import type { Me } from '@/lib/soilmate/types';
import { en } from '@/strings/en';

type Props = {
  user: Me;
};

export function ProfileHeaderCard({ user }: Props) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const showAvatar = Boolean(user.avatarUrl) && !avatarFailed;

  return (
    <section className="rounded-card bg-gradient-to-r from-mint-2 to-mint p-5 shadow-card sm:p-7">
      <div className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-deep text-lg font-extrabold text-bright shadow-card">
          {showAvatar ? (
            // The avatar URL comes from the API, so a plain image is used.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl ?? ''}
              alt={en.profile.header.avatarAlt}
              className="size-full object-cover"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <span aria-hidden="true">{initials(user.fullName)}</span>
          )}
        </span>

        <div className="min-w-0">
          <h2 className="truncate text-xl font-extrabold text-deep">{user.fullName}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <span className="truncate">{user.email}</span>
            {user.emailVerified && (
              <Badge tone="good">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                {en.profile.header.verified}
              </Badge>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
