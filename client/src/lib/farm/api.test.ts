import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchCurrentCrops, fetchFarm, fetchOptions, saveFarm } from './api';
import type { FarmPayload } from './types';

const calls: { url: string; method: string; body: unknown; headers: Headers }[] = [];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const farm = {
  id: 'farm-1',
  setupStatus: 'complete',
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
  equipment: [],
  seasonsPerYear: 2,
  priorities: ['save_water'],
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('farm endpoints', () => {
  beforeEach(() => {
    calls.length = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input, init) => {
        const url = String(input);
        calls.push({
          url,
          method: init?.method ?? 'GET',
          body: init?.body ? JSON.parse(String(init.body)) : undefined,
          headers: new Headers(init?.headers),
        });

        if (url.endsWith('/api/farm') && (init?.method ?? 'GET') === 'GET') return json(farm);
        if (url.endsWith('/api/farm') && init?.method === 'PUT') return json(farm);
        if (url.includes('/api/meta/options')) return json({ waterSource: [] });
        if (url.includes('/api/crops')) return json({ crops: [] });

        return json({ error: { code: 'NOT_FOUND', message: 'Unknown.' } }, 404);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the three documented endpoints on load', async () => {
    await fetchFarm();
    await fetchOptions();
    await fetchCurrentCrops();

    const urls = calls.map((call) => call.url);

    expect(urls).toContain('/api/farm');
    expect(urls).toContain('/api/meta/options');
    expect(urls).toContain('/api/crops?use=current');
  });

  it('sends the identity header for the farm, and none for the public calls', async () => {
    await fetchFarm();
    await fetchOptions();

    const farmCall = calls.find((call) => call.url.endsWith('/api/farm'));
    const optionsCall = calls.find((call) => call.url.includes('/api/meta/options'));

    expect(farmCall?.headers.get('X-Guest-Id')).toBeTruthy();
    expect(optionsCall?.headers.get('X-Guest-Id')).toBeNull();
    expect(optionsCall?.headers.get('Authorization')).toBeNull();
  });

  it('saves the form with PUT /farm and the exact body', async () => {
    const payload: FarmPayload = {
      currentCrops: ['field-corn'],
      waterSource: 'mixed',
      waterSourceOther: null,
      waterAvailability: 'sometimes_limited',
      soilType: 'loamy',
      equipment: ['standard_tractor'],
      seasonsPerYear: 2,
      priorities: ['save_water'],
    };

    const saved = await saveFarm(payload);

    const call = calls.find((entry) => entry.method === 'PUT');

    expect(call?.url).toBe('/api/farm');
    expect(call?.body).toEqual(payload);
    expect(call?.body).not.toHaveProperty('centerId');
    expect(saved.setupStatus).toBe('complete');
  });

  it('reports the errors of the contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        json(
          {
            error: {
              code: 'UNKNOWN_CROP',
              message: 'Unknown crop',
              details: { unknownIds: ['field-corn'] },
            },
          },
          422,
        ),
      ),
    );

    await expect(saveFarm({
      currentCrops: ['field-corn'],
      waterSource: 'rain',
      waterSourceOther: null,
      waterAvailability: 'often_limited',
      soilType: 'loamy',
      equipment: [],
      seasonsPerYear: 1,
      priorities: ['save_water'],
    })).rejects.toMatchObject({ code: 'UNKNOWN_CROP' });
  });
});
