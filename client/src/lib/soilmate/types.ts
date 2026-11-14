// Shared website types from the API contract. Feature-specific response types
// (rotation, plans, dashboard, explore layers, …) belong in their stage folder.

export type CenterId = 'desouk' | 'sidi_salem' | 'baltim';
export type Slot = 'fall_winter' | 'spring' | 'summer_fall';
export type MetricId = 'water' | 'soil' | 'erosion' | 'practicality' | 'economy';
export type Level = 'high' | 'moderate' | 'low';
export type PlanKey = 'keep_routine' | 'improve_soil' | 'save_water';
export type WaterSource = 'rain' | 'river_canal' | 'groundwater' | 'mixed' | 'other';
export type WaterAvailability = 'often_limited' | 'sometimes_limited' | 'usually_enough';
export type SoilType = 'mostly_sandy' | 'mostly_clay' | 'loamy' | 'not_sure';
export type Equipment =
  | 'standard_tractor'
  | 'seed_drill_planter'
  | 'no_till_drill'
  | 'combine_harvester'
  | 'drip_pivot_irrigation'
  | 'hand_tiller_tools';
export type SeasonsPerYear = 1 | 2 | 3;
export type Priority = 'save_water' | 'improve_soil' | 'protect_land' | 'manage_costs' | 'earn_more';
export type AreaUnit = 'acres' | 'hectares';
export type SmState = 'dry' | 'normal' | 'wet' | 'no_data';
export type LayerId = 'overview' | 'soil_moisture' | 'crop_health' | 'heat_stress' | 'erosion_risk';

export type GuestData = 'adopted' | 'discarded' | 'none';

/** GET /me, and the user object returned by signup/login. */
export type Me = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
  /** Present on GET /me, not on the signup/login user object. */
  passwordChangedAt?: string;
};

export type FarmSetupStatus = 'none' | 'center_selected' | 'complete';

export type CropImage = {
  url: string;
  thumbUrl: string;
  alt: string;
};

export type Crop = {
  id: string;
  name: string;
  subtitle: string;
  category: 'cash_crop' | 'cover_crop' | 'forage' | 'legume' | 'fallow';
  roleTag: string;
  benefitTag: string | null;
  description: string;
  slots: Slot[];
  selectableAsCurrent: boolean;
  image: CropImage;
  calendar: { plantingLabel: string; harvestLabel: string };
};

export type FarmCropSummary = {
  id: string;
  name: string;
  image: Pick<CropImage, 'thumbUrl' | 'alt'>;
};

export type LandArea = {
  value: number;
  unit: AreaUnit;
};

/** GET /farm and every farm write response. */
export type Farm = {
  id: string;
  setupStatus: FarmSetupStatus;
  centerId: CenterId | null;
  farmName: string | null;
  farmLocationText: string | null;
  landArea: LandArea | null;
  currentCrops: string[];
  currentCropsDetail: FarmCropSummary[];
  waterSource: WaterSource | null;
  waterSourceOther: string | null;
  waterAvailability: WaterAvailability | null;
  soilType: SoilType | null;
  equipment: Equipment[];
  seasonsPerYear: SeasonsPerYear | null;
  priorities: Priority[];
  rotationInput?: { winter: string | null; summer: string | null } | null;
  activePlanId?: string | null;
  updatedAt: string;
};

export type MetaOption<T> = {
  id: T;
  label: string;
  hint?: string;
  recommended?: boolean;
};

export type MetaPriorityOption = {
  id: Priority;
  label: string;
  profileLabel: string;
  hint: string;
};

/** GET /meta/options. Labels always come from here, never hard-coded in forms. */
export type MetaOptions = {
  waterSource: MetaOption<WaterSource>[];
  waterAvailability: MetaOption<WaterAvailability>[];
  soilType: MetaOption<SoilType>[];
  equipment: MetaOption<Equipment>[];
  seasonsPerYear: MetaOption<SeasonsPerYear>[];
  priority: MetaPriorityOption[];
  slots: { id: Slot; label: string; order: number }[];
  areaUnit: AreaUnit[];
  limits: { maxPriorities: number };
};

export type JourneyStepStatus = 'done' | 'current' | 'locked';
export type JourneyStepId = 'explore' | 'farm' | 'lab' | 'compare' | 'dashboard';

export type JourneyStep = {
  id: JourneyStepId;
  label: string;
  route: string;
  status: JourneyStepStatus;
};

/** GET /journey. [PLANNED] — see JourneyProvider for the /farm fallback. */
export type Journey = {
  steps: JourneyStep[];
  nextRoute: string;
};

export type SignupRequest = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: true;
};

export type LoginRequest = {
  email: string;
  password: string;
  rememberMe: boolean;
};

/** POST /auth/signup and /auth/login. `guestData` is only present when X-Guest-Id was sent. */
export type AuthResponse = {
  token: string;
  expiresAt: string;
  user: Me;
  guestData?: GuestData;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
