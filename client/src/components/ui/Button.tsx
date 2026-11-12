'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { playSfx } from '@/audio/store';
import type { SfxName } from '@/audio/engine';

type Variant = 'primary' | 'secondary' | 'ghost';

type CommonProps = {
  variant?: Variant;
  /** Sound played on press. `false` for silence. */
  sfx?: SfxName | false;
  className?: string;
  children: React.ReactNode;
};

type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    href?: undefined;
    ref?: React.Ref<HTMLButtonElement>;
  };
type LinkProps = CommonProps & { href: string; onClick?: () => void; 'aria-label'?: string };

const base =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-btn px-6 text-lg font-bold ' +
  'select-none transition-[transform,box-shadow,background-color] duration-100 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary:
    'bg-deep text-white shadow-press hover:bg-[#1f5040] active:translate-y-[3px] active:shadow-[0_1px_0_0_rgb(24_64_48/0.28)]',
  secondary:
    'border-2 border-mint-3 bg-white text-deep shadow-press-soft hover:bg-mint-2 active:translate-y-[2px] active:shadow-none',
  ghost: 'min-h-10 px-3 text-base text-ink-soft hover:text-deep',
};

export function Button(props: ButtonProps | LinkProps) {
  const { variant = 'primary', sfx = 'tap', className, children } = props;
  const classes = clsx(base, variants[variant], className);

  if (props.href !== undefined) {
    const { href, onClick, 'aria-label': ariaLabel } = props;
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        className={classes}
        onClick={() => {
          if (sfx) playSfx(sfx);
          onClick?.();
        }}
      >
        {children}
      </Link>
    );
  }

  const { variant: _v, sfx: _s, className: _c, children: _ch, onClick, ...rest } = props;
  void _v;
  void _s;
  void _c;
  void _ch;
  return (
    <button
      type="button"
      {...rest}
      className={classes}
      onClick={(e) => {
        if (sfx) playSfx(sfx);
        onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}
