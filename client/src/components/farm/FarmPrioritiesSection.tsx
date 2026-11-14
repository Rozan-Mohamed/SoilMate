'use client';

import { Coins, Droplets, ShieldCheck, Sprout, TrendingUp } from 'lucide-react';
import type { MetaOptions, Priority } from '@/lib/soilmate/types';
import { en } from '@/strings/en';
import { FarmOptionCard } from './FarmOptionCard';
import { FarmSection } from './FarmSection';

type Props = {
  options: MetaOptions;
  priorities: Priority[];
  error?: string | null;
  disabled?: boolean;
  onToggle: (value: Priority) => void;
};

/** A small icon per priority, so the cards are easy to scan. */
const ICONS: Record<Priority, typeof Droplets> = {
  save_water: Droplets,
  improve_soil: Sprout,
  protect_land: ShieldCheck,
  manage_costs: Coins,
  earn_more: TrendingUp,
};

/**
 * The farmer priorities: 1 to 3 of them. When the limit is reached, the rest
 * are disabled, and the count is always shown.
 */
export function FarmPrioritiesSection({
  options,
  priorities,
  error,
  disabled = false,
  onToggle,
}: Props) {
  const max = options.limits.maxPriorities;
  const atMax = priorities.length >= max;

  return (
    <FarmSection
      title={en.farm.priorities.title}
      intro={en.farm.priorities.hint}
      aside={en.farm.priorities.selected(priorities.length)}
      error={error}
    >
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.priority.map((option) => {
          const selected = priorities.includes(option.id);
          const Icon = ICONS[option.id] ?? Sprout;

          return (
            <li key={option.id}>
              <FarmOptionCard
                label={option.label}
                hint={option.hint}
                selected={selected}
                disabled={disabled || (!selected && atMax)}
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
