'use client';

import { useEffect, useRef } from 'react';

type Options = {
  /** The guard only works while a round is in progress. */
  active: boolean;
  /** Called with the place the player wanted to go (the browser back button asks for /learn). */
  onAttemptLeave: (href: string) => void;
};

// Next.js has no router blocker, so the guard has three parts:
//  1. beforeunload: the browser warns on tab close or refresh.
//  2. A history marker: the browser Back button is caught and asks first.
//  3. A capture-phase click listener: in-app links (navbar, pipeline) ask first.
export function useExitGuard({ active, onAttemptLeave }: Options) {
  const callback = useRef(onAttemptLeave);
  useEffect(() => {
    callback.current = onAttemptLeave;
  });

  useEffect(() => {
    if (!active) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const onPopState = () => {
      // Put the marker back so the player stays on this page, then ask.
      window.history.pushState(null, '', window.location.href);
      callback.current('/learn');
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const anchor = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const here = window.location.pathname;
      if (url.pathname === here) return;
      e.preventDefault();
      e.stopPropagation();
      callback.current(url.pathname + url.search);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('popstate', onPopState);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('click', onClick, true);
    };
  }, [active]);
}
