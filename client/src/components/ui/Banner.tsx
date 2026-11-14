import clsx from 'clsx';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

type Tone = 'error' | 'info' | 'success' | 'warn';

const tones: Record<Tone, { classes: string; Icon: typeof Info }> = {
  error: { classes: 'border-peach/60 bg-peach-soft text-peach-ink', Icon: AlertCircle },
  info: { classes: 'border-mint-3 bg-mint-2 text-deep', Icon: Info },
  success: { classes: 'border-leaf/40 bg-mint-2 text-primary', Icon: CheckCircle2 },
  warn: { classes: 'border-gold/70 bg-gold-soft text-deep', Icon: AlertTriangle },
};

export function Banner({
  tone = 'info',
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  const { classes, Icon } = tones[tone];
  return (
    <div
      role={tone === 'error' || tone === 'warn' ? 'alert' : 'status'}
      className={clsx(
        'flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm font-semibold',
        classes,
        className,
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
