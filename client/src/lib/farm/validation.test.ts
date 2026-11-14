import { describe, expect, it } from 'vitest';
import type { Farm, MetaOptions } from '@/lib/soilmate/types';
import type { FarmForm } from './types';
import {
  emptyFarmForm,
  errorsFromIssues,
  farmFieldOf,
  farmFormFrom,
  isFarmFormComplete,
  toFarmPayload,
  toggleValue,
  validateFarmForm,
} from './validation';

const options: MetaOptions = {
  waterSource: [{ id: 'rain', label: 'Rain' }],
  waterAvailability: [{ id: 'often_limited', label: 'Often Limited' }],
  soilType: [{ id: 'loamy', label: 'Loamy' }],
  equipment: [{ id: 'standard_tractor', label: 'Standard Tractor' }],
  seasonsPerYear: [{ id: 2, label: '2 Seasons / Year' }],
  priority: [{ id: 'save_water', label: 'Save Water', profileLabel: 'Save Water', hint: '' }],
  slots: [],
  areaUnit: ['acres'],
  limits: { maxPriorities: 3 },
};

function fullForm() {
  return {
    ...emptyFarmForm(),
    currentCrops: ['field-corn'],
    waterSource: 'mixed' as const,
    waterAvailability: 'sometimes_limited' as const,
    soilType: 'loamy' as const,
    seasonsPerYear: 2 as const,
    priorities: ['save_water' as const],
  };
}

const farm: Farm = {
  id: 'farm-1',
  setupStatus: 'center_selected',
  centerId: 'desouk',
  farmName: null,
  farmLocationText: null,
  landArea: null,
  currentCrops: ['field-corn'],
  currentCropsDetail: [],
  waterSource: 'mixed',
  waterSourceOther: null,
  waterAvailability: 'sometimes_limited',
  soilType: 'loamy',
  equipment: ['standard_tractor'],
  seasonsPerYear: 2,
  priorities: ['save_water'],
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('farm form', () => {
  it('starts with nothing selected', () => {
    const form = emptyFarmForm();

    expect(form.currentCrops).toEqual([]);
    expect(form.waterSource).toBeNull();
    expect(form.waterAvailability).toBeNull();
    expect(form.soilType).toBeNull();
    expect(form.seasonsPerYear).toBeNull();
    expect(form.priorities).toEqual([]);
  });

  it('reads the saved farm into the form', () => {
    const form = farmFormFrom(farm);

    expect(form.currentCrops).toEqual(['field-corn']);
    expect(form.waterSource).toBe('mixed');
    expect(form.soilType).toBe('loamy');
    expect(form.equipment).toEqual(['standard_tractor']);
    expect(form.seasonsPerYear).toBe(2);
    expect(form.priorities).toEqual(['save_water']);
  });

  it('needs a value in every required section', () => {
    expect(isFarmFormComplete(emptyFarmForm())).toBe(false);
    expect(isFarmFormComplete(fullForm())).toBe(true);

    const errors = validateFarmForm(emptyFarmForm(), options);

    expect(errors.currentCrops).toBeDefined();
    expect(errors.waterSource).toBeDefined();
    expect(errors.waterAvailability).toBeDefined();
    expect(errors.soilType).toBeDefined();
    expect(errors.seasonsPerYear).toBeDefined();
    expect(errors.priorities).toBeDefined();
    // The equipment may stay empty.
    expect(errors.equipment).toBeUndefined();
  });

  it('never lets more than the documented number of values through', () => {
    const many: FarmForm = {
      ...fullForm(),
      currentCrops: Array.from({ length: 9 }, (_, index) => `crop-${index}`),
      priorities: ['save_water', 'improve_soil', 'protect_land', 'manage_costs'],
    };

    const errors = validateFarmForm(many, options);

    expect(errors.currentCrops).toBeDefined();
    expect(errors.priorities).toBeDefined();
  });

  it('keeps the water source note to 60 characters', () => {
    const errors = validateFarmForm(
      { ...fullForm(), waterSource: 'other', waterSourceOther: 'x'.repeat(61) },
      options,
    );

    expect(errors.waterSourceOther).toBeDefined();
  });

  it('builds the body of PUT /farm without a center and without unknown keys', () => {
    const payload = toFarmPayload(fullForm());

    expect(payload).toEqual({
      currentCrops: ['field-corn'],
      waterSource: 'mixed',
      waterSourceOther: null,
      waterAvailability: 'sometimes_limited',
      soilType: 'loamy',
      equipment: [],
      seasonsPerYear: 2,
      priorities: ['save_water'],
    });

    expect(payload).not.toHaveProperty('centerId');
    expect(Object.keys(payload ?? {}).sort()).toEqual([
      'currentCrops',
      'equipment',
      'priorities',
      'seasonsPerYear',
      'soilType',
      'waterAvailability',
      'waterSource',
      'waterSourceOther',
    ]);
  });

  it('keeps the water source note only while the source is "other"', () => {
    const withOther = toFarmPayload({
      ...fullForm(),
      waterSource: 'other',
      waterSourceOther: '  A retention pond  ',
    });

    expect(withOther?.waterSourceOther).toBe('A retention pond');

    const withoutOther = toFarmPayload({
      ...fullForm(),
      waterSource: 'rain',
      waterSourceOther: 'A retention pond',
    });

    expect(withoutOther?.waterSourceOther).toBeNull();
  });

  it('has no payload while a section is empty', () => {
    expect(toFarmPayload(emptyFarmForm())).toBeNull();
  });

  it('puts every API issue under its section', () => {
    expect(farmFieldOf('body.priorities')).toBe('priorities');
    expect(farmFieldOf('body.currentCrops')).toBe('currentCrops');
    expect(farmFieldOf('body.seasonsPerYear')).toBe('seasonsPerYear');
    expect(farmFieldOf('body.water_source')).toBe('waterSource');
    expect(farmFieldOf('body.somethingElse')).toBeNull();

    const errors = errorsFromIssues([
      { path: 'body.priorities', message: 'Select between 1 and 3 priorities.' },
      { path: 'body.soilType', message: 'Unknown soil type.' },
    ]);

    expect(errors.priorities).toBe('Select between 1 and 3 priorities.');
    expect(errors.soilType).toBe('Unknown soil type.');
  });

  it('adds and removes a value of a multi select section', () => {
    expect(toggleValue(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleValue(['a', 'b'], 'a')).toEqual(['b']);
  });
});
