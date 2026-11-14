import clsx from 'clsx';

type Props = {
  children: React.ReactNode;
  /** `dark` is for photos and the dark CTA band. */
  tone?: 'light' | 'dark';
  className?: string;
};

/** Small uppercase pill used above every section title. */
export function Eyebrow({ children, tone = 'light', className }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider',
        tone === 'dark' ? 'bg-white/15 text-white' : 'bg-mint-2 text-primary',
        className,
      )}
    >
      {children}
    </span>
  );
}
