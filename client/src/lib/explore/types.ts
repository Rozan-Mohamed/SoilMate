import type { CenterId } from '@/lib/soilmate/types';

/**
 * GET /centers — bbox is [west, south, east, north].
 * The geometry is null when the API does not describe the area geometrically;
 * the area is then selectable but never drawn on the map.
 */
export type Center = {
  id: CenterId;
  name: string;
  nameAr: string;
  governorate: string;
  bbox: [number, number, number, number] | null;
  mapCenter: { lat: number; lon: number } | null;
};

export type CentersResponse = {
  centers: Center[];
  coverageNote: string;
};

/** GET /map/layers */
export type MapLayer = {
  id: string;
  label: string;
  order: number;
  available: boolean;
  unavailableReason?: string;
};

export type MapLayersResponse = {
  layers: MapLayer[];
};

export type LegendStop = [number, string];

export type LegendItem = {
  id: string;
  label: string;
  /** The categories legend of the API carries the color under `hex`. */
  color?: string;
  hex?: string;
};

export type MapLegend = {
  type: 'gradient' | 'categories' | 'rank';
  unit?: string;
  stops?: LegendStop[];
  items?: LegendItem[];
};

/** One area inside a layer response. */
export type LayerCenter = {
  centerId: CenterId;
  name: string;
  bbox: [number, number, number, number] | null;
  value: number | string | null;
  valueLabel: string | null;
  levelId: string | null;
  levelLabel: string | null;
  /** null on the heat layer: the frontend shades by rank instead. */
  fillHex: string | null;
  face?: 'sad' | 'neutral' | 'happy';
  modelState?: string | null;
  modelNeedle?: number | null;
};

/** GET /map/layers/:layerId */
export type MapLayerData = {
  layerId: string;
  label: string;
  dataThrough: string;
  legend: MapLegend;
  centers: LayerCenter[];
};

export type OverviewTile = {
  id: string;
  label: string;
  value: number | string | null;
  display: string;
  chip: { id: string; label: string } | null;
};

export type OverviewHeat = {
  title: string;
  avgHighC: number;
  avgLowC: number;
  hottestDay: { date: string; tmaxC: number };
  heatDaysPerYear: number;
  longestHotSpell: { days: number; from: string };
  trendPerDecadeC: number;
  source: string;
};

export type OverviewMonth = {
  short: string;
  ndvi: number;
  fillHex: string;
};

export type MoistureReading = {
  state: string;
  label: string;
  /** Rank 0–100 among the same month in past years. It is not a water percentage. */
  needle: number;
};

export type OverviewSoilMoisture = {
  satellite: MoistureReading;
  model: MoistureReading;
  rootZone: MoistureReading;
  dryMonthsLast12: { satellite: number; model: number };
  texts: {
    satelliteLine: string;
    modelLine: string;
    last12Line: string;
    disagreeNote?: string;
    needleNote?: string;
  };
  confidenceLabels: {
    satellite?: string;
    model?: string;
    no_data?: string;
  };
};

export type LandRiskIndicator = {
  id: string;
  label: string;
  status: string;
  score: number;
  text: string;
};

export type OverviewLandRisk = {
  title: string;
  score: number;
  scaleMin: number;
  scaleMax: number;
  level: string;
  levelHex: string;
  indicators: LandRiskIndicator[];
  notice: string;
};

/** GET /centers/:centerId/overview */
export type CenterOverview = {
  center: Center & {
    site?: {
      lat: number;
      lon: number;
      elevationM: number;
      slopeDeg: number;
      coastDistanceKm: number;
    };
  };
  dataThrough: {
    cropHealth: string;
    soilMoisture: string;
    heatWeather: string;
    heatSatellite: string;
  };
  areaWarning: string;
  tiles: OverviewTile[];
  heat: OverviewHeat;
  lastMonths: OverviewMonth[];
  soilMoisture: OverviewSoilMoisture;
  landRisk: OverviewLandRisk;
  disclaimer: string;
  footer: string;
};
