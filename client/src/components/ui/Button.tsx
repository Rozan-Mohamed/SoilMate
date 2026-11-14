'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import { playSfx } from '@/audio/store';
import type { SfxName } from '@/audio/engine';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'bright';
type Size = 'sm' | 'md' | 'lg';

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
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
  'inline-flex items-center justify-center gap-2 rounded-btn font-bold ' +
  'select-none transition-[transform,box-shadow,background-color] duration-100 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

// The original Button always applied its default sizing classes after the
// variant. Keep that effective appearance for the Game unless a caller passes
// an explicit size.
const sizes: Record<Size, string> = {
  sm: 'min-h-10 px-4 text-sm',
  md: 'min-h-12 px-6 text-lg',
  lg: 'min-h-14 px-8 text-xl',
};

const variants: Record<Variant, string> = {
  primary:
    'bg-deep text-white shadow-press hover:bg-[#1f5040] active:translate-y-[3px] active:shadow-[0_1px_0_0_rgb(24_64_48/0.28)]',
  secondary:
    'border-2 border-mint-3 bg-white text-deep shadow-press-soft hover:bg-mint-2 active:translate-y-[2px] active:shadow-none',
  ghost: 'text-ink-soft hover:text-deep',
  danger:
    'bg-heart text-white shadow-press hover:bg-heart/90 active:translate-y-[3px] active:shadow-none',
  // For dark surfaces (the home hero and CTA band): the bright accent green.
  bright:
    'bg-bright text-deep shadow-press hover:brightness-95 active:translate-y-[3px] active:shadow-none',
};

function Content({
  loading,
  iconLeft,
  iconRight,
  children,
}: {
  loading: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      {loading ? (
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : iconLeft ? (
        <span aria-hidden="true" className="shrink-0">
          {iconLeft}
        </span>
      ) : null}
      {children}
      {!loading && iconRight ? (
        <span aria-hidden="true" className="shrink-0">
          {iconRight}
        </span>
      ) : null}
    </>
  );
}

export function Button(props: ButtonProps | LinkProps) {
  const {
    variant = 'primary',
    size,
    loading = false,
    iconLeft,
    iconRight,
    sfx = 'tap',
    className,
    children,
  } = props;

  const resolvedSize: Size = size ?? 'md';
  const classes = clsx(
    base,
    sizes[resolvedSize],
    variants[variant],
    loading && 'pointer-events-none opacity-50',
    className,
  );

  if (props.href !== undefined) {
    const { href, onClick, 'aria-label': ariaLabel } = props;
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        aria-busy={loading || undefined}
        aria-disabled={loading || undefined}
        tabIndex={loading ? -1 : undefined}
        className={classes}
        onClick={(event) => {
          if (loading) {
            event.preventDefault();
            return;
          }
          if (sfx) playSfx(sfx);
          onClick?.();
        }}
      >
        <Content loading={loading} iconLeft={iconLeft} iconRight={iconRight}>
          {children}
        </Content>
      </Link>
    );
  }

  const {
    onClick,
    type = 'button',
    disabled,
    ...rest
  } = props as ButtonProps;

  // The common props are not DOM attributes, so they never reach the button.
  delete rest.variant;
  delete rest.size;
  delete rest.loading;
  delete rest.iconLeft;
  delete rest.iconRight;
  delete rest.sfx;

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      onClick={(event) => {
        if (sfx) playSfx(sfx);
        onClick?.(event);
      }}
    >
      <Content loading={loading} iconLeft={iconLeft} iconRight={iconRight}>
        {children}
      </Content>
    </button>
  );
}
