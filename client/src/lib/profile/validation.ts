import { en } from '@/strings/en';
import type { ProfileErrors, ProfileForm } from './types';

export const MAX_CROPS = 8;
export const MAX_PRIORITIES = 3;

const NAME_MIN = 2;
const NAME_MAX = 80;
const FARM_NAME_MAX = 80;
const FARM_LOCATION_MAX = 120;
const LAND_AREA_MAX = 100000;
const PHONE_MIN_DIGITS = 7;
const PHONE_MAX_DIGITS = 15;

/** Optional "+", then 7–15 digits. An empty phone clears the field (null). */
export function validatePhone(phone: string): string | null {
  const value = phone.trim();
  if (!value) return null;

  const digits = value.startsWith('+') ? value.slice(1) : value;
  if (!/^\d+$/.test(digits)) return en.profile.errors.phoneFormat;
  if (digits.length < PHONE_MIN_DIGITS || digits.length > PHONE_MAX_DIGITS) {
    return en.profile.errors.phoneLength;
  }
  return null;
}

export function validateProfile(form: ProfileForm): ProfileErrors {
  const errors: ProfileErrors = {};

  const fullName = form.fullName.trim();
  if (!fullName) {
    errors.fullName = en.profile.errors.fullNameRequired;
  } else if (fullName.length < NAME_MIN || fullName.length > NAME_MAX) {
    errors.fullName = en.profile.errors.fullNameLength;
  }

  const phoneError = validatePhone(form.phone);
  if (phoneError) errors.phone = phoneError;

  if (form.farmName.trim().length > FARM_NAME_MAX) {
    errors.farmName = en.profile.errors.farmNameLength;
  }
  if (form.farmLocationText.trim().length > FARM_LOCATION_MAX) {
    errors.farmLocationText = en.profile.errors.farmLocationLength;
  }

  const area = form.landAreaValue.trim();
  if (area) {
    const value = Number(area);
    if (!Number.isFinite(value) || value <= 0) {
      errors.landArea = en.profile.errors.landAreaRange;
    } else if (value > LAND_AREA_MAX) {
      errors.landArea = en.profile.errors.landAreaMax;
    }
  }

  if (form.currentCrops.length > MAX_CROPS) {
    errors.currentCrops = en.profile.errors.cropsMax;
  }
  if (form.priorities.length > MAX_PRIORITIES) {
    errors.priorities = en.profile.errors.prioritiesMax;
  }

  return errors;
}

export function validatePasswordChange(values: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}): ProfileErrors {
  const errors: ProfileErrors = {};

  if (!values.currentPassword) {
    errors.currentPassword = en.profile.password.currentRequired;
  }

  if (!values.newPassword) {
    errors.newPassword = en.profile.password.newRequired;
  } else if (values.newPassword.length < 8 || values.newPassword.length > 72) {
    errors.newPassword = en.profile.password.newLength;
  } else if (!/\p{L}/u.test(values.newPassword) || !/\p{N}/u.test(values.newPassword)) {
    errors.newPassword = en.profile.password.newComplexity;
  }

  if (!values.confirmNewPassword) {
    errors.confirmNewPassword = en.profile.password.confirmRequired;
  } else if (values.confirmNewPassword !== values.newPassword) {
    errors.confirmNewPassword = en.profile.password.confirmMismatch;
  }

  return errors;
}

/** The farmer must type their own email to delete the account. */
export function validateDeleteEmail(typed: string, accountEmail: string): string | null {
  const value = typed.trim();
  if (!value) return en.profile.delete.required;
  if (value.toLowerCase() !== accountEmail.trim().toLowerCase()) {
    return en.profile.delete.mismatch;
  }
  return null;
}
