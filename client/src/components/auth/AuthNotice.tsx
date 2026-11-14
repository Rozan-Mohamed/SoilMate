'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import {
  dismissAuthNotice,
  getAuthNoticeServerSnapshot,
  getAuthNoticeSnapshot,
  subscribeAuthNotice,
} from '@/lib/auth/notice';
import { en } from '@/strings/en';

/**
 * Shows the one-time "We kept the farm..." notice after a login that discarded
 * guest data. It lives in the root layout, so it survives the redirect; the
 * external store reads sessionStorage once and clears the key when consumed.
 */
export function AuthNotice() {
  const message = useSyncExternalStore(
    subscribeAuthNotice,
    getAuthNoticeSnapshot,
    getAuthNoticeServerSnapshot,
  );

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(dismissAuthNotice, 6000);
    return () => window.clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-[70] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-leaf/40 bg-white px-4 py-3 text-sm font-semibold text-deep shadow-card"
    >
      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
      <p className="flex-1">{message}</p>
      <button
        type="button"
        onClick={dismissAuthNotice}
        aria-label={en.ui.dismiss}
        className="-my-1 -mr-1 grid size-7 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-mint-2 hover:text-deep"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
