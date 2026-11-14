'use client';

import clsx from 'clsx';
import { X } from 'lucide-react';
import { en } from '@/strings/en';

type Props = {
  selected?: boolean;
  disabled?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
};

const base =
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors';

const tones = {
  selected: 'border-primary bg-primary/10 text-primary',
  idle: 'border-mint-3 bg-mint-2 text-ink-soft hover:border-leaf/50',
};

export function Chip({ selected = false, disabled = false, onRemove, onClick, children, className }: Props) {
  const classes = clsx(
    base,
    selected ? tones.selected : tones.idle,
    disabled && 'cursor-not-allowed opacity-50',
    className,
  );

  // A remove control cannot live inside another button, so removal takes
  // precedence over the optional click-to-select behaviour.
  if (onRemove) {
    return (
      <span className={classes}>
        {children}
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={en.ui.remove}
          className="grid size-5 place-items-center rounded-full text-current transition-colors hover:bg-white/70 disabled:cursor-not-allowed"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </span>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={selected}
        className={classes}
      >
        {children}
      </button>
    );
  }

  return <span className={classes}>{children}</span>;
}
