import { Badge } from './Badge';
import { en } from '@/strings/en';

/** Visible whenever the API marks a block's scores as `status: "placeholder"`. */
export function SampleBadge({ className }: { className?: string }) {
  return (
    <Badge tone="warn" className={className}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-gold" />
      {en.ui.sampleScores}
    </Badge>
  );
}
