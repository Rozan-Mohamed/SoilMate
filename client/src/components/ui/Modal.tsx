'use client';

import { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  /** Called on Escape. */
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
};

// Built on the native <dialog>: the browser traps focus, makes the page behind inert,
// closes on Escape and puts focus back where it was.
export function Modal({ open, onClose, labelledBy, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(92vw,26rem)] rounded-card border-0 bg-card p-0 text-ink shadow-card backdrop:bg-deep/40"
    >
      {open && <div className="p-6 text-center">{children}</div>}
    </dialog>
  );
}
