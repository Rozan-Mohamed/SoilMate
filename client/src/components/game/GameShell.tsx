import clsx from 'clsx';

// The navbar, the pipeline and the hill background come from the layouts, so the shell
// only has to centre the column. Extra bottom padding keeps content clear of the fixed bars.
export function GameShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('mx-auto w-full max-w-[720px] px-4 pt-4 pb-44 sm:pb-16', className)}>
      {children}
    </div>
  );
}
