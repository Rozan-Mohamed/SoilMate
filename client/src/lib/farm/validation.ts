import type {
  Farm,
  MetaOptions,
  SoilType,
  WaterAvailability,
  WaterSource,
} from '@/lib/soilmate/types';
import { en } from '@/strings/en';
import type { FarmErrors, FarmField, FarmForm, FarmPayload, FarmSeasons } from './types';

/** The contract allows 1–8 current crops. */
export const MAX_CROPS = 8;
/** The contract allows a water source note of 60 characters. */
export const WATER_SOURCE_OTHER_MAX = 60;
/** The form offers one or two growing seasons. */
export const FARM_SEASONS: FarmSeasons[] = [1, 2];

/** A form with nothing chosen: nothing is ever preselected. */
export function emptyFarmForm(): FarmForm {
  return {
    currentCrops: [],
    waterSource: null,
    waterSourceOther: '',
    waterAvailability: null,
    soilType: null,
    equipment: [],
    seasonsPerYear: null,
    priorities: [],
  };
}

/** The form of the farm the API returned. */
export function farmFormFrom(farm: Farm): FarmForm {
  return {
    currentCrops: [...farm.currentCrops],
    waterSource: farm.waterSource,
    waterSourceOther: farm.waterSourceOther ?? '',
    waterAvailability: farm.waterAvailability,
    soilType: farm.soilType,
    equipment: [...farm.equipment],
    // The form only offers one or two seasons, so a farm saved with three is
    // not preselected: the farmer has to choose again.
    seasonsPerYear:
      farm.seasonsPerYear === 1 || farm.seasonsPerYear === 2 ? farm.seasonsPerYear : null,
    priorities: [...farm.priorities],
  };
}

/** The section an API issue belongs to, e.g. "body.priorities". */
export function farmFieldOf(path: string): FarmField | null {
  const field = path.replace(/^(body|query|params)\./, '').replace(/_/g, '').toLowerCase();

  switch (field) {
    case 'currentcrops':
      return 'currentCrops';
    case 'watersource':
      return 'waterSource';
    case 'watersourceother':
      return 'waterSourceOther';
    case 'wateravailability':
      return 'waterAvailability';
    case 'soiltype':
      return 'soilType';
    case 'equipment':
      return 'equipment';
    case 'seasonsperyear':
      return 'seasonsPerYear';
    case 'priorities':
      return 'priorities';
    default:
      return null;
  }
}

/** The messages of the API issues, per section. */
export function errorsFromIssues(issues: { path: string; message: string }[]): FarmErrors {
  const errors: FarmErrors = {};

  for (const issue of issues) {
    const field = farmFieldOf(issue.path);
    if (field && !errors[field]) errors[field] = issue.message;
  }

  return errors;
}

/**
 * The rules of the contract, checked in the browser so the farmer sees the
 * problem before the save.
 */
export function validateFarmForm(form: FarmForm, options: MetaOptions): FarmErrors {
  const errors: FarmErrors = {};

  if (form.currentCrops.length === 0) {
    errors.currentCrops = en.farm.errors.cropsRequired;
  } else if (form.currentCrops.length > MAX_CROPS) {
    errors.currentCrops = en.farm.errors.cropsMax;
  }

  if (!form.waterSource) {
    errors.waterSource = en.farm.errors.waterSourceRequired;
  }

  if (form.waterSourceOther.length > WATER_SOURCE_OTHER_MAX) {
    errors.waterSourceOther = en.farm.errors.waterSourceOtherMax;
  }

  if (!form.waterAvailability) {
    errors.waterAvailability = en.farm.errors.waterAvailabilityRequired;
  }

  if (!form.soilType) {
    errors.soilType = en.farm.errors.soilTypeRequired;
  }

  if (form.equipment.length > options.equipment.length) {
    errors.equipment = en.farm.errors.equipmentMax;
  }

  if (!form.seasonsPerYear) {
    errors.seasonsPerYear = en.farm.errors.seasonsRequired;
  } else if (!FARM_SEASONS.includes(form.seasonsPerYear)) {
    errors.seasonsPerYear = en.farm.errors.seasonsInvalid;
  }

  if (form.priorities.length === 0) {
    errors.priorities = en.farm.errors.prioritiesRequired;
  } else if (form.priorities.length > options.limits.maxPriorities) {
    errors.priorities = en.farm.errors.prioritiesMax;
  }

  return errors;
}

/** Every required section has a value. */
export function isFarmFormComplete(form: FarmForm): boolean {
  return (
    form.currentCrops.length > 0 &&
    form.waterSource !== null &&
    form.waterAvailability !== null &&
    form.soilType !== null &&
    form.seasonsPerYear !== null &&
    FARM_SEASONS.includes(form.seasonsPerYear) &&
    form.priorities.length > 0
  );
}

/**
 * The body of PUT /farm. It never carries `centerId`, the water source note
 * is only kept while the source is "other", and the seasons are always one or
 * two.
 */
export function toFarmPayload(form: FarmForm): FarmPayload | null {
  if (
    !isFarmFormComplete(form) ||
    !form.waterSource ||
    !form.waterAvailability ||
    !form.soilType ||
    !form.seasonsPerYear
  ) {
    return null;
  }

  const other = form.waterSourceOther.trim();

  return {
    currentCrops: [...form.currentCrops],
    waterSource: form.waterSource as WaterSource,
    waterSourceOther: form.waterSource === 'other' && other ? other : null,
    waterAvailability: form.waterAvailability as WaterAvailability,
    soilType: form.soilType as SoilType,
    equipment: [...form.equipment],
    seasonsPerYear: form.seasonsPerYear as FarmSeasons,
    priorities: [...form.priorities],
  };
}

/** Add or remove a value of a multi select section. */
export function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
