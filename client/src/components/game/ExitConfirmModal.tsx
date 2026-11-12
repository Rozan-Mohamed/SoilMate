'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { en } from '@/strings/en';

type Props = { open: boolean; onKeep: () => void; onLeave: () => void };

export function ExitConfirmModal({ open, onKeep, onLeave }: Props) {
  return (
    <Modal open={open} onClose={onKeep} labelledBy="exit-title">
      <p id="exit-title" className="text-lg font-bold text-deep">
        {en.exitModal.text}
      </p>
      <div className="mt-5 flex flex-col gap-2.5">
        <Button onClick={onKeep}>{en.exitModal.keep}</Button>
        <Button variant="secondary" onClick={onLeave} sfx="nav">
          {en.exitModal.leave}
        </Button>
      </div>
    </Modal>
  );
}
