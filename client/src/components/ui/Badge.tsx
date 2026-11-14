import clsx from 'clsx';

type Tone = 'neutral' | 'good' | 'warn' | 'orange' | 'info';

const tones: Record<Tone, string> = {
  neutral: 'border-mint-3 bg-mint-2 text-ink-soft',
  good: 'border-leaf/40 bg-mint-2 text-primary',
  warn: 'border-gold/60 bg-gold-soft text-deep',
  orange: 'border-peach/50 bg-peach-soft text-peach-ink',
  info: 'border-mint-3 bg-white text-deep',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
