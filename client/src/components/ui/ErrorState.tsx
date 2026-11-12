'use client';

import { Mascot } from '@/components/game/Mascot';
import { Button } from './Button';
import { en } from '@/strings/en';

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <Mascot mood="oops" className="size-24" />
      <p className="text-lg font-bold text-deep">{en.errorState.text}</p>
      <Button onClick={onRetry}>{en.errorState.button}</Button>
    </div>
  );
}
