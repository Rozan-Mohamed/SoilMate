import { Icon } from '@/components/ui/Icon';
import type { RecapChip } from '@/api/types';

// Game 2 only. The chips come from the API recap array.
export function RecapChips({ chips }: { chips: RecapChip[] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-2">
      {chips.map((chip) => (
        <li
          key={chip.label}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-mint-3 bg-white px-3 py-1.5 text-sm font-bold text-deep"
        >
          <Icon name={chip.iconKey} className="size-5" />
          {chip.label}
        </li>
      ))}
    </ul>
  );
}
