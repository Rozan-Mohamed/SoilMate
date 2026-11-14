'use client';

import clsx from 'clsx';
import { useAuth } from '@/providers/AuthProvider';
import { en } from '@/strings/en';

/** Shown only while nobody is signed in: the whole site works without an account. */
export function GuestNote({ className }: { className?: string }) {
  const { status } = useAuth();
  if (status !== 'guest') return null;

  return <p className={clsx('text-sm leading-relaxed', className)}>{en.home.guestNote}</p>;
}
