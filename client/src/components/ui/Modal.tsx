'use client';

import { useEffect, useId, useRef } from 'react';
import clsx from 'clsx';

type ModalSize = 'sm' | 'md' | 'lg';

type Props = {
  open: boolean;
  /** Called on Escape or a backdrop click. */
  onClose: () => void;
  /** Kept for backward compatibility with the game's modals. */
  labelledBy?: string;
  /** New callers can pass a visible heading; it becomes the dialog label. */
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
};

const widths: Record<ModalSize, string> = {
  sm: 'w-[min(92vw,22rem)]',
  md: 'w-[min(92vw,26rem)]',
  lg: 'w-[min(92vw,34rem)]',
};

// Built on the native <dialog>: the browser traps focus, makes the page behind inert,
// closes on Escape and puts focus back where it was.
export function Modal({
  open,
  onClose,
  labelledBy,
  title,
  children,
  footer,
  size = 'md',
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const generatedTitleId = useId();
  const titleId = `modal-title-${generatedTitleId}`;
  const labelId = title ? titleId : labelledBy;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // The native dialog makes the page inert, but the document can still scroll.
  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelId}
      aria-modal="true"
      role="dialog"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={clsx(
        'm-auto rounded-card border-0 bg-card p-0 text-ink shadow-card backdrop:bg-deep/40',
        widths[size],
      )}
    >
      {open && (
        <div className={clsx('p-6 text-center', footer && 'pb-4')}>
          {title && (
            <h2 id={titleId} className="text-xl font-extrabold text-deep">
              {title}
            </h2>
          )}
          <div className={clsx(title && 'mt-2')}>{children}</div>
        </div>
      )}
      {open && footer && <div className="border-t border-mint-3 px-6 py-4">{footer}</div>}
    </dialog>
  );
}
