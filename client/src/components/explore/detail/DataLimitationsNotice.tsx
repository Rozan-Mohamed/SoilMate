'use client';

import { AlertTriangle } from 'lucide-react';

type Props = {
  items: string[];
  title?: string;
};

/**
 * Styled "Data limitations" / caution notice for Explore Open Details.
 * Renders backend-supplied limitation text unchanged.
 */
export function DataLimitationsNotice({ items, title = 'Data limitations' }: Props) {
  if (!items.length) return null;

  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-amber-300/80 bg-amber-50 px-3 py-3 text-left"
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700"
          aria-hidden="true"
        >
          <AlertTriangle className="size-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-deep">{title}</h3>
          <ul className="mt-2 space-y-1.5">
            {items.map((item, index) => (
              <li key={index} className="flex gap-2 text-[11px] leading-relaxed text-deep/90">
                <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                <span className="font-semibold">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
