'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';

// Last safety net: if a page crashes while rendering, show the friendly error instead of a blank screen.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-3xl border border-mint-3 bg-card shadow-card">
        <ErrorState onRetry={reset} />
      </div>
    </section>
  );
}
