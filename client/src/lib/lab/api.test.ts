import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchRotationLabOptions, lookupRotationLabPlans, saveFarmRotation } from './api';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('rotation lab api (updated backend)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input, init) => {
        const url = String(input);
        if (url.includes('/api/rotation-lab/options')) {
          return json({ version: 'v3', disclaimer: '', centers: [], winterCrops: [], summerCrops: [], rules: { minCrops: 1, invalidMessage: 'x' } });
        }
        if (url.includes('/api/rotation-lab/plans')) {
          return json({
            key: 'desouk|wheat|cotton',
            input: { center: 'desouk', winter: 'wheat', summer: 'cotton' },
            singleSeason: false,
            emptySeason: null,
            version: 'v3-rotation-1.1',
            result: {
              center: 'desouk',
              current_input: { winter: 'wheat', summer: 'cotton' },
              plans: {
                current: { plan_type: 'current', rotation: { winter: 'wheat', summer: 'cotton', label: 'Wheat then Cotton' }, current_is_best_for_goal: false, numbers: {}, warnings: [], text: {} },
                water_saving: { plan_type: 'water_saving', rotation: { winter: 'wheat', summer: 'cotton', label: 'Wheat then Cotton' }, current_is_best_for_goal: false, numbers: {}, warnings: [], text: {} },
                soil_health: { plan_type: 'soil_health', rotation: { winter: 'wheat', summer: 'cotton', label: 'Wheat then Cotton' }, current_is_best_for_goal: false, numbers: {}, warnings: [], text: {} },
              },
            },
          });
        }
        if (url.endsWith('/api/farm/rotation')) {
          return json({
            id: 'f1',
            setupStatus: 'none',
            centerId: 'desouk',
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
            rotationInput: {
              winter: init?.body ? JSON.parse(String(init.body)).winter : 'wheat',
              summer: init?.body ? JSON.parse(String(init.body)).summer : 'cotton',
            },
            activePlanId: null,
            updatedAt: new Date().toISOString(),
          } as unknown);
        }
        return json({ error: { code: 'NOT_FOUND', message: 'Unknown.' } }, 404);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches rotation lab options', async () => {
    const res = await fetchRotationLabOptions();
    expect(res.version).toBe('v3');
  });

  it('looks up plans (actual backend-shaped response)', async () => {
    const res = await lookupRotationLabPlans({ center: 'desouk', winter: 'wheat', summer: 'cotton' });
    expect(res.key).toBe('desouk|wheat|cotton');
    expect(res.input).toEqual({ center: 'desouk', winter: 'wheat', summer: 'cotton' });
    expect(res.result.plans.current.plan_type).toBe('current');
    expect(res.result.plans.water_saving.plan_type).toBe('water_saving');
    expect(res.result.plans.soil_health.plan_type).toBe('soil_health');
  });

  it('saves farm rotation', async () => {
    const res = await saveFarmRotation({ winter: 'wheat', summer: 'cotton' });
    expect(res.rotationInput?.winter).toBe('wheat');
  });
});
