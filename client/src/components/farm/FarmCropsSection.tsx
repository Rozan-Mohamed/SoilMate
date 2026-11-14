'use client';

import clsx from 'clsx';
import { Sprout } from 'lucide-react';
import type { Crop } from '@/lib/soilmate/types';
import { en } from '@/strings/en';
import { FarmSection } from './FarmSection';

type Props = {
  crops: Crop[];
  selected: string[];
  error?: string | null;
  disabled?: boolean;
  onToggle: (cropId: string) => void;
};

/**
 * The current crops: image cards, multi select. The crop names and images come
 * from the API, never from the mockup.
 */
export function FarmCropsSection({ crops, selected, error, disabled = false, onToggle }: Props) {
  return (
    <FarmSection
      title={en.farm.crops.title}
      aside={
        <>
          <span className="hidden sm:inline">{en.farm.crops.multiSelect}</span>
          <span className="ml-2 sm:hidden">{en.farm.crops.selected(selected.length)}</span>
        </>
      }
      error={error}
    >
      {crops.length === 0 ? (
        // The API answered, but the crop catalog is empty. That is not the same
        // as "the farmer has not chosen anything yet", so it says so.
        <div className="rounded-2xl border border-peach-ink/20 bg-peach-soft/50 px-3 py-3">
          <p className="text-sm font-extrabold text-peach-ink">
            {en.farm.crops.catalogEmpty}
          </p>
          <p className="mt-1 text-xs font-semibold text-ink-soft">
            {en.farm.crops.catalogEmptyHint}
          </p>
        </div>
      ) : (
        <>
          {selected.length === 0 && (
            <p className="mb-2 text-sm text-ink-soft">{en.farm.crops.empty}</p>
          )}

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {crops.map((crop) => {
              const isSelected = selected.includes(crop.id);

              return (
              <li key={crop.id}>
                <button
                  type="button"
                  onClick={() => onToggle(crop.id)}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  className={clsx(
                    'flex w-full flex-col overflow-hidden rounded-2xl border-2 bg-white text-left transition-colors',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                    isSelected ? 'border-primary shadow-card' : 'border-mint-3 hover:border-leaf/60',
                  )}
                >
                  <span className="relative block h-24 w-full bg-mint-2 sm:h-28">
                    {crop.image.thumbUrl ? (
                      // Crop images are absolute API URLs, so a plain image is used.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={crop.image.thumbUrl}
                        alt={crop.image.alt}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="grid size-full place-items-center text-primary">
                        <Sprout className="size-8" aria-hidden="true" />
                      </span>
                    )}

                    {isSelected && (
                      <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-white">
                        <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
                          <path
                            d="M4 10.5 8 14l8-8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </span>

                  <span className="flex flex-col gap-0.5 p-2.5">
                    <span className="truncate text-sm font-extrabold text-deep">{crop.name}</span>
                    {crop.subtitle && (
                      <span className="truncate text-[11px] font-semibold text-ink-soft">
                        {crop.subtitle}
                      </span>
                    )}
                  </span>
                </button>
              </li>
              );
            })}
          </ul>
        </>
      )}
    </FarmSection>
  );
}
