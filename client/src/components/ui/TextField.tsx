'use client';

import { useId, useState } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff } from 'lucide-react';
import { en } from '@/strings/en';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  label: string;
  error?: string;
  hint?: string;
  iconLeft?: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLInputElement>;
};

export function TextField({
  label,
  error,
  hint,
  iconLeft,
  type = 'text',
  className,
  id,
  ref,
  ...inputProps
}: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  const [visible, setVisible] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (visible ? 'text' : 'password') : type;

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-bold text-deep">
        {label}
      </label>

      <div className="relative">
        {iconLeft && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-soft"
          >
            {iconLeft}
          </span>
        )}

        <input
          {...inputProps}
          id={inputId}
          ref={ref}
          type={inputType}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={clsx(
            'w-full rounded-full border-2 bg-mint-2/70 px-4 py-3 text-base text-ink',
            'placeholder:text-ink-soft/70 transition-colors disabled:cursor-not-allowed disabled:opacity-60',
            iconLeft ? 'pl-11' : 'pl-4',
            isPassword ? 'pr-12' : 'pr-4',
            error
              ? 'border-peach focus:border-peach'
              : 'border-mint-3 focus:border-primary focus:bg-white',
            className,
          )}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? en.ui.hidePassword : en.ui.showPassword}
            aria-pressed={visible}
            className="absolute inset-y-0 right-2 my-auto grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-mint-2 hover:text-deep"
          >
            {visible ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 px-1 text-sm font-semibold text-peach-ink">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 px-1 text-sm text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
