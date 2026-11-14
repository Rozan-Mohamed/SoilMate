'use client';

import { Droplets, Leaf, Sprout, Sun, Waves } from 'lucide-react';
import type { DetailLayer } from '@/components/explore/detail';
import type { CenterOverview } from '@/lib/explore/types';
import { en } from '@/strings/en';

type Props = {
  name: string;
  overview: CenterOverview | null;
  onOpenDetails: (layer: DetailLayer) => void;
};

function tileValue(overview: CenterOverview | null, id: string) {
  return overview?.tiles.find((tile) => tile.id === id) ?? null;
}

/** The floating card on the map: the selected area and three documented numbers. */
export function ExploreSelectedCard({ name, overview, onOpenDetails }: Props) {
  const greenness = tileValue(overview, 'crop_greenness');
  const moisture = tileValue(overview, 'soil_moisture');
  const hotDays = tileValue(overview, 'hot_days');

  return (
    <div className="w-full max-w-sm rounded-card bg-card/95 p-4 shadow-card backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-white">
          <Sprout className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-extrabold text-deep">{name}</p>
          <p className="text-xs font-bold text-primary">{en.explore.areas.selected}</p>
        </div>
      </div>

      <dl className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-2 rounded-xl bg-mint-2/70 px-3 py-2">
          <dt className="flex items-center gap-1.5 text-xs font-bold text-ink-soft">
            <Leaf className="size-3.5" aria-hidden="true" />
            {greenness?.label ?? en.explore.map.greenness}
          </dt>
          <dd className="text-sm font-extrabold text-deep">
            {greenness?.display ?? '—'}
            {greenness?.chip ? (
              <span className="ml-1 font-semibold text-ink-soft">{greenness.chip.label}</span>
            ) : null}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-xl bg-mint-2/70 px-3 py-2">
          <dt className="flex items-center gap-1.5 text-xs font-bold text-ink-soft">
            <Waves className="size-3.5" aria-hidden="true" />
            {moisture?.label ?? en.explore.map.soilMoisture}
          </dt>
          <dd className="text-sm font-extrabold text-deep">{moisture?.display ?? '—'}</dd>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-xl bg-mint-2/70 px-3 py-2">
          <dt className="flex items-center gap-1.5 text-xs font-bold text-ink-soft">
            <Sun className="size-3.5" aria-hidden="true" />
            {hotDays?.label ?? en.explore.map.hotDays}
          </dt>
          <dd className="text-sm font-extrabold text-deep">{hotDays?.display ?? '—'}</dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap gap-2">
        <DetailButton
          label={en.explore.map.openDetails}
          Icon={Sprout}
          onClick={() => onOpenDetails('crop-health')}
        />
        <DetailButton
          label={en.explore.map.openDetails}
          Icon={Droplets}
          onClick={() => onOpenDetails('soil-moisture')}
        />
        <DetailButton
          label={en.explore.map.openDetails}
          Icon={Sun}
          onClick={() => onOpenDetails('heat-stress')}
        />
      </div>
    </div>
  );
}

/**
 * The card shown while the data of the newly selected area is loading. It
 * already carries the name of the new area, so the card never shows the
 * details of the area that was selected before it.
 */
export function ExploreSelectedCardLoading({ name }: { name: string }) {
  return (
    <div className="w-full max-w-sm rounded-card bg-card/95 p-4 shadow-card backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mint-3 text-deep">
          <Sprout className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-extrabold text-deep">{name}</p>
          <p className="text-xs font-bold text-primary">{en.explore.areas.selected}</p>
        </div>
      </div>

      <p className="mt-3 text-xs font-semibold text-ink-soft">
        {en.explore.map.loadingArea(name)}
      </p>

      <div className="mt-3 space-y-2" aria-hidden="true">
        <div className="h-8 w-full rounded-xl bg-mint-2/70" />
        <div className="h-8 w-full rounded-xl bg-mint-2/70" />
        <div className="h-8 w-full rounded-xl bg-mint-2/70" />
      </div>
    </div>
  );
}

function DetailButton({
  label,
  Icon,
  onClick,
}: {
  label: string;
  Icon: typeof Sprout;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-mint-3 px-2.5 py-1 text-xs font-bold text-primary transition-colors hover:bg-mint-2"
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}
