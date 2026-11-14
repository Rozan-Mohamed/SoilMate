import { describe, expect, it } from 'vitest';
import {
  areasWithoutGeometry,
  boundsForAreas,
  hasGeometry,
  mappableAreas,
} from './geometry';

const desouk = {
  centerId: 'desouk' as const,
  name: 'Desouk',
  bbox: [30.55, 31.05, 30.75, 31.25] as [number, number, number, number],
};

const sidiSalem = { centerId: 'sidi_salem' as const, name: 'Sidi Salem', bbox: null };
const baltim = { centerId: 'baltim' as const, name: 'Baltim', bbox: null };

describe('area geometry', () => {
  it('accepts a box of four numbers only', () => {
    expect(hasGeometry([30.55, 31.05, 30.75, 31.25])).toBe(true);
    expect(hasGeometry(null)).toBe(false);
    expect(hasGeometry(undefined)).toBe(false);
    expect(hasGeometry([30.55, 31.05])).toBe(false);
    expect(hasGeometry([30.55, 31.05, 30.75, Number.NaN])).toBe(false);
    expect(hasGeometry(['30.55', 31.05, 30.75, 31.25])).toBe(false);
  });

  it('maps only the areas the API described', () => {
    const areas = mappableAreas([desouk, sidiSalem, baltim]);

    expect(areas).toHaveLength(1);
    expect(areas[0].centerId).toBe('desouk');
  });

  it('lists the areas without geometry instead of drawing them', () => {
    const missing = areasWithoutGeometry([desouk, sidiSalem, baltim]);

    expect(missing.map((area) => area.name)).toEqual(['Sidi Salem', 'Baltim']);
  });

  it('builds the bounds of the mapped areas', () => {
    const bounds = boundsForAreas(mappableAreas([desouk]));

    expect(bounds).toEqual({ south: 31.05, west: 30.55, north: 31.25, east: 30.75 });
  });

  it('has no bounds when nothing is mapped', () => {
    expect(boundsForAreas([])).toBeNull();
    expect(boundsForAreas(mappableAreas([sidiSalem, baltim]))).toBeNull();
  });
});
