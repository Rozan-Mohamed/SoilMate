'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

type Props = {
  label: string;
  hint?: string | null;
  selected: boolean;
  disabled?: boolean;
  /** A badge from the API, e.g. the "Recommended" mark of the seasons. */
  badge?: string | null;
  icon?: ReactNode;
  /** A small line under the label, e.g. "Available" / "Optional". */
  subLabel?: string | null;
  onClick: () => void;
};

/**
 * One selectable card of the My Farm form. The colour is never the only
 * signal: the selected card also shows a check.
 */
export function FarmOptionCard({
  label,
  hint,
  selected,
  disabled = false,
  badge = null,
  icon,
  subLabel = null,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={clsx(
        'flex w-full flex-col items-start gap-1 rounded-2xl border-2 p-3 text-left transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'border-primary bg-mint-2 shadow-card'
          : 'border-mint-3 bg-white hover:border-leaf/60',
      )}
    >
      <span className="flex w-full items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          {icon && <span className="shrink-0 text-primary">{icon}</span>}
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold text-deep">{label}</span>
            {subLabel && (
              <span className="block text-[11px] font-bold text-ink-soft">{subLabel}</span>
            )}
          </span>
        </span>

        {selected ? (
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-white">
            <Check className="size-3.5" aria-hidden="true" />
          </span>
        ) : null}
      </span>

      {hint && <span className="text-[11px] font-semibold text-ink-soft">{hint}</span>}

      {badge && (
        <span className="rounded-full bg-bright px-2 py-0.5 text-[10px] font-extrabold text-deep">
          {badge}
        </span>
      )}
    </button>
  );
}
