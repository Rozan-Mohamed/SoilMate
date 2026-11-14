import clsx from 'clsx';
import { en } from '@/strings/en';

type Tone = 'primary' | 'leaf' | 'gold' | 'peach';

const fills: Record<Tone, string> = {
  primary: 'bg-primary',
  leaf: 'bg-leaf',
  gold: 'bg-gold',
  peach: 'bg-peach',
};

export function ProgressBar({
  value,
  tone = 'primary',
  label,
  className,
}: {
  value: number;
  tone?: Tone;
  label?: string;
  className?: string;
}) {
  const safeValue = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  const rounded = Math.round(safeValue);

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-ink-soft">{label}</span>
          <span className="text-xs font-bold text-deep">{rounded}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label ?? en.ui.progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rounded}
        className="h-2.5 overflow-hidden rounded-full bg-mint-3"
      >
        <div
          className={clsx('h-full rounded-full transition-[width] duration-300', fills[tone])}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
