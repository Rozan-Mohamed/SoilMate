import { describe, expect, it } from 'vitest';
import { bboxOrNull, centerLocus, isLocus, selectedAreaFor } from './location';

describe('area location', () => {
  it('accepts a point of two finite numbers only', () => {
    expect(isLocus({ lat: 31.15, lon: 30.65 })).toBe(true);
    expect(isLocus(null)).toBe(false);
    expect(isLocus({ lat: 31.15 })).toBe(false);
    expect(isLocus({ lat: '31.15', lon: 30.65 })).toBe(false);
    expect(isLocus({ lat: Number.NaN, lon: 30.65 })).toBe(false);
  });

  it('reads the map centre of a centre', () => {
    expect(centerLocus({ mapCenter: { lat: 31.15, lon: 30.65 } })).toEqual({
      lat: 31.15,
      lon: 30.65,
    });
  });

  it('falls back to the site point of the overview', () => {
    expect(
      centerLocus({
        mapCenter: null,
        site: { lat: 31.1326, lon: 30.6478 },
      }),
    ).toEqual({ lat: 31.1326, lon: 30.6478 });
  });

  it('has no location when the API gave none', () => {
    expect(centerLocus({ mapCenter: null })).toBeNull();
    expect(centerLocus(null)).toBeNull();
    expect(centerLocus(undefined)).toBeNull();
  });

  it('keeps only a usable box', () => {
    expect(bboxOrNull([30.55, 31.05, 30.75, 31.25])).toEqual([30.55, 31.05, 30.75, 31.25]);
    expect(bboxOrNull(null)).toBeNull();
    expect(bboxOrNull([30.55, 31.05])).toBeNull();
  });

  it('takes the box of the layer first, then the point of the overview', () => {
    const area = selectedAreaFor({
      id: 'desouk',
      layerCenter: { name: 'Desouk', bbox: [30.55, 31.05, 30.75, 31.25] },
      center: {
        id: 'desouk',
        name: 'Desouk',
        nameAr: '',
        governorate: 'Kafr El-Sheikh',
        bbox: [30.55, 31.05, 30.75, 31.25],
        mapCenter: { lat: 31.15, lon: 30.65 },
      },
      overview: null,
    });

    expect(area.name).toBe('Desouk');
    expect(area.bbox).toEqual([30.55, 31.05, 30.75, 31.25]);
    expect(area.location).toEqual({ lat: 31.15, lon: 30.65 });
  });

  it('never invents a place for an area the API did not describe', () => {
    const area = selectedAreaFor({
      id: 'baltim',
      layerCenter: { name: 'Baltim', bbox: null },
      center: {
        id: 'baltim',
        name: 'Baltim',
        nameAr: '',
        governorate: 'Kafr El-Sheikh',
        bbox: null,
        mapCenter: null,
      },
      overview: null,
    });

    expect(area.bbox).toBeNull();
    expect(area.location).toBeNull();
  });
});
