import type { CenterId } from '@/lib/soilmate/types';
import { hasGeometry, type BBox } from './geometry';
import type { Center, CenterOverview } from './types';

/** A point the API can describe for an area. */
export type Locus = { lat: number; lon: number };

/**
 * The selected area, with everything the API said about its place: the box
 * when there is one, the point when there is one. Both are optional, and
 * nothing is ever invented to fill a gap.
 */
export type SelectedArea = {
  id: CenterId;
  name: string;
  bbox: BBox | null;
  location: Locus | null;
};

/** A usable point has two finite numbers. Anything else is "no location". */
export function isLocus(value: unknown): value is Locus {
  if (!value || typeof value !== 'object') return false;

  const { lat, lon } = value as { lat?: unknown; lon?: unknown };
  return (
    typeof lat === 'number' &&
    Number.isFinite(lat) &&
    typeof lon === 'number' &&
    Number.isFinite(lon)
  );
}

/**
 * The coordinates the API gives for a centre: `mapCenter` first, then the
 * `site` point of the overview. A centre with neither simply has no location.
 */
export function centerLocus(
  center:
    | (Partial<Pick<Center, 'mapCenter'>> & { site?: { lat: number; lon: number } | null })
    | null
    | undefined,
): Locus | null {
  if (!center) return null;

  if (isLocus(center.mapCenter)) {
    return { lat: center.mapCenter.lat, lon: center.mapCenter.lon };
  }

  if (isLocus(center.site)) {
    return { lat: center.site.lat, lon: center.site.lon };
  }

  return null;
}

/** The box the API gave for an area, or null when it gave none. */
export function bboxOrNull(bbox: unknown): BBox | null {
  return hasGeometry(bbox) ? bbox : null;
}

/**
 * Everything the map may use for the selected area. The layer response comes
 * first (that is the box the map draws), then GET /centers and the overview.
 */
export function selectedAreaFor(input: {
  id: CenterId;
  layerCenter?: { name?: string; bbox?: unknown } | null;
  center?: Center | null;
  overview?: CenterOverview | null;
}): SelectedArea {
  const { id, layerCenter, center, overview } = input;

  const name =
    layerCenter?.name ?? center?.name ?? overview?.center?.name ?? '';

  const bbox =
    bboxOrNull(layerCenter?.bbox) ??
    bboxOrNull(center?.bbox) ??
    bboxOrNull(overview?.center?.bbox);

  const location =
    centerLocus(overview?.center) ?? centerLocus(center);

  return { id, name, bbox, location };
}
