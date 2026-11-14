'use client';

import clsx from 'clsx';
import { Layers, Satellite } from 'lucide-react';
import type { BaseMapId } from '@/lib/explore/basemaps';
import { en } from '@/strings/en';

type Props = {
  value: BaseMapId;
  onChange: (id: BaseMapId) => void;
  satelliteAvailable: boolean;
  satelliteReason: string | null;
};

/**
 * The basemap switch: Street or Satellite imagery underneath the agricultural
 * data layer. It never changes the selected area or the data layer.
 */
export function BaseMapSwitch({ value, onChange, satelliteAvailable, satelliteReason }: Props) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div
        role="group"
        aria-label={en.explore.baseMap.label}
        className="inline-flex rounded-full border border-mint-3 bg-white/95 p-1 shadow-card"
      >
        <button
          type="button"
          onClick={() => onChange('street')}
          aria-pressed={value === 'street'}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition-colors',
            value === 'street' ? 'bg-deep text-white' : 'text-ink-soft hover:text-deep',
          )}
        >
          <Layers className="size-3.5" aria-hidden="true" />
          {en.explore.baseMap.street}
        </button>

        <button
          type="button"
          onClick={() => onChange('satellite')}
          aria-pressed={value === 'satellite'}
          disabled={!satelliteAvailable}
          title={satelliteAvailable ? undefined : (satelliteReason ?? undefined)}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition-colors',
            value === 'satellite'
              ? 'bg-deep text-white'
              : 'text-ink-soft hover:text-deep',
            !satelliteAvailable && 'cursor-not-allowed opacity-50 hover:text-ink-soft',
          )}
        >
          <Satellite className="size-3.5" aria-hidden="true" />
          {en.explore.baseMap.satellite}
        </button>
      </div>

      {!satelliteAvailable && satelliteReason && (
        <p className="max-w-[15rem] text-right text-[11px] text-ink-soft">{satelliteReason}</p>
      )}
    </div>
  );
}
