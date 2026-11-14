// Development-only Profile mock. It follows the API contract exactly (same
// fields, same status codes, same error codes) and is only used when
// NEXT_PUBLIC_MOCK_PLANNED is true, or when the real endpoint answers 404/502.
//
// Nothing here pretends to be real NASA, soil, crop or farm data: the farm
// starts empty, the crop catalog keeps its metadata blank, and the account is
// an obvious demo identity. The mock password is "Soilmate1".
import { ApiError } from '@/lib/soilmate/errors';
import { safeGet, safeRemove, safeSet } from '@/lib/soilmate/storage';
import type {
  Crop,
  Farm,
  Me,
  MetaOptions,
  WaterSource,
} from '@/lib/soilmate/types';

const MOCK_KEY = 'soilmate:mock-profile';

const MOCK_PASSWORD = 'Soilmate1';
const MOCK_EMAIL = 'demo.farmer@example.com';

type MockState = {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    emailVerified: boolean;
    createdAt: string;
    passwordChangedAt: string;
    password: string;
  };
  farm: Farm;
};

function monthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString();
}

function defaultState(): MockState {
  return {
    user: {
      id: 'mock-user-1',
      fullName: 'Demo Farmer',
      email: MOCK_EMAIL,
      phone: null,
      avatarUrl: null,
      emailVerified: false,
      createdAt: monthsAgo(6),
      passwordChangedAt: monthsAgo(3),
      password: MOCK_PASSWORD,
    },
    farm: {
      id: 'mock-farm-1',
      setupStatus: 'none',
      centerId: null,
      farmName: null,
      farmLocationText: null,
      landArea: null,
      currentCrops: [],
      currentCropsDetail: [],
      waterSource: null,
      waterSourceOther: null,
      waterAvailability: null,
      soilType: null,
      equipment: [],
      seasonsPerYear: null,
      priorities: [],
      updatedAt: new Date().toISOString(),
    },
  };
}

export function readMockState(): MockState {
  const raw = safeGet(MOCK_KEY);
  if (!raw) {
    const state = defaultState();
    writeMockState(state);
    return state;
  }
  try {
    const parsed = JSON.parse(raw) as MockState;
    if (!parsed?.user?.email || !parsed?.farm) {
      const state = defaultState();
      writeMockState(state);
      return state;
    }
    return parsed;
  } catch {
    const state = defaultState();
    writeMockState(state);
    return state;
  }
}

export function writeMockState(state: MockState): void {
  safeSet(MOCK_KEY, JSON.stringify(state));
}

/** Test helper: forget the mocked account and farm. */
export function resetMockProfile(): void {
  safeRemove(MOCK_KEY);
}

function userOf(state: MockState): Me {
  return {
    id: state.user.id,
    fullName: state.user.fullName,
    email: state.user.email,
    phone: state.user.phone,
    avatarUrl: state.user.avatarUrl,
    emailVerified: state.user.emailVerified,
    createdAt: state.user.createdAt,
    passwordChangedAt: state.user.passwordChangedAt,
  };
}

function validationError(issues: { path: string; message: string }[]): ApiError {
  return new ApiError(400, 'VALIDATION_ERROR', 'Invalid request', { issues });
}

/** Recomputed after every farm write, exactly as the contract describes. */
function setupStatusOf(farm: Farm): Farm['setupStatus'] {
  if (!farm.centerId) return 'none';
  const complete =
    farm.currentCrops.length > 0 &&
    farm.waterSource !== null &&
    farm.waterAvailability !== null &&
    farm.soilType !== null &&
    farm.seasonsPerYear !== null &&
    farm.priorities.length > 0;
  return complete ? 'complete' : 'center_selected';
}

export function mockGetMe(): Me {
  return userOf(readMockState());
}

export function mockPatchMe(payload: { fullName?: string; phone?: string | null }): Me {
  const state = readMockState();
  const issues: { path: string; message: string }[] = [];

  if (payload.fullName !== undefined) {
    const fullName = payload.fullName.trim();
    if (fullName.length < 2 || fullName.length > 80) {
      issues.push({ path: 'body.fullName', message: 'Full name must be 2–80 characters.' });
    } else {
      state.user.fullName = fullName;
    }
  }

  if (payload.phone !== undefined) {
    const phone = payload.phone?.trim() ?? '';
    if (!phone) {
      state.user.phone = null;
    } else {
      const digits = phone.startsWith('+') ? phone.slice(1) : phone;
      if (!/^\d+$/.test(digits) || digits.length < 7 || digits.length > 15) {
        issues.push({ path: 'body.phone', message: 'Phone must be 7–15 digits.' });
      } else {
        state.user.phone = phone.startsWith('+') ? `+${digits}` : digits;
      }
    }
  }

  if (issues.length > 0) throw validationError(issues);

  writeMockState(state);
  return userOf(state);
}

export function mockGetFarm(): Farm {
  return readMockState().farm;
}

export function mockPatchFarm(payload: Partial<Farm>): Farm {
  const state = readMockState();
  const farm = { ...state.farm };
  const issues: { path: string; message: string }[] = [];

  if (payload.farmName !== undefined) {
    const farmName = payload.farmName?.trim() ?? '';
    if (farmName.length > 80) {
      issues.push({ path: 'body.farmName', message: 'Farm name must be 80 characters or less.' });
    } else {
      farm.farmName = farmName || null;
    }
  }

  if (payload.farmLocationText !== undefined) {
    const location = payload.farmLocationText?.trim() ?? '';
    if (location.length > 120) {
      issues.push({
        path: 'body.farmLocationText',
        message: 'Farm location must be 120 characters or less.',
      });
    } else {
      farm.farmLocationText = location || null;
    }
  }

  if (payload.landArea !== undefined) {
    const area = payload.landArea;
    if (!area || !(area.value > 0) || area.value > 100000) {
      issues.push({ path: 'body.landArea', message: 'Land area must be between 0 and 100000.' });
    } else {
      farm.landArea = { value: area.value, unit: area.unit };
    }
  }

  if (payload.currentCrops !== undefined) {
    const unique = Array.from(new Set(payload.currentCrops));
    if (unique.length > 8) {
      issues.push({ path: 'body.currentCrops', message: 'Select at most 8 crops.' });
    } else {
      const unknown = unique.filter((id) => !mockCrops().some((crop) => crop.id === id));
      if (unknown.length > 0) {
        throw new ApiError(422, 'UNKNOWN_CROP', 'Unknown crop', { unknownIds: unknown });
      }
      farm.currentCrops = unique;
      farm.currentCropsDetail = unique.flatMap((id) => {
        const crop = mockCrops().find((candidate) => candidate.id === id);
        return crop
          ? [{ id: crop.id, name: crop.name, image: { thumbUrl: crop.image.thumbUrl, alt: crop.image.alt } }]
          : [];
      });
    }
  }

  if (payload.waterSource !== undefined) {
    const waterSource = payload.waterSource;
    if (waterSource !== null && !WATER_SOURCES.includes(waterSource)) {
      issues.push({ path: 'body.waterSource', message: 'Unknown water source.' });
    } else {
      farm.waterSource = waterSource;
    }
  }

  if (payload.waterSourceOther !== undefined) {
    const other = payload.waterSourceOther?.trim() ?? '';
    if (other.length > 60) {
      issues.push({
        path: 'body.waterSourceOther',
        message: 'Water source details must be 60 characters or less.',
      });
    } else if (farm.waterSource === 'other') {
      farm.waterSourceOther = other || null;
    }
  }

  // The contract stores the details only while the source is "other".
  if (farm.waterSource !== 'other') {
    farm.waterSourceOther = null;
  }

  if (payload.centerId !== undefined) {
    const centerId = payload.centerId;
    if (!centerId || !['desouk', 'sidi_salem', 'baltim'].includes(centerId)) {
      issues.push({ path: 'body.centerId', message: 'Unknown area.' });
    } else {
      farm.centerId = centerId;
    }
  }

  if (payload.priorities !== undefined) {
    const unique = Array.from(new Set(payload.priorities));
    if (unique.length > 3) {
      issues.push({ path: 'body.priorities', message: 'Select at most 3 priorities.' });
    } else {
      farm.priorities = unique;
    }
  }

  if (issues.length > 0) throw validationError(issues);

  farm.setupStatus = setupStatusOf(farm);
  farm.updatedAt = new Date().toISOString();
  state.farm = farm;
  writeMockState(state);
  return farm;
}

const WATER_SOURCES: WaterSource[] = [
  'rain',
  'river_canal',
  'groundwater',
  'mixed',
  'other',
];

export function mockChangePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}): void {
  const state = readMockState();

  if (payload.currentPassword !== state.user.password) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }

  const issues: { path: string; message: string }[] = [];
  if (payload.newPassword.length < 8 || payload.newPassword.length > 72) {
    issues.push({ path: 'body.newPassword', message: 'Password must be 8–72 characters.' });
  } else if (!/\p{L}/u.test(payload.newPassword) || !/\p{N}/u.test(payload.newPassword)) {
    issues.push({
      path: 'body.newPassword',
      message: 'Password must include at least 1 letter and 1 number.',
    });
  }
  if (payload.confirmNewPassword !== payload.newPassword) {
    issues.push({ path: 'body.confirmNewPassword', message: 'Passwords do not match.' });
  }
  if (issues.length > 0) throw validationError(issues);

  state.user.password = payload.newPassword;
  state.user.passwordChangedAt = new Date().toISOString();
  writeMockState(state);
}

export function mockDeleteMe(confirmEmail: string): void {
  const state = readMockState();
  if (confirmEmail.trim().toLowerCase() !== state.user.email.toLowerCase()) {
    throw validationError([
      { path: 'body.confirmEmail', message: 'The email does not match the account.' },
    ]);
  }
  resetMockProfile();
}

/** The documented crop catalog, without the agronomy metadata. */
export function mockCrops(): Crop[] {
  const ids = [
    'alfalfa-hay',
    'cotton',
    'field-corn',
    'grain-sorghum',
    'soybeans',
    'winter-wheat',
  ];
  return ids.map((id) => ({
    id,
    name: id
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
    subtitle: '',
    category: 'cash_crop',
    roleTag: '',
    benefitTag: null,
    description: '',
    slots: [],
    selectableAsCurrent: true,
    image: { url: '', thumbUrl: '', alt: id },
    calendar: { plantingLabel: '', harvestLabel: '' },
  }));
}

export function mockGetOptions(): MetaOptions {
  return {
    waterSource: [
      { id: 'rain', label: 'Rain', hint: 'Rainfed pure' },
      { id: 'river_canal', label: 'River / Canal', hint: 'Surface diverted' },
      { id: 'groundwater', label: 'Groundwater', hint: 'Deep tube well' },
      { id: 'mixed', label: 'Mixed Sources', hint: 'Rain + Supplemental' },
      { id: 'other', label: 'Other', hint: 'Retention pond' },
    ],
    waterAvailability: [
      { id: 'often_limited', label: 'Often Limited', hint: 'Rain-dependent risk' },
      { id: 'sometimes_limited', label: 'Sometimes Limited', hint: 'Seasonal dry spells' },
      { id: 'usually_enough', label: 'Usually Enough', hint: 'Consistent security' },
    ],
    soilType: [
      { id: 'mostly_sandy', label: 'Mostly Sandy', hint: 'Fast drainage, light density.' },
      { id: 'mostly_clay', label: 'Mostly Clay', hint: 'High nutrient retention.' },
      { id: 'loamy', label: 'Loamy', hint: 'Balanced water holding.' },
      { id: 'not_sure', label: 'Not Sure', hint: 'We will treat it as unknown.' },
    ],
    equipment: [
      { id: 'standard_tractor', label: 'Standard Tractor' },
      { id: 'seed_drill_planter', label: 'Seed Drill / Planter' },
      { id: 'no_till_drill', label: 'No-Till Drill' },
      { id: 'combine_harvester', label: 'Combine Harvester' },
      { id: 'drip_pivot_irrigation', label: 'Drip / Pivot Irrigation' },
      { id: 'hand_tiller_tools', label: 'Hand / Tiller Tools' },
    ],
    seasonsPerYear: [
      { id: 1, label: '1 Season / Year', hint: 'Single cash crop per calendar year.' },
      { id: 2, label: '2 Seasons / Year', hint: 'Cash crop plus a winter legume.', recommended: true },
      { id: 3, label: '3 Seasons / Year', hint: 'Intensive multi-crop relay rotation.' },
    ],
    priority: [
      {
        id: 'save_water',
        label: 'Save Water',
        profileLabel: 'Save Water',
        hint: 'Maximize soil moisture retention.',
      },
      {
        id: 'improve_soil',
        label: 'Improve Soil',
        profileLabel: 'Improve Soil',
        hint: 'Boost organic biomass and soil life.',
      },
      {
        id: 'protect_land',
        label: 'Protect Land',
        profileLabel: 'Protect My Land',
        hint: 'Prevent wind and water erosion.',
      },
      {
        id: 'manage_costs',
        label: 'Manage Costs',
        profileLabel: 'Reduce Costs',
        hint: 'Lower synthetic fertilizer and fuel use.',
      },
      {
        id: 'earn_more',
        label: 'Earn More',
        profileLabel: 'Increase Earnings',
        hint: 'Target premium grades and markets.',
      },
    ],
    slots: [
      { id: 'fall_winter', label: 'Fall / Winter', order: 1 },
      { id: 'spring', label: 'Spring', order: 2 },
      { id: 'summer_fall', label: 'Summer / Fall', order: 3 },
    ],
    areaUnit: ['acres', 'hectares'],
    limits: { maxPriorities: 3 },
  };
}

export const MOCK_PROFILE_EMAIL = MOCK_EMAIL;
export const MOCK_PROFILE_PASSWORD = MOCK_PASSWORD;
