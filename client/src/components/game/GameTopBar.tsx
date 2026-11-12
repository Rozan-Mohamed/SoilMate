'use client';

import { X } from 'lucide-react';
import { Hearts } from './Hearts';
import { ProgressBar } from './ProgressBar';
import { StarCounter } from './StarCounter';
import { playSfx } from '@/audio/store';
import { en } from '@/strings/en';

type Props = {
  stage: number;
  current: number;
  total: number;
  hearts: number;
  points: number;
  onClose: () => void;
};

export function GameTopBar({ stage, current, total, hearts, points, onClose }: Props) {
  return (
    <div className="flex items-center gap-3 border-b border-mint-3 px-4 py-3">
      <button
        type="button"
        onClick={() => {
          playSfx('tap');
          onClose();
        }}
        aria-label={en.game.close}
        className="grid size-10 shrink-0 place-items-center rounded-full bg-mint-2 text-deep transition-colors hover:bg-mint-3"
      >
        <X className="size-5" aria-hidden="true" />
      </button>
      <ProgressBar current={current} total={total} stage={stage} />
      <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
        <Hearts hearts={hearts} />
        <StarCounter points={points} />
      </div>
    </div>
  );
}
