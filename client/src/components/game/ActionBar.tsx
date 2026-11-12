'use client';

import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { en } from '@/strings/en';

type Props = {
  canCheck: boolean;
  checking: boolean;
  offline: boolean;
  onCheck: () => void;
  onSkip: () => void;
};

// Shown while a question is open. Once it is answered, the FeedbackBanner takes this place.
export function ActionBar({ canCheck, checking, offline, onCheck, onSkip }: Props) {
  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={onCheck}
        disabled={!canCheck || checking || offline}
        sfx={false}
        className="flex-1"
        aria-label={offline ? en.game.offlineCheck : undefined}
      >
        {checking ? (
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        ) : (
          <>
            {en.checkButton}
            <ArrowRight className="size-5" aria-hidden="true" />
          </>
        )}
      </Button>
      <Button variant="ghost" onClick={onSkip} disabled={checking || offline}>
        {en.skipButton}
      </Button>
    </div>
  );
}
