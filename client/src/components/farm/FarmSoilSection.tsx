'use client';

import { Layers } from 'lucide-react';
import type { MetaOptions, SoilType } from '@/lib/soilmate/types';
import { en } from '@/strings/en';
import { FarmOptionCard } from './FarmOptionCard';
import { FarmSection } from './FarmSection';

type Props = {
  options: MetaOptions;
  soilType: SoilType | null;
  error?: string | null;
  disabled?: boolean;
  onSelect: (value: SoilType) => void;
};

/**
 * The soil type. "Not Sure" is a real answer: it uses the hint of the API and
 * promises no soil dataset that does not exist for this area.
 */
export function FarmSoilSection({ options, soilType, error, disabled = false, onSelect }: Props) {
  return (
    <FarmSection title={en.farm.soil.title} error={error}>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {options.soilType.map((option) => (
          <li key={option.id}>
            <FarmOptionCard
              label={option.label}
              hint={option.hint}
              selected={soilType === option.id}
              disabled={disabled}
              icon={<Layers className="size-4" aria-hidden="true" />}
              onClick={() => onSelect(option.id)}
            />
          </li>
        ))}
      </ul>
    </FarmSection>
  );
}
