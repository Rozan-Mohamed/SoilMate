import { describe, expect, it } from 'vitest';
import { canSubmitRotation, emptyLabSelection, rotationBody } from './validation';

describe('lab validation (updated backend)', () => {
  it('requires at least one non-fallow crop', () => {
    expect(canSubmitRotation(emptyLabSelection())).toBe(false);
    expect(canSubmitRotation({ winter: 'fallow', summer: 'fallow' })).toBe(false);
    expect(canSubmitRotation({ winter: 'wheat', summer: 'fallow' })).toBe(true);
    expect(canSubmitRotation({ winter: 'fallow', summer: 'maize' })).toBe(true);
    expect(canSubmitRotation({ winter: 'wheat', summer: 'maize' })).toBe(true);
  });

  it('builds rotation body from selection', () => {
    expect(rotationBody({ winter: 'wheat', summer: 'maize' })).toEqual({ winter: 'wheat', summer: 'maize' });
    expect(rotationBody({ winter: 'wheat', summer: null })).toEqual({ winter: 'wheat' });
    expect(rotationBody({ winter: null, summer: null })).toEqual({});
  });
});
