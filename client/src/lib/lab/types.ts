import type { CenterId } from '@/lib/soilmate/types';

/**
 * Rotation Lab (updated backend). Two seasons: winter and summer.
 * A season may be a crop id or "fallow" (or omitted/undefined when empty in some contexts).
 */

export type RotationLabSeasonName = 'winter' | 'summer';
export type RotationLabSeason = string; // crop id or 'fallow'

export type RotationLabCrop = {
  id: string;
  name: string;
  season: 'winter' | 'summer' | 'any';
  roleTags: string[];
  description: string;
  image: { url: string; thumbUrl: string; alt: string };
};

export type RotationLabCenter = {
  id: CenterId;
  name: string;
  nameAr: string;
  governorate: string;
};

export type RotationLabOptionsResponse = {
  version: string;
  disclaimer: string;
  centers: RotationLabCenter[];
  winterCrops: RotationLabCrop[];
  summerCrops: RotationLabCrop[];
  rules: { minCrops: number; invalidMessage: string };
};

export type RotationLabPlanNumbers = {
  net_water_mm_yr?: number;
  net_water_p10?: number;
  net_water_p90?: number;
  years_used?: number;
  net_water_mm_yr_low_rain?: number;
  water_change_vs_current_pct?: number | null;
  overlap_days_yr?: number;
  bare_days_yr?: number;
  soil_score?: number;
  nitrogen_fixing?: boolean;
  income_level?: string;
  income_index?: number;
  forage_level?: string;
  salinity_rel_yield?: Record<string, number>;
};

export type RotationLabWarning = {
  code: string;
  severity: string;
  days?: number;
  crops?: string[];
  message: string;
};

export type RotationLabPlanText = {
  reason?: string;
  evidence?: string[];
  benefits?: string[];
  gaps?: string[];
  risks?: string[];
};

export type RotationLabPlan = {
  plan_type: 'current' | 'water_saving' | 'soil_health';
  rotation: { winter: string; summer: string; label: string };
  current_is_best_for_goal: boolean;
  numbers: RotationLabPlanNumbers;
  warnings: RotationLabWarning[];
  text: RotationLabPlanText;
  comparison?: { soil?: string; water?: string };
  current_plan_text?: { soil?: string; water?: string };
  tags?: { comparison_only?: boolean };
  timings?: Record<string, unknown>;
  notes?: Record<string, unknown>;
};

export type RotationLabPlansResult = {
  center: string;
  current_input: { winter: string; summer: string };
  plans: {
    current: RotationLabPlan;
    water_saving: RotationLabPlan;
    soil_health: RotationLabPlan;
  };
  [key: string]: unknown;
};

/** Actual response from GET /rotation-lab/plans (updated backend). */
export type RotationLabPlansResponse = {
  key: string;
  input: { center: string; winter: string; summer: string };
  singleSeason: boolean;
  emptySeason: 'winter' | 'summer' | null;
  version: string;
  result: RotationLabPlansResult;
};

export type RotationLabMeta = {
  version: string;
  disclaimer: string;
  [key: string]: unknown;
};

export type RotationLabUiText = {
  version?: string;
  disclaimer?: string;
  plan_titles?: Record<string, string>;
  tags?: Record<string, string>;
  [key: string]: unknown;
};

// Minimal farm shape used by lab (full Farm is in soilmate/types)
export type Farm = import('@/lib/soilmate/types').Farm;
