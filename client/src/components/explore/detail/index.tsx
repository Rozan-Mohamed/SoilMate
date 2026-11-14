'use client';

import { useEffect, useState } from 'react';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { friendlyMessage } from '@/lib/soilmate/errors';
import type { CenterId } from '@/lib/soilmate/types';
import { formatMonth } from '@/lib/explore/format';
import {
  fetchAreaNote,
  fetchCropHealth,
  fetchHeatStress,
  fetchLandRisk,
  fetchSoilMoisture,
} from '@/lib/explore-detail/api';
import type {
  AreaNote,
  CropHealthResponse,
  DetailLayer,
  HeatStressResponse,
  LandRiskResponse,
  SoilMoistureResponse,
} from '@/lib/explore-detail/types';
import { en } from '@/strings/en';
import { CropHealthDetail } from './CropHealthDetail';
import { HeatStressDetail } from './HeatStressDetail';
import { LandRiskDetail } from './LandRiskDetail';
import { SoilMoistureDetail } from './SoilMoistureDetail';

export type { DetailLayer } from '@/lib/explore-detail/types';

type Props = {
  open: boolean;
  centerId: CenterId;
  layer: DetailLayer;
  onClose: () => void;
};

type Status = 'loading' | 'ready' | 'error';

type Loaded = {
  areaNote: AreaNote | null;
  cropHealth: CropHealthResponse | null;
  soilMoisture: SoilMoistureResponse | null;
  heatStress: HeatStressResponse | null;
  landRisk: LandRiskResponse | null;
};

const EMPTY: Loaded = {
  areaNote: null,
  cropHealth: null,
  soilMoisture: null,
  heatStress: null,
  landRisk: null,
};

/** What is on screen, together with the area and the layer it belongs to. */
type State = {
  key: string;
  data: Loaded;
  error: string | null;
};

/**
 * The layer detail pop-up of Explore Land (Stage 4B).
 *
 * The data is fetched only while the pop-up is open, from the public layer
 * detail endpoints of the contract. Every layer keeps the same export as the
 * Stage 0B stub, so the Explore screen opens it unchanged.
 */
export function LayerDetailModal({ open, centerId, layer, onClose }: Props) {
  const [state, setState] = useState<State | null>(null);

  const key = `${centerId}:${layer}`;
  const current = state && state.key === key ? state : null;

  const status: Status = !current ? 'loading' : current.error ? 'error' : 'ready';
  const data = current?.data ?? EMPTY;
  const error = current?.error ?? null;

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    void (async () => {
      try {
        const [areaNote, layerData] = await Promise.all([
          fetchAreaNote(centerId).catch(() => null),
          loadLayer(layer, centerId),
        ]);

        if (cancelled) return;

        setState({
          key,
          data: {
            areaNote,
            ...layerData,
          },
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setState({ key, data: EMPTY, error: friendlyMessage(err) });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, centerId, layer, key]);

  const title = (
    <span className="flex flex-col items-center gap-1">
      <span>{layerTitle(layer)}</span>
      {data.areaNote?.centerName && (
        <span className="text-xs font-bold text-primary">{data.areaNote.centerName}</span>
      )}
    </span>
  );

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      {/*
        The pop-up scrolls inside itself on a phone, so the content never
        grows past the screen.
      */}
      <div className="max-h-[70vh] overflow-y-auto text-left">
        {status === 'loading' && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-2/3 rounded-xl" />
            <Skeleton className="h-32 w-full rounded-card" />
            <Skeleton className="h-24 w-full rounded-card" />
            <p className="text-center text-xs font-semibold text-ink-soft">
              {en.explore.details.loading}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col gap-3">
            <Banner tone="error">{error ?? en.explore.details.errorTitle}</Banner>
            <Button onClick={onClose} size="sm">
              {en.explore.details.close}
            </Button>
          </div>
        )}

        {status === 'ready' && (
          <div className="flex flex-col gap-4">
            {layer === 'crop-health' && data.cropHealth && (
              <CropHealthDetail data={data.cropHealth} />
            )}
            {layer === 'soil-moisture' && data.soilMoisture && (
              <SoilMoistureDetail data={data.soilMoisture} />
            )}
            {layer === 'heat-stress' && data.heatStress && (
              <HeatStressDetail data={data.heatStress} />
            )}
            {layer === 'land-risk' && data.landRisk && <LandRiskDetail data={data.landRisk} />}

            <footer className="flex flex-col gap-1 border-t border-mint-3 pt-3">
              {data.areaNote?.areaWarning && (
                <p className="text-[11px] font-semibold text-ink-soft">
                  {data.areaNote.areaWarning}
                </p>
              )}
              {data.areaNote?.dataThrough && (
                <p className="text-[11px] font-bold text-ink-soft">
                  {en.explore.details.latestReading(formatMonth(data.areaNote.dataThrough))}
                </p>
              )}
            </footer>
          </div>
        )}
      </div>
    </Modal>
  );
}

/** The one endpoint of the layer that is opened. */
async function loadLayer(
  layer: DetailLayer,
  centerId: CenterId,
): Promise<Omit<Loaded, 'areaNote'>> {
  if (layer === 'crop-health') {
    return { cropHealth: await fetchCropHealth(centerId), soilMoisture: null, heatStress: null, landRisk: null };
  }

  if (layer === 'soil-moisture') {
    return {
      cropHealth: null,
      soilMoisture: await fetchSoilMoisture(centerId),
      heatStress: null,
      landRisk: null,
    };
  }

  if (layer === 'heat-stress') {
    return {
      cropHealth: null,
      soilMoisture: null,
      heatStress: await fetchHeatStress(centerId),
      landRisk: null,
    };
  }

  return {
    cropHealth: null,
    soilMoisture: null,
    heatStress: null,
    landRisk: await fetchLandRisk(centerId),
  };
}

/** The name of the layer, as the Explore screen shows it. */
function layerTitle(layer: DetailLayer): string {
  switch (layer) {
    case 'crop-health':
      return en.explore.details.cropHealth.title;
    case 'soil-moisture':
      return en.explore.details.soilMoisture.title;
    case 'heat-stress':
      return en.explore.details.heatStress.title;
    case 'land-risk':
      return en.explore.details.landRisk.title;
    default:
      return en.explore.detailsTitle;
  }
}
