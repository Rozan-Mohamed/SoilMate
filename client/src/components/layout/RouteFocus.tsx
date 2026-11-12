'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// After moving to another page, put keyboard and screen-reader focus on the page content,
// so people do not have to tab through the navbar again. Skipped on the first load.
export function RouteFocus() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}
