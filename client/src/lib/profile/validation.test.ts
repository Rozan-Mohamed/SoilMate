import { describe, expect, it } from 'vitest';
import { en } from '@/strings/en';
import {
  validateDeleteEmail,
  validatePasswordChange,
  validatePhone,
  validateProfile,
} from './validation';
import type { ProfileForm } from './types';

const form = (overrides: Partial<ProfileForm> = {}): ProfileForm => ({
  fullName: 'Alex Henderson',
  phone: '',
  farmName: '',
  farmLocationText: '',
  landAreaValue: '',
  landAreaUnit: 'acres',
  currentCrops: [],
  waterSource: null,
  waterSourceOther: '',
  priorities: [],
  ...overrides,
});

describe('profile validation', () => {
  it('requires a full name of 2–80 characters', () => {
    expect(validateProfile(form({ fullName: '  ' })).fullName).toBe(
      en.profile.errors.fullNameRequired,
    );
    expect(validateProfile(form({ fullName: 'A' })).fullName).toBe(
      en.profile.errors.fullNameLength,
    );
    expect(validateProfile(form({ fullName: 'A'.repeat(81) })).fullName).toBe(
      en.profile.errors.fullNameLength,
    );
    expect(validateProfile(form()).fullName).toBeUndefined();
  });

  it('accepts an empty phone and a phone with an optional +', () => {
    expect(validatePhone('')).toBeNull();
    expect(validatePhone('01000000000')).toBeNull();
    expect(validatePhone('+201000000000')).toBeNull();
  });

  it('rejects a phone with letters or the wrong number of digits', () => {
    expect(validatePhone('abc')).toBe(en.profile.errors.phoneFormat);
    expect(validatePhone('+20 100 000 0000')).toBe(en.profile.errors.phoneFormat);
    expect(validatePhone('123456')).toBe(en.profile.errors.phoneLength);
    expect(validatePhone('1234567890123456')).toBe(en.profile.errors.phoneLength);
  });

  it('limits the farm name, location and land area', () => {
    expect(validateProfile(form({ farmName: 'a'.repeat(81) })).farmName).toBe(
      en.profile.errors.farmNameLength,
    );
    expect(validateProfile(form({ farmLocationText: 'a'.repeat(121) })).farmLocationText).toBe(
      en.profile.errors.farmLocationLength,
    );
    expect(validateProfile(form({ landAreaValue: '0' })).landArea).toBe(
      en.profile.errors.landAreaRange,
    );
    expect(validateProfile(form({ landAreaValue: '100001' })).landArea).toBe(
      en.profile.errors.landAreaMax,
    );
    expect(validateProfile(form({ landAreaValue: '42.5' })).landArea).toBeUndefined();
  });

  it('accepts a valid profile', () => {
    expect(
      validateProfile(
        form({
          fullName: 'Alex Henderson',
          phone: '+201000000000',
          farmName: 'My Farm',
          farmLocationText: 'Desouk',
          landAreaValue: '42.5',
          currentCrops: ['field-corn'],
          priorities: ['save_water'],
        }),
      ),
    ).toEqual({});
  });

  it('validates the password change', () => {
    expect(
      validatePasswordChange({ currentPassword: '', newPassword: '', confirmNewPassword: '' }),
    ).toEqual({
      currentPassword: en.profile.password.currentRequired,
      newPassword: en.profile.password.newRequired,
      confirmNewPassword: en.profile.password.confirmRequired,
    });

    expect(
      validatePasswordChange({
        currentPassword: 'old',
        newPassword: 'short1',
        confirmNewPassword: 'other1',
      }),
    ).toEqual({
      newPassword: en.profile.password.newLength,
      confirmNewPassword: en.profile.password.confirmMismatch,
    });

    expect(
      validatePasswordChange({
        currentPassword: 'old',
        newPassword: 'allletters',
        confirmNewPassword: 'allletters',
      }).newPassword,
    ).toBe(en.profile.password.newComplexity);

    expect(
      validatePasswordChange({
        currentPassword: 'old',
        newPassword: 'Str0ngPass1',
        confirmNewPassword: 'Str0ngPass1',
      }),
    ).toEqual({});
  });

  it('only deletes the account when the typed email matches', () => {
    expect(validateDeleteEmail('', 'demo@example.com')).toBe(en.profile.delete.required);
    expect(validateDeleteEmail('other@example.com', 'demo@example.com')).toBe(
      en.profile.delete.mismatch,
    );
    expect(validateDeleteEmail('  DEMO@example.com ', 'demo@example.com')).toBeNull();
  });
});
