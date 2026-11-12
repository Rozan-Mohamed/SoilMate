'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Mascot } from './Mascot';
import { en } from '@/strings/en';

type Props = { open: boolean; onTryAgain: () => void; onBack: () => void };

// Gentle tone, no red. Escape takes the player back to the games list.
export function OutOfHeartsModal({ open, onTryAgain, onBack }: Props) {
  return (
    <Modal open={open} onClose={onBack} labelledBy="hearts-title">
      <Mascot mood="oops" className="mx-auto size-24" decorative />
      <p id="hearts-title" className="mt-2 text-lg font-bold text-deep">
        {en.outOfHeartsModal.text}
      </p>
      <div className="mt-5 flex flex-col gap-2.5">
        <Button onClick={onTryAgain}>{en.outOfHeartsModal.tryAgain}</Button>
        <Button variant="secondary" onClick={onBack} sfx="nav">
          {en.outOfHeartsModal.back}
        </Button>
      </div>
    </Modal>
  );
}
