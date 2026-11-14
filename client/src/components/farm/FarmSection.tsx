'use client';

import type { ReactNode } from 'react';

type Props = {
  title: string;
  /** A short line under the title, e.g. the intro line of the equipment. */
  intro?: string | null;
  /** The message of the API or of the browser validation for this section. */
  error?: string | null;
  /** On the right of the title, e.g. "(2 selected)". */
  aside?: ReactNode;
  children: ReactNode;
};

/** One section of the My Farm form. */
export function FarmSection({ title, intro = null, error = null, aside = null, children }: Props) {
  return (
    <section className="rounded-card bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-deep">
          <span
            aria-hidden="true"
            className="size-2 shrink-0 rounded-full bg-primary"
          />
          {title}
        </h2>
        {aside && <div className="shrink-0 text-xs font-bold text-ink-soft">{aside}</div>}
      </div>

      {intro && <p className="mt-1.5 text-xs font-semibold text-ink-soft">{intro}</p>}

      <div className="mt-3">{children}</div>

      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-peach-ink">
          {error}
        </p>
      )}
    </section>
  );
}
