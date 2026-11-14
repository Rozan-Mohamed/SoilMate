'use client';

import { Combine, Droplets, Hand, Sprout, Tractor } from 'lucide-react';
import type { Equipment, MetaOptions } from '@/lib/soilmate/types';
import { en } from '@/strings/en';
import { FarmOptionCard } from './FarmOptionCard';
import { FarmSection } from './FarmSection';

type Props = {
  options: MetaOptions;
  equipment: Equipment[];
  error?: string | null;
  disabled?: boolean;
  onToggle: (value: Equipment) => void;
};

/** A small icon per machine, so the cards are easy to scan. */
const ICONS: Record<Equipment, typeof Tractor> = {
  standard_tractor: Tractor,
  seed_drill_planter: Sprout,
  no_till_drill: Sprout,
  combine_harvester: Combine,
  drip_pivot_irrigation: Droplets,
  hand_tiller_tools: Hand,
};

/**
 * The equipment and the machinery. This section may stay empty: the farmer
 * simply has none of it. A selected card says "Available", the others say
 * "Optional" — they are selection states, not facts about the farm.
 */
export function FarmEquipmentSection({
  options,
  equipment,
  error,
  disabled = false,
  onToggle,
}: Props) {
  return (
    <FarmSection
      title={en.farm.equipment.title}
      intro={en.farm.equipment.intro}
      error={error}
    >
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.equipment.map((option) => {
          const selected = equipment.includes(option.id);
          const Icon = ICONS[option.id] ?? Tractor;

          return (
            <li key={option.id}>
              <FarmOptionCard
                label={option.label}
                selected={selected}
                subLabel={selected ? en.farm.equipment.available : en.farm.equipment.optional}
                disabled={disabled}
                icon={<Icon className="size-4" aria-hidden="true" />}
                onClick={() => onToggle(option.id)}
              />
            </li>
          );
        })}
      </ul>
    </FarmSection>
  );
}
