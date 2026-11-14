'use client';

import type { MetaOptions } from '@/lib/soilmate/types';
import { FARM_SEASONS } from '@/lib/farm/validation';
import type { FarmSeasons } from '@/lib/farm/types';
import { en } from '@/strings/en';
import { FarmSection } from './FarmSection';

type Props = {
  options: MetaOptions;
  seasonsPerYear: FarmSeasons | null;
  error?: string | null;
  disabled?: boolean;
  onSelect: (value: FarmSeasons) => void;
};

/**
 * The growing seasons per year: one or two. The "Recommended" mark comes from
 * the API; it is shown, but nothing is preselected because of it.
 */
export function FarmSeasonsSection({
  options,
  seasonsPerYear,
  error,
  disabled = false,
  onSelect,
}: Props) {
  const seasons = options.seasonsPerYear.filter((option) =>
    FARM_SEASONS.includes(option.id as FarmSeasons),
  );

  return (
    <FarmSection title={en.farm.seasons.title} error={error}>
      <ul className="grid gap-2 sm:grid-cols-3">
        {seasons.map((option) => {
          const selected = seasonsPerYear === option.id;

          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => onSelect(option.id as FarmSeasons)}
                disabled={disabled}
                aria-pressed={selected}
                aria-label={option.label}
                className={
                  selected
                    ? 'flex w-full flex-col items-start gap-1 rounded-2xl border-2 border-primary bg-mint-2 p-4 text-left shadow-card transition-colors'
                    : 'flex w-full flex-col items-start gap-1 rounded-2xl border-2 border-mint-3 bg-white p-4 text-left transition-colors hover:border-leaf/60'
                }
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-deep text-base font-extrabold text-white">
                    {option.id}
                  </span>
                  {option.recommended && (
                    <span className="rounded-full bg-bright px-2 py-0.5 text-[10px] font-extrabold text-deep">
                      {en.farm.seasons.recommended}
                    </span>
                  )}
                </span>

                <span className="mt-1 text-sm font-extrabold text-deep">{option.label}</span>
                {option.hint && (
                  <span className="text-[11px] font-semibold text-ink-soft">{option.hint}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </FarmSection>
  );
}
