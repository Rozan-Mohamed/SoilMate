'use client';

import { Button } from '@/components/ui/Button';
import { en } from '@/strings/en';

type Props = {
  /** The name of every step, in order. */
  labels: string[];
  current: number;
  onChange: (index: number) => void;
};

/**
 * The step navigation of the crop health pop-up: Back, the dots of the five
 * steps and Next (Restart on the last step).
 */
export function DetailSteps({ labels, current, onChange }: Props) {
  const last = labels.length - 1;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onChange(Math.max(current - 1, 0))}
          disabled={current === 0}
        >
          {en.explore.details.back}
        </Button>

        <div className="flex items-center gap-1.5" role="group" aria-label={en.explore.details.step(current + 1, labels.length)}>
          {labels.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => onChange(index)}
              aria-current={index === current ? 'step' : undefined}
              aria-label={label}
              title={label}
              className={
                index === current
                  ? 'size-2.5 rounded-full bg-primary'
                  : 'size-2.5 rounded-full bg-mint-3 transition-colors hover:bg-leaf'
              }
            />
          ))}
        </div>

        {current === last ? (
          <Button size="sm" onClick={() => onChange(0)}>
            {en.explore.details.restart}
          </Button>
        ) : (
          <Button size="sm" onClick={() => onChange(Math.min(current + 1, last))}>
            {en.explore.details.next}
          </Button>
        )}
      </div>

      <p className="text-center text-xs font-bold text-deep">
        {labels[current]}
        <span className="ml-1 font-semibold text-ink-soft">
          {en.explore.details.step(current + 1, labels.length)}
        </span>
      </p>
    </div>
  );
}
