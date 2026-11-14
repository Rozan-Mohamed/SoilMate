'use client';

import { UserRound } from 'lucide-react';
import { Button } from '@/components/ui';
import { en } from '@/strings/en';

/** Shown to guests. No /me call is made for them. */
export function ProfileGuestCard() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center">
      <div className="w-full rounded-card bg-card p-8 shadow-card">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-mint-2 text-primary">
          <UserRound className="size-7" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-extrabold leading-snug text-deep">
          {en.profile.guest.title}
        </h1>
        <p className="mt-2 text-ink-soft">{en.profile.guest.text}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="/signup">{en.profile.guest.signup}</Button>
          <Button href="/login" variant="secondary">
            {en.profile.guest.login}
          </Button>
        </div>
      </div>
    </section>
  );
}
