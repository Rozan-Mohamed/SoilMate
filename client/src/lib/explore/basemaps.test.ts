import { describe, expect, it } from 'vitest';
import {
  ESRI_SATELLITE_BASE_MAP,
  STREET_BASE_MAP,
  getBaseMaps,
  resolveBaseMap,
} from './basemaps';

describe('base maps', () => {
  it('offers a street map and satellite imagery by default', () => {
    const { maps, satelliteAvailable, satelliteReason } = getBaseMaps({});

    expect(maps.map((map) => map.id)).toEqual(['street', 'satellite']);
    expect(satelliteAvailable).toBe(true);
    expect(satelliteReason).toBeNull();
  });

  it('uses the OpenStreetMap street tiles with their attribution', () => {
    expect(STREET_BASE_MAP.tileUrl).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(STREET_BASE_MAP.attribution).toContain('OpenStreetMap');
  });

  it('uses real satellite imagery with its attribution', () => {
    expect(ESRI_SATELLITE_BASE_MAP.tileUrl).toContain('World_Imagery');
    expect(ESRI_SATELLITE_BASE_MAP.attribution).toContain('Esri');
  });

  it('accepts another satellite provider, including a keyed one', () => {
    const { maps, satelliteAvailable } = getBaseMaps({
      satelliteTileUrl: 'https://api.example.com/tiles/satellite/{z}/{x}/{y}.png?key=abc',
      satelliteAttribution: '© Example Imagery',
    });

    expect(satelliteAvailable).toBe(true);
    expect(maps[1].tileUrl).toContain('api.example.com');
    expect(maps[1].attribution).toBe('© Example Imagery');
  });

  it('switches satellite imagery off instead of faking it', () => {
    const { maps, satelliteAvailable, satelliteReason } = getBaseMaps({
      satelliteTileUrl: '',
    });

    expect(satelliteAvailable).toBe(false);
    expect(satelliteReason).toContain('not configured');
    expect(maps.map((map) => map.id)).toEqual(['street']);
  });

  it('falls back to the street map when the requested one is missing', () => {
    const maps = getBaseMaps({ satelliteTileUrl: '' }).maps;
    expect(resolveBaseMap('satellite', maps)).toBe(STREET_BASE_MAP);
    expect(resolveBaseMap('street', maps)).toBe(STREET_BASE_MAP);
  });
});
