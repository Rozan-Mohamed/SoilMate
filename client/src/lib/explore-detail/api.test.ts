import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchAreaNote,
  fetchCropHealth,
  fetchHeatStress,
  fetchLandRisk,
  fetchSoilMoisture,
} from './api';

const calls: { url: string; method: string; headers: Headers }[] = [];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('layer detail endpoints', () => {
  beforeEach(() => {
    calls.length = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input, init) => {
        calls.push({
          url: String(input),
          method: init?.method ?? 'GET',
          headers: new Headers(init?.headers),
        });

        return json({});
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the four public layer detail endpoints of the API', async () => {
    await fetchCropHealth('desouk');
    await fetchSoilMoisture('desouk');
    await fetchHeatStress('desouk');
    await fetchLandRisk('desouk');

    const urls = calls.map((call) => call.url);

    expect(urls).toContain('/api/centers/desouk/layers/crop-health');
    expect(urls).toContain('/api/centers/desouk/layers/soil-moisture');
    expect(urls).toContain('/api/centers/desouk/layers/heat-stress');
    expect(urls).toContain('/api/centers/desouk/layers/land-risk');

    // Public endpoints: no identity header.
    for (const call of calls) {
      expect(call.headers.get('X-Guest-Id')).toBeNull();
      expect(call.headers.get('Authorization')).toBeNull();
    }
  });

  it('only asks for the monthly series when it is needed', async () => {
    await fetchCropHealth('desouk');
    expect(calls[0].url).toBe('/api/centers/desouk/layers/crop-health');

    calls.length = 0;
    await fetchCropHealth('desouk', { includeMonthly: true });
    expect(calls[0].url).toBe('/api/centers/desouk/layers/crop-health?include=monthly');
  });

  it('reads the area warning of the overview for the footer of the pop-up', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        json({
          center: { name: 'Desouk' },
          areaWarning: 'These numbers describe the whole area, not your field.',
          dataThrough: { cropHealth: '2025-06' },
        }),
      ),
    );

    const note = await fetchAreaNote('desouk');

    expect(note.areaWarning).toBe('These numbers describe the whole area, not your field.');
    expect(note.dataThrough).toBe('2025-06');
    expect(note.centerName).toBe('Desouk');
  });

  it('reports the errors of the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        json({ error: { code: 'NOT_FOUND', message: 'Unknown center.' } }, 404),
      ),
    );

    await expect(fetchCropHealth('desouk')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('waits for the rate limit and tries once more', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => {
        calls.push({ url: '/api/centers/desouk/layers/crop-health', method: 'GET', headers: new Headers() });

        if (calls.length === 1) {
          return new Response(
            JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'Slow down' } }),
            {
              status: 429,
              headers: { 'Content-Type': 'application/json', 'RateLimit-Reset': '1' },
            },
          );
        }

        return json({ center: { id: 'desouk' } });
      }),
    );

    const response = await fetchCropHealth('desouk');

    expect(calls).toHaveLength(2);
    expect(response.center?.id).toBe('desouk');
  });
});
