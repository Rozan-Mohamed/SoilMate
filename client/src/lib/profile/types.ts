import type { Crop, Farm, Me, MetaOptions, Priority, WaterSource } from '@/lib/soilmate/types';

/** PATCH /me body. The email is read-only, so it is never sent. */
export type ProfileMePayload = {
  fullName: string;
  phone: string | null;
};

/** PATCH /farm body: only the fields the Profile page owns. */
export type ProfileFarmPayload = {
  farmName: string | null;
  farmLocationText: string | null;
  landArea?: { value: number; unit: 'acres' | 'hectares' };
  currentCrops: string[];
  waterSource: WaterSource | null;
  waterSourceOther: string | null;
  priorities: Priority[];
};

/** POST /me/password body. */
export type PasswordChangePayload = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export type AreaUnit = 'acres' | 'hectares';

/** Everything the Profile page edits, kept as strings for the inputs. */
export type ProfileForm = {
  fullName: string;
  phone: string;
  farmName: string;
  farmLocationText: string;
  landAreaValue: string;
  landAreaUnit: AreaUnit;
  currentCrops: string[];
  waterSource: WaterSource | null;
  waterSourceOther: string;
  priorities: Priority[];
};

export type ProfileErrors = Record<string, string>;

export type ProfileData = {
  me: Me | null;
  farm: Farm | null;
  options: MetaOptions | null;
  crops: Crop[];
};
