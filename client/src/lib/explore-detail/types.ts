import type { CenterId } from '@/lib/soilmate/types';

/**
 * Stage 4B — the layer detail pop-ups of Explore Land.
 *
 * The API contract (section 6, "Layer detail endpoints") names only the
 * WRAPPER keys of these four responses. Everything inside the data keeps the
 * keys the data team wrote (`snake_case`), so the inner blocks are typed as
 * unknown records and read with the tolerant helpers in `read.ts`.
 *
 * Nothing here is invented: a key that the API does not send is simply not
 * shown.
 */
export type DetailLayer = 'crop-health' | 'soil-moisture' | 'heat-stress' | 'land-risk';

/** GET /centers/:centerId/layers/crop-health */
export type CropHealthResponse = {
  center?: {
    id?: string;
    name?: string;
    chartKey?: string;
    color?: string;
    bbox?: number[] | null;
    latest?: Record<string, unknown>;
    summaryCard?: Record<string, unknown>;
    insights?: unknown[];
    /** The 123 months, only with ?include=monthly. */
    monthlySeries?: unknown[];
  };
  charts?: Record<string, unknown>;
  ui?: Record<string, unknown>;
  meta?: {
    sources?: unknown;
    disclaimer?: unknown;
    limits?: unknown;
    thresholds?: unknown;
  };
  dataThrough?: string;
};

/** GET /centers/:centerId/layers/soil-moisture */
export type SoilMoistureResponse = {
  card?: Record<string, unknown>;
  calendar?: unknown[];
  typicalYear?: unknown[];
  yearsStrip?: unknown[];
  agreement?: Record<string, unknown>;
  texts?: Record<string, unknown>;
  labels?: {
    states?: Record<string, unknown>;
    agreementLevels?: Record<string, unknown>;
    confidence?: Record<string, unknown>;
  };
  sources?: unknown;
  limits?: unknown;
  footer?: unknown;
  dataThrough?: string;
};

/** GET /centers/:centerId/layers/heat-stress */
export type HeatStressResponse = {
  summary?: Record<string, unknown>;
  comparison?: {
    agreement?: Record<string, unknown>;
    typicalYear?: unknown;
  };
  texts?: Record<string, unknown>;
  defaults?: {
    thresholdC?: number;
    sigma?: number;
  };
  labels?: {
    agreementLevels?: Record<string, unknown>;
  };
  limits?: unknown;
  sources?: unknown;
  dataThrough?: {
    weather?: string;
    satellite?: string;
  };
};

/** GET /centers/:centerId/layers/land-risk */
export type LandRiskResponse = {
  point?: Record<string, unknown>;
  chartCatalog?: unknown[];
  statusColors?: Record<string, unknown>;
  method?: unknown;
};

/** The four responses together, as the modal needs them. */
export type LayerDetailResponse =
  | CropHealthResponse
  | SoilMoistureResponse
  | HeatStressResponse
  | LandRiskResponse;

/** The area warning of GET /centers/:centerId/overview, used by every pop-up. */
export type AreaNote = {
  areaWarning: string;
  dataThrough: string | null;
  centerName: string;
  centerId: CenterId;
};
