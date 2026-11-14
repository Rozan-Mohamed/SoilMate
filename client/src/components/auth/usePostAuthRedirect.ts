'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useJourney } from '@/providers/JourneyProvider';
import { safeNextRoute } from '@/lib/auth/redirect';

/**
 * Wait for the account's journey before redirecting. JourneyProvider refetches
 * when the identity changes, and this hook also asks for a refresh explicitly as
 * the stage docs require. If that journey call fails, the provider falls back to
 * /explore, which is exactly the documented failure target.
 */
export function usePostAuthRedirect() {
  const router = useRouter();
  const { status } = useAuth();
  const { loading, nextRoute, refresh } = useJourney();
  const [pending, setPending] = useState(false);
  const refreshStarted = useRef(false);
  const redirected = useRef(false);

  const start = useCallback(() => setPending(true), []);

  useEffect(() => {
    if (!pending || status !== 'account' || refreshStarted.current) return;
    refreshStarted.current = true;
    void refresh();
  }, [pending, status, refresh]);

  useEffect(() => {
    if (!pending || status !== 'account' || loading || redirected.current) return;
    redirected.current = true;
    router.push(safeNextRoute(nextRoute));
  }, [pending, status, loading, nextRoute, router]);

  return { pending, start };
}
