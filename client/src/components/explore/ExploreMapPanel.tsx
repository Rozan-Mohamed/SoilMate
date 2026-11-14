'use client';

import dynamic from 'next/dynamic';
import clsx from 'clsx';
import { Banner, Button, Skeleton } from '@/components/ui';
import type { CenterId } from '@/lib/soilmate/types';
import { formatMonth, legendStops } from '@/lib/explore/format';
import { areasWithoutGeometry, hasGeometry } from '@/lib/explore/geometry';
import { getBaseMaps, resolveBaseMap, type BaseMapId } from '@/lib/explore/basemaps';
import type { SelectedArea } from '@/lib/explore/location';
import type { MapLayer, MapLayerData } from '@/lib/explore/types';
import { en } from '@/strings/en';
import { BaseMapSwitch } from './BaseMapSwitch';

// Leaflet only runs in the browser, so the map is loaded client-side.
const ExploreMapCanvas = dynamic(
  () => import('./ExploreMapCanvas').then((module) => module.ExploreMapCanvas),
  { ssr: false, loading: () => null },
);

type Props = {
  layerData: MapLayerData | null;
  layers: MapLayer[];
  activeLayerId: string;
  selectedId: CenterId | null;
  /** What the API says about the place of the selected area, if anything. */
  selectedArea: SelectedArea | null;
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  baseMapId: BaseMapId;
  onSelectLayer: (layerId: string) => void;
  onSelectArea: (centerId: CenterId) => void;
  onBaseMapChange: (baseMapId: BaseMapId) => void;
  onRetry: () => void;
  selectedCard?: React.ReactNode;
};

export function ExploreMapPanel({
  layerData,
  layers,
  activeLayerId,
  selectedId,
  selectedArea,
  status,
  error,
  baseMapId,
  onSelectLayer,
  onSelectArea,
  onBaseMapChange,
  onRetry,
  selectedCard,
}: Props) {
  const { maps, satelliteAvailable, satelliteReason } = getBaseMaps();
  const activeBaseMap = resolveBaseMap(baseMapId, maps);
  const stops = legendStops(layerData?.legend);
  const showFaces = layerData?.layerId === 'crop_health';

  const unmapped = layerData
    ? areasWithoutGeometry(
        layerData.centers.map((center) => ({
          centerId: center.centerId,
          name: center.name,
          bbox: center.bbox,
        })),
      )
    : [];

  // The selected area can be shown on the map when the API gave a box or a
  // point for it. Without either, the map says so instead of moving.
  const selectedHasGeometry = selectedArea ? hasGeometry(selectedArea.bbox) : false;
  const selectedHasLocation = selectedArea?.location != null;
  const showCoverageNotice = selectedArea !== null && !selectedHasGeometry && !selectedHasLocation;

  return (
    <section className="relative">
      <div className="overflow-hidden rounded-card bg-mint-2 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white/70 px-3 py-2 sm:px-4">
          <p className="text-xs font-bold text-deep">
            {en.explore.map.latestReading}
            {layerData ? ` : ${formatMonth(layerData.dataThrough)}` : ''}
          </p>

          <BaseMapSwitch
            value={activeBaseMap.id}
            onChange={onBaseMapChange}
            satelliteAvailable={satelliteAvailable}
            satelliteReason={satelliteReason}
          />
        </div>

        {/*
          The map area is its own stacking context. Leaflet paints its panes
          with z-index 200–1000; without this they escape the map and cover
          the navbar and the panels that float on the map.
        */}
        <div className="relative isolate">
          <div className="h-[360px] w-full sm:h-[440px] lg:h-[520px]">
            {status === 'loading' && (
              <div className="flex h-full items-center justify-center p-6">
                <Skeleton className="h-full w-full rounded-card" />
              </div>
            )}

            {status === 'error' && (
              <div className="flex h-full items-center justify-center p-6">
                <div className="w-full max-w-md">
                  <Banner tone="error">{error ?? en.explore.errors.layer}</Banner>
                  <p className="mt-2 text-xs text-ink-soft">{en.explore.errors.layer}</p>
                  <Button onClick={onRetry} className="mt-3" size="sm">
                    {en.explore.errors.retry}
                  </Button>
                </div>
              </div>
            )}

            {status === 'ready' && layerData && (
              <ExploreMapCanvas
                centers={layerData.centers}
                selectedId={selectedId}
                selectedArea={selectedArea}
                onSelect={onSelectArea}
                showFaces={showFaces}
                label={en.explore.map.label}
                baseMap={activeBaseMap}
              />
            )}
          </div>

          {selectedCard && (
            <div className="p-3 lg:absolute lg:bottom-4 lg:left-4 lg:z-20 lg:w-[360px] lg:p-0">
              {selectedCard}
            </div>
          )}

          <aside className="p-3 lg:absolute lg:right-4 lg:top-4 lg:z-20 lg:max-h-[calc(100%_-_2rem)] lg:w-64 lg:overflow-y-auto lg:p-0">
            <div className="rounded-card bg-card/95 p-3 shadow-card backdrop-blur">
              <p className="text-sm font-extrabold text-deep">{en.explore.map.layers}</p>

              <ul className="mt-2 space-y-1">
                {layers.map((layer) => {
                  const active = layer.id === activeLayerId;
                  const disabled = !layer.available;

                  return (
                    <li key={layer.id}>
                      <button
                        type="button"
                        onClick={() => onSelectLayer(layer.id)}
                        disabled={disabled}
                        aria-pressed={active}
                        className={clsx(
                          'flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm font-bold transition-colors',
                          disabled
                            ? 'cursor-not-allowed text-ink-soft opacity-50'
                            : active
                              ? 'bg-primary text-white'
                              : 'text-ink hover:bg-mint-2',
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={clsx(
                            'size-3 shrink-0 rounded-full border-2',
                            active ? 'border-white bg-bright' : 'border-mint-3',
                          )}
                        />
                        <span className="min-w-0 flex-1 truncate">{layer.label}</span>
                      </button>
                      {disabled && layer.unavailableReason && (
                        <p className="px-2.5 pt-0.5 text-xs text-ink-soft">
                          {layer.unavailableReason}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>

              {layerData && (
                <div className="mt-3 border-t border-mint-3 pt-3">
                  <p className="text-xs font-extrabold text-deep">{en.explore.map.legend}</p>

                  {stops.length > 0 && (
                    <div
                      className="mt-2 h-2.5 w-full rounded-full"
                      style={{
                        background: `linear-gradient(to right, ${stops
                          .map((stop) => `${stop.color} ${stop.offset}%`)
                          .join(', ')})`,
                      }}
                      aria-hidden="true"
                    />
                  )}

                  {layerData.legend.items && layerData.legend.items.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {layerData.legend.items.map((item) => (
                        <li key={item.id} className="flex items-center gap-2 text-xs text-ink-soft">
                          <span
                            aria-hidden="true"
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ background: item.color ?? item.hex ?? '#d4ece0' }}
                          />
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  )}

                  {layerData.legend.unit && (
                    <p className="mt-2 text-xs text-ink-soft">{layerData.legend.unit}</p>
                  )}

                  {layerData.legend.type === 'rank' && (
                    <p className="mt-1 text-xs text-ink-soft">{en.explore.map.rankNote}</p>
                  )}
                </div>
              )}
            </div>
          </aside>

          {showCoverageNotice && (
            <p className="pointer-events-none absolute inset-x-3 top-3 z-20 mx-auto max-w-md rounded-xl bg-white/95 px-3 py-2 text-center text-xs font-bold text-deep shadow-card lg:inset-x-auto lg:left-1/2 lg:w-[24rem] lg:-translate-x-1/2">
              {en.explore.map.noCoverageSelected(selectedArea.name)}
            </p>
          )}
        </div>
      </div>

      {unmapped.length > 0 && (
        <p className="mt-2 text-xs text-ink-soft">
          {en.explore.map.noGeometry(unmapped.map((area) => area.name))}
        </p>
      )}
    </section>
  );
}
