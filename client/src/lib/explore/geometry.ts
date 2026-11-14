import type { CenterId } from '@/lib/soilmate/types';

export type BBox = [number, number, number, number];

export type AreaGeometry = {
  centerId: CenterId;
  name: string;
  bbox: BBox;
};

export type AreaWithoutGeometry = {
  centerId: CenterId;
  name: string;
};

/** A usable box has four finite numbers. Anything else is "no geometry". */
export function hasGeometry(bbox: unknown): bbox is BBox {
  return (
    Array.isArray(bbox) &&
    bbox.length === 4 &&
    bbox.every((value) => typeof value === 'number' && Number.isFinite(value))
  );
}

/** Only the areas whose geometry the API actually supplied. */
export function mappableAreas(
  centers: { centerId: CenterId; name: string; bbox: unknown }[],
): AreaGeometry[] {
  return centers
    .filter((center): center is { centerId: CenterId; name: string; bbox: BBox } =>
      hasGeometry(center.bbox),
    )
    .map((center) => ({ centerId: center.centerId, name: center.name, bbox: center.bbox }));
}

/** The areas the API did not describe geometrically. They are never drawn. */
export function areasWithoutGeometry(
  centers: { centerId: CenterId; name: string; bbox: unknown }[],
): AreaWithoutGeometry[] {
  return centers
    .filter((center) => !hasGeometry(center.bbox))
    .map((center) => ({ centerId: center.centerId, name: center.name }));
}

/** The bounds of every mapped area, or null when there is no geometry at all. */
export function boundsForAreas(
  areas: AreaGeometry[],
): { south: number; west: number; north: number; east: number } | null {
  if (areas.length === 0) return null;

  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const area of areas) {
    const [areaWest, areaSouth, areaEast, areaNorth] = area.bbox;
    west = Math.min(west, areaWest);
    south = Math.min(south, areaSouth);
    east = Math.max(east, areaEast);
    north = Math.max(north, areaNorth);
  }

  return { south, west, north, east };
}
