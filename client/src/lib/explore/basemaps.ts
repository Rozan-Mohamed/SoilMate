export type BaseMapId = 'street' | 'satellite';

export type BaseMapConfig = {
  id: BaseMapId;
  label: string;
  tileUrl: string;
  attribution: string;
  maxZoom: number;
};

/**
 * Street map: the OpenStreetMap standard tiles. Free to use with the required
 * attribution, and the usual choice for a public, key-free basemap.
 */
export const STREET_BASE_MAP: BaseMapConfig = {
  id: 'street',
  label: 'Street',
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
};

/**
 * Satellite imagery: the public Esri World Imagery service (a documented ArcGIS
 * Online REST tile service). It needs no API key and carries its own
 * attribution, which is shown on the map.
 */
export const ESRI_SATELLITE_BASE_MAP: BaseMapConfig = {
  id: 'satellite',
  label: 'Satellite',
  tileUrl:
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution:
    'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
  maxZoom: 19,
};

export type BaseMaps = {
  maps: BaseMapConfig[];
  satelliteAvailable: boolean;
  satelliteReason: string | null;
};

export type BaseMapOptions = {
  satelliteTileUrl?: string | undefined;
  satelliteAttribution?: string | undefined;
};

/**
 * The two base maps. A deployment can point the satellite map at another
 * provider (for example a keyed one) with NEXT_PUBLIC_SATELLITE_TILE_URL and
 * NEXT_PUBLIC_SATELLITE_ATTRIBUTION. Setting the tile URL to an empty string
 * switches satellite imagery off, and the UI then says so instead of showing a
 * made-up layer.
 */
export function getBaseMaps(options: BaseMapOptions = {}): BaseMaps {
  const rawUrl =
    options.satelliteTileUrl !== undefined
      ? options.satelliteTileUrl
      : process.env.NEXT_PUBLIC_SATELLITE_TILE_URL;
  const rawAttribution =
    options.satelliteAttribution !== undefined
      ? options.satelliteAttribution
      : process.env.NEXT_PUBLIC_SATELLITE_ATTRIBUTION;

  if (rawUrl !== undefined && rawUrl.trim() === '') {
    return {
      maps: [STREET_BASE_MAP],
      satelliteAvailable: false,
      satelliteReason: 'Satellite imagery is not configured for this environment.',
    };
  }

  const satellite: BaseMapConfig = rawUrl
    ? {
        ...ESRI_SATELLITE_BASE_MAP,
        tileUrl: rawUrl.trim(),
        attribution: rawAttribution?.trim() || ESRI_SATELLITE_BASE_MAP.attribution,
      }
    : ESRI_SATELLITE_BASE_MAP;

  return { maps: [STREET_BASE_MAP, satellite], satelliteAvailable: true, satelliteReason: null };
}

/** The base map to draw, falling back to the street map when it is missing. */
export function resolveBaseMap(id: BaseMapId, maps: BaseMapConfig[]): BaseMapConfig {
  return maps.find((map) => map.id === id) ?? maps[0] ?? STREET_BASE_MAP;
}
