import clsx from 'clsx';
import { en } from '@/strings/en';

type SpinnerSize = 'sm' | 'md' | 'lg';

const sizes: Record<SpinnerSize, string> = {
  sm: 'size-6 border-[3px]',
  md: 'size-10 border-4',
  lg: 'size-14 border-4',
};

export function Spinner({
  label,
  size = 'md',
  className,
}: {
  label?: string;
  size?: SpinnerSize;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx('flex flex-col items-center gap-3 py-10 text-ink-soft', className)}
    >
      <span
        aria-hidden="true"
        className={clsx('animate-spin rounded-full border-mint-3 border-t-primary', sizes[size])}
      />
      {label ? (
        <span className="text-sm font-semibold">{label}</span>
      ) : (
        <span className="sr-only">{en.ui.loading}</span>
      )}
    </div>
  );
}
