'use client';

import { Droplets, Waves } from 'lucide-react';
import type { MetaOptions, WaterAvailability, WaterSource } from '@/lib/soilmate/types';
import { en } from '@/strings/en';
import { FarmOptionCard } from './FarmOptionCard';
import { FarmSection } from './FarmSection';

type Props = {
  options: MetaOptions;
  waterSource: WaterSource | null;
  waterSourceOther: string;
  waterAvailability: WaterAvailability | null;
  waterSourceError?: string | null;
  waterSourceOtherError?: string | null;
  waterAvailabilityError?: string | null;
  disabled?: boolean;
  onSelectWaterSource: (value: WaterSource) => void;
  onChangeWaterSourceOther: (value: string) => void;
  onSelectWaterAvailability: (value: WaterAvailability) => void;
};

/**
 * Where the water comes from and how available it is. Both lists come from
 * GET /meta/options, so the labels never drift.
 */
export function FarmWaterSection({
  options,
  waterSource,
  waterSourceOther,
  waterAvailability,
  waterSourceError = null,
  waterSourceOtherError = null,
  waterAvailabilityError = null,
  disabled = false,
  onSelectWaterSource,
  onChangeWaterSourceOther,
  onSelectWaterAvailability,
}: Props) {
  return (
    <>
      <FarmSection title={en.farm.water.source} error={waterSourceError}>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {options.waterSource.map((option) => (
            <li key={option.id}>
              <FarmOptionCard
                label={option.label}
                hint={option.hint}
                selected={waterSource === option.id}
                disabled={disabled}
                icon={<Droplets className="size-4" aria-hidden="true" />}
                onClick={() => onSelectWaterSource(option.id)}
              />
            </li>
          ))}
        </ul>

        {waterSource === 'other' && (
          <div className="mt-3">
            <label htmlFor="farm-water-other" className="block text-sm font-bold text-deep">
              {en.farm.water.other}
            </label>
            <input
              id="farm-water-other"
              name="waterSourceOther"
              type="text"
              value={waterSourceOther}
              maxLength={60}
              disabled={disabled}
              onChange={(event) => onChangeWaterSourceOther(event.target.value)}
              aria-describedby="farm-water-other-hint"
              className="mt-1.5 w-full rounded-full border-2 border-mint-3 bg-mint-2/70 px-4 py-2.5 text-base text-ink transition-colors focus:border-primary focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p id="farm-water-other-hint" className="mt-1.5 text-xs text-ink-soft">
              {en.farm.water.otherHint}
            </p>
            {waterSourceOtherError && (
              <p role="alert" className="mt-1.5 text-sm font-semibold text-peach-ink">
                {waterSourceOtherError}
              </p>
            )}
          </div>
        )}
      </FarmSection>

      <FarmSection title={en.farm.water.availability} error={waterAvailabilityError}>
        <ul className="grid gap-2 sm:grid-cols-3">
          {options.waterAvailability.map((option) => (
            <li key={option.id}>
              <FarmOptionCard
                label={option.label}
                hint={option.hint}
                selected={waterAvailability === option.id}
                disabled={disabled}
                icon={<Waves className="size-4" aria-hidden="true" />}
                onClick={() => onSelectWaterAvailability(option.id)}
              />
            </li>
          ))}
        </ul>
      </FarmSection>
    </>
  );
}
