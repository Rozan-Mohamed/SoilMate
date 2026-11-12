'use client';

import { useEffect, useRef } from 'react';

/**
 * While `active`, anything that would take the player out of the game asks first:
 *  - closing or refreshing the tab (the browser's own warning),
 *  - clicking any in-app link (navbar, pipeline) -> `onAttempt(href)`,
 *  - the browser Back button -> `onAttempt('/learn')`.
 * Next's App Router has no route blocker, so links are caught in the capture phase.
 */
export function useLeaveGuard(active: boolean, onAttempt: (href: string) => void) {
  const callback = useRef(onAttempt);
  const pushed = useRef(false);
  useEffect(() => {
    callback.current = onAttempt;
  }, [onAttempt]);

  useEffect(() => {
    if (!active) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const anchor = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank') return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const here = window.location.pathname;
      if (url.pathname === here) return;
      e.preventDefault();
      e.stopPropagation();
      callback.current(url.pathname + url.search);
    };

    // One extra history entry, so Back lands on us first and we can ask.
    if (!pushed.current) {
      window.history.pushState({ soilmateGuard: true }, '', window.location.href);
      pushed.current = true;
    }
    const onPopState = () => {
      window.history.pushState({ soilmateGuard: true }, '', window.location.href);
      callback.current('/learn');
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState);
    };
  }, [active]);
}
