'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Banner, Skeleton } from '@/components/ui';
import { LayerDetailModal, type DetailLayer } from '@/components/explore/detail';
import { useJourney } from '@/providers/JourneyProvider';
import { ApiError, friendlyMessage } from '@/lib/soilmate/errors';
import type { CenterId } from '@/lib/soilmate/types';
import type { BaseMapId } from '@/lib/explore/basemaps';
import { selectedAreaFor } from '@/lib/explore/location';
import {
  fetchCenterOverview,
  fetchCenters,
  fetchMapLayer,
  fetchMapLayers,
  setFarmCenter,
} from '@/lib/explore/api';
import type { Center, CenterOverview, MapLayer, MapLayerData } from '@/lib/explore/types';
import { en } from '@/strings/en';
import { ExploreCtaBand } from './ExploreCtaBand';
import {
  ExploreHeatCard,
  ExploreMoistureCard,
  ExploreMonthsCard,
  ExploreRiskCard,
  ExploreStatTiles,
} from './ExploreDetailCards';
import { ExploreHeader } from './ExploreHeader';
import { ExploreMapPanel } from './ExploreMapPanel';
import { ExploreSelectedCard, ExploreSelectedCardLoading } from './ExploreSelectedCard';

const DEFAULT_LAYER_ID = 'crop_health';

export function ExploreView() {
  const { steps, refresh } = useJourney();

  const [centers, setCenters] = useState<Center[]>([]);
  const [coverageNote, setCoverageNote] = useState('');
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [layerData, setLayerData] = useState<MapLayerData | null>(null);
  const [activeLayerId, setActiveLayerId] = useState(DEFAULT_LAYER_ID);
  const [layerStatus, setLayerStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [layerError, setLayerError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<CenterId | null>(null);
  const [overview, setOverview] = useState<CenterOverview | null>(null);
  // The area the loaded overview belongs to. The details of the previous
  // area must never be shown for the newly selected one.
  const [overviewId, setOverviewId] = useState<CenterId | null>(null);
  const [areaStatus, setAreaStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [areaError, setAreaError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Center[] | null>(null);
  const [searching, setSearching] = useState(false);

  const [farmWriteError, setFarmWriteError] = useState<string | null>(null);
  const [detailLayer, setDetailLayer] = useState<DetailLayer | null>(null);
  // The basemap is only the imagery underneath the data layer, so it is kept
  // apart from the selected area and the selected data layer.
  const [baseMapId, setBaseMapId] = useState<BaseMapId>('street');

  // On load: the centers, the layer list and the default layer.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [centersRes, layersRes] = await Promise.all([fetchCenters(), fetchMapLayers()]);
        if (cancelled) return;

        setCenters(centersRes.centers);
        setCoverageNote(centersRes.coverageNote);
        setLayers(layersRes.layers);

        const fallback = layersRes.layers.find((layer) => layer.available);
        const initial = layersRes.layers.find(
          (layer) => layer.id === DEFAULT_LAYER_ID && layer.available,
        ) ?? fallback;

        if (initial) {
          const data = await fetchMapLayer(initial.id);
          if (cancelled) return;
          setActiveLayerId(initial.id);
          setLayerData(data);
          setLayerStatus('ready');
        } else {
          setLayerStatus('ready');
        }
      } catch (err) {
        if (cancelled) return;
        setLayerError(friendlyMessage(err));
        setLayerStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // The search box asks the API for a matching area (debounced).
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetchCenters(trimmed);
          if (cancelled) return;
          setSearchResults(response.centers);
        } catch {
          if (!cancelled) setSearchResults([]);
        } finally {
          if (!cancelled) setSearching(false);
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const onQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (value.trim()) {
      setSearching(true);
    } else {
      setSearchResults(null);
      setSearching(false);
    }
  }, []);

  const selectLayer = useCallback(async (layerId: string) => {
    const layer = layers.find((candidate) => candidate.id === layerId);
    // Layer 5 has no data yet: it is never called.
    if (!layer || !layer.available) return;

    setActiveLayerId(layerId);
    setLayerStatus('loading');
    setLayerError(null);

    try {
      const data = await fetchMapLayer(layerId);
      setLayerData(data);
      setLayerStatus('ready');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'LAYER_NOT_AVAILABLE') {
        setLayers((current) =>
          current.map((candidate) =>
            candidate.id === layerId
              ? { ...candidate, available: false, unavailableReason: 'Not available yet' }
              : candidate,
          ),
        );
      }
      setLayerError(friendlyMessage(err));
      setLayerStatus('error');
    }
  }, [layers]);

  const selectArea = useCallback(
    async (centerId: CenterId) => {
      setSelectedId(centerId);
      // The details of the previous area are dropped at once: the new area
      // gets its own data, never the data of the area before it.
      setOverviewId(centerId);
      setOverview(null);
      setAreaStatus('loading');
      setAreaError(null);

      try {
        const data = await fetchCenterOverview(centerId);
        setOverview(data);
        setOverviewId(centerId);
        setAreaStatus('ready');
      } catch (err) {
        setAreaError(friendlyMessage(err));
        setAreaStatus('error');
      }

      // The chosen area becomes the farm's area. Guests are allowed.
      try {
        await setFarmCenter(centerId);
        setFarmWriteError(null);
        await refresh();
      } catch (err) {
        setFarmWriteError(friendlyMessage(err));
      }
    },
    [refresh],
  );

  // The overview is only used when it belongs to the selected area.
  const activeOverview = overview && overviewId === selectedId ? overview : null;

  // What the API says about the place of the selected area: the box it gave
  // and the point it gave. Nothing is invented to fill a gap.
  const selectedArea = useMemo(() => {
    if (!selectedId) return null;

    return selectedAreaFor({
      id: selectedId,
      layerCenter: layerData?.centers.find((center) => center.centerId === selectedId) ?? null,
      center: centers.find((center) => center.id === selectedId) ?? null,
      overview: activeOverview,
    });
  }, [selectedId, layerData, centers, activeOverview]);

  const labStep = steps.find((step) => step.id === 'lab');
  const labEnabled = labStep ? labStep.status !== 'locked' : false;

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <ExploreHeader
        centers={centers}
        selectedId={selectedId}
        query={query}
        searchResults={searchResults}
        coverageNote={coverageNote}
        searching={searching}
        onQueryChange={onQueryChange}
        onSelect={(centerId) => void selectArea(centerId)}
      />

      {farmWriteError && (
        <Banner tone="warn" className="mt-4">
          {farmWriteError}
        </Banner>
      )}

      <div className="mt-5">
        <ExploreMapPanel
          layerData={layerData}
          layers={layers}
          activeLayerId={activeLayerId}
          selectedId={selectedId}
          selectedArea={selectedArea}
          status={layerStatus}
          error={layerError}
          baseMapId={baseMapId}
          onSelectLayer={(layerId) => void selectLayer(layerId)}
          onSelectArea={(centerId) => void selectArea(centerId)}
          onBaseMapChange={setBaseMapId}
          onRetry={() => void selectLayer(activeLayerId)}
          selectedCard={
            activeOverview ? (
              <ExploreSelectedCard
                name={activeOverview.center.name}
                overview={activeOverview}
                onOpenDetails={(layer) => setDetailLayer(layer)}
              />
            ) : selectedArea ? (
              <ExploreSelectedCardLoading name={selectedArea.name} />
            ) : null
          }
        />
      </div>

      {areaStatus === 'error' && areaError && (
        <Banner tone="error" className="mt-4">
          {areaError}
        </Banner>
      )}

      {activeOverview ? (
        <>
          <div className="mt-5">
            <ExploreStatTiles
              tiles={activeOverview.tiles}
              onOpenDetails={(layer) => setDetailLayer(layer)}
            />
          </div>

          <p className="mt-3 text-xs font-semibold text-ink-soft">{activeOverview.areaWarning}</p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <ExploreHeatCard heat={activeOverview.heat} />
            <ExploreMonthsCard months={activeOverview.lastMonths} />
            <ExploreMoistureCard soilMoisture={activeOverview.soilMoisture} />
            <ExploreRiskCard
              landRisk={activeOverview.landRisk}
              onOpenDetails={(layer) => setDetailLayer(layer)}
            />
          </div>

          <p className="mt-4 text-xs text-ink-soft">{activeOverview.disclaimer}</p>
        </>
      ) : (
        <div className="mt-5 rounded-card bg-card p-6 shadow-card">
          {areaStatus === 'loading' ? (
            <Skeleton className="h-24 w-full rounded-card" />
          ) : (
            <p className="text-sm text-ink-soft">{en.explore.empty.selectArea}</p>
          )}
        </div>
      )}

      <div className="mt-6">
        <ExploreCtaBand labEnabled={labEnabled} />
      </div>

      <p className="mt-4 text-xs text-ink-soft">
        {activeOverview?.footer ?? en.explore.footer}
      </p>

      {detailLayer && selectedId && (
        <LayerDetailModal
          open
          centerId={selectedId}
          layer={detailLayer}
          onClose={() => setDetailLayer(null)}
        />
      )}
    </section>
  );
}
