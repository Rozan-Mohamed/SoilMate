import type {
  Equipment,
  Farm,
  Priority,
  SoilType,
  WaterAvailability,
  WaterSource,
} from '@/lib/soilmate/types';

/**
 * The farm of the API. The API returns exactly the fields of the contract;
 * nothing is added to them.
 */
export type FarmResponse = Farm;

/**
 * The growing seasons the form offers. The API still accepts 3, but the form
 * only offers 1 and 2 — so the value is never 3 here.
 */
export type FarmSeasons = 1 | 2;

/** The state of the My Farm form. */
export type FarmForm = {
  currentCrops: string[];
  waterSource: WaterSource | null;
  waterSourceOther: string;
  waterAvailability: WaterAvailability | null;
  soilType: SoilType | null;
  equipment: Equipment[];
  seasonsPerYear: FarmSeasons | null;
  priorities: Priority[];
};

/** The sections of the form, in the order they are shown. */
export type FarmField =
  | 'currentCrops'
  | 'waterSource'
  | 'waterSourceOther'
  | 'waterAvailability'
  | 'soilType'
  | 'equipment'
  | 'seasonsPerYear'
  | 'priorities';

export type FarmErrors = Partial<Record<FarmField, string>>;

/**
 * The exact body of PUT /farm (API contract section 5). It never carries
 * `centerId` and never carries a key the contract does not know.
 */
export type FarmPayload = {
  currentCrops: string[];
  waterSource: WaterSource;
  waterSourceOther: string | null;
  waterAvailability: WaterAvailability;
  soilType: SoilType;
  equipment: Equipment[];
  seasonsPerYear: FarmSeasons;
  priorities: Priority[];
};
