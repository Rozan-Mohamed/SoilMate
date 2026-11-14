import type { RotationLabCrop, RotationLabSeason, RotationLabSeasonName } from './types';

export const LAB_SEASONS: RotationLabSeasonName[] = ['winter', 'summer'];

export const LAB_SEASON_LABELS: Record<RotationLabSeasonName, string> = {
  winter: 'Winter',
  summer: 'Summer',
};

export type LabSelection = Record<RotationLabSeasonName, RotationLabSeason | null>;

export function emptyLabSelection(): LabSelection {
  return { winter: null, summer: null };
}

export function normalizeSelectionValue(v: string | null | undefined): RotationLabSeason | null {
  if (!v) return null;
  return v;
}

export function canSubmitRotation(selection: LabSelection): boolean {
  const w = selection.winter;
  const s = selection.summer;
  // at least one real crop (not both empty/fallow)
  const hasWinterCrop = !!w && w !== 'fallow';
  const hasSummerCrop = !!s && s !== 'fallow';
  if (!hasWinterCrop && !hasSummerCrop) return false;
  // if both are selected as same non-fallow crop it's not possible via separate season lists, but guard anyway
  if (w && s && w === s && w !== 'fallow') return false;
  return true;
}

export function rotationBody(selection: LabSelection): { winter?: string; summer?: string } {
  const body: { winter?: string; summer?: string } = {};
  if (selection.winter) body.winter = selection.winter;
  if (selection.summer) body.summer = selection.summer;
  return body;
}

export function cropForSeason(
  season: RotationLabSeasonName,
  cropId: string | null | undefined,
  winterCrops: RotationLabCrop[],
  summerCrops: RotationLabCrop[],
): RotationLabCrop | null {
  if (!cropId) return null;
  const list = season === 'winter' ? winterCrops : summerCrops;
  return list.find((c) => c.id === cropId) ?? null;
}
