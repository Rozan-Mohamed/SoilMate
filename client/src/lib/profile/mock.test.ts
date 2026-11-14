import { beforeEach, describe, expect, it } from 'vitest';
import {
  mockChangePassword,
  mockDeleteMe,
  mockGetFarm,
  mockGetMe,
  mockGetOptions,
  mockPatchFarm,
  mockPatchMe,
  mockCrops,
  MOCK_PROFILE_EMAIL,
  MOCK_PROFILE_PASSWORD,
  resetMockProfile,
} from './mock';

describe('profile mock', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    resetMockProfile();
  });

  it('starts with a demo account and an empty farm', () => {
    const me = mockGetMe();
    expect(me.email).toBe(MOCK_PROFILE_EMAIL);
    expect(me.emailVerified).toBe(false);
    expect(me.avatarUrl).toBeNull();
    expect(me.passwordChangedAt).toBeTruthy();

    const farm = mockGetFarm();
    expect(farm.centerId).toBeNull();
    expect(farm.farmName).toBeNull();
    expect(farm.landArea).toBeNull();
    expect(farm.currentCrops).toEqual([]);
    expect(farm.priorities).toEqual([]);
    expect(farm.setupStatus).toBe('none');
  });

  it('patches the name and the phone', () => {
    expect(mockPatchMe({ fullName: '  New Name ', phone: '+201000000000' })).toMatchObject({
      fullName: 'New Name',
      phone: '+201000000000',
    });
  });

  it('clears the phone when it is sent as null', () => {
    mockPatchMe({ phone: '+201000000000' });
    expect(mockPatchMe({ phone: null }).phone).toBeNull();
  });

  it('rejects an invalid phone with a field error', () => {
    try {
      mockPatchMe({ phone: '123' });
      expect.unreachable('the mock should reject the phone');
    } catch (error) {
      expect(error).toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
      expect((error as { issues: { path: string }[] }).issues[0].path).toBe('body.phone');
    }
  });

  it('patches the farm and keeps the saved values', () => {
    const farm = mockPatchFarm({
      farmName: 'My Farm',
      farmLocationText: 'Desouk',
      landArea: { value: 42.5, unit: 'acres' },
      currentCrops: ['field-corn'],
      waterSource: 'other',
      waterSourceOther: 'Well',
      priorities: ['save_water'],
    });

    expect(farm.farmName).toBe('My Farm');
    expect(farm.landArea).toEqual({ value: 42.5, unit: 'acres' });
    expect(farm.currentCrops).toEqual(['field-corn']);
    expect(farm.currentCropsDetail[0]?.name).toBe('Field Corn');
    expect(farm.waterSourceOther).toBe('Well');
    // No area is chosen in the mock, so the farm is still "none".
    expect(farm.setupStatus).toBe('none');
  });

  it('clears waterSourceOther when the source is not "other"', () => {
    mockPatchFarm({ waterSource: 'other', waterSourceOther: 'Well' });
    const farm = mockPatchFarm({ waterSource: 'rain' });
    expect(farm.waterSourceOther).toBeNull();
  });

  it('rejects an unknown crop with UNKNOWN_CROP', () => {
    try {
      mockPatchFarm({ currentCrops: ['not-a-crop'] });
      expect.unreachable('the mock should reject the crop');
    } catch (error) {
      expect(error).toMatchObject({ status: 422, code: 'UNKNOWN_CROP' });
    }
  });

  it('changes the password only with the right current password', () => {
    try {
      mockChangePassword({
        currentPassword: 'wrong',
        newPassword: 'Str0ngPass1',
        confirmNewPassword: 'Str0ngPass1',
      });
      expect.unreachable('the mock should reject the current password');
    } catch (error) {
      expect(error).toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    }

    mockChangePassword({
      currentPassword: MOCK_PROFILE_PASSWORD,
      newPassword: 'Str0ngPass1',
      confirmNewPassword: 'Str0ngPass1',
    });

    // The new password is now the one that works.
    expect(() =>
      mockChangePassword({
        currentPassword: MOCK_PROFILE_PASSWORD,
        newPassword: 'Another1',
        confirmNewPassword: 'Another1',
      }),
    ).toThrow();
  });

  it('deletes the account only with the right email', () => {
    expect(() => mockDeleteMe('other@example.com')).toThrow();

    mockDeleteMe(MOCK_PROFILE_EMAIL);
    expect(mockGetMe().email).toBe(MOCK_PROFILE_EMAIL);
  });

  it('exposes the documented options and the selectable crops', () => {
    const options = mockGetOptions();
    expect(options.waterSource).toHaveLength(5);
    expect(options.priority.map((option) => option.profileLabel)).toContain('Protect My Land');
    expect(options.limits.maxPriorities).toBe(3);
    expect(options.areaUnit).toEqual(['acres', 'hectares']);

    const crops = mockCrops();
    expect(crops).toHaveLength(6);
    expect(crops.every((crop) => crop.selectableAsCurrent)).toBe(true);
  });
});
