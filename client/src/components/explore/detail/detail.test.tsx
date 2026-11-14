import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  cropHealthDetailResponse,
  heatStressDetailResponse,
  landRiskDetailResponse,
  soilMoistureDetailResponse,
} from '@/lib/explore/fixtures';
import type { DetailLayer } from '@/lib/explore-detail/types';
import { en } from '@/strings/en';
import { LayerDetailModal } from './index';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom does not implement the dialog element of the browser.
beforeAll(() => {
  if (typeof HTMLDialogElement === 'undefined') return;

  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
});

const fetchCalls: string[] = [];
let failDetail = false;

vi.mock('@/lib/explore-detail/api', () => ({
  fetchCropHealth: vi.fn(async (centerId: string) => {
    fetchCalls.push(`crop-health:${centerId}`);
    if (failDetail) throw new Error('boom');
    return cropHealthDetailResponse(centerId as 'desouk');
  }),
  fetchSoilMoisture: vi.fn(async (centerId: string) => {
    fetchCalls.push(`soil-moisture:${centerId}`);
    if (failDetail) throw new Error('boom');
    return soilMoistureDetailResponse(centerId as 'desouk');
  }),
  fetchHeatStress: vi.fn(async (centerId: string) => {
    fetchCalls.push(`heat-stress:${centerId}`);
    if (failDetail) throw new Error('boom');
    return heatStressDetailResponse();
  }),
  fetchLandRisk: vi.fn(async (centerId: string) => {
    fetchCalls.push(`land-risk:${centerId}`);
    if (failDetail) throw new Error('boom');
    return landRiskDetailResponse(centerId as 'desouk');
  }),
  fetchAreaNote: vi.fn(async (centerId: string) => {
    fetchCalls.push(`overview:${centerId}`);
    return {
      areaWarning: 'These numbers describe the whole area, not your field.',
      dataThrough: '2025-06',
      centerName: 'Desouk',
      centerId,
    };
  }),
}));

let root: Root;
let container: HTMLElement;

async function renderModal(props: {
  open: boolean;
  centerId?: 'desouk' | 'sidi_salem' | 'baltim';
  layer?: DetailLayer;
}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root.render(
      <LayerDetailModal
        open={props.open}
        centerId={props.centerId ?? 'desouk'}
        layer={props.layer ?? 'crop-health'}
        onClose={() => {}}
      />,
    );
  });

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

function dialog(): HTMLElement | null {
  return container.querySelector('dialog');
}

function clickByText(label: string): void {
  const button = Array.from(container.querySelectorAll<HTMLElement>('button')).find(
    (candidate) => candidate.textContent?.trim() === label,
  );

  if (!button) throw new Error(`Button "${label}" not found`);

  act(() => {
    button.click();
  });
}

describe('layer detail pop-up', () => {
  beforeEach(() => {
    fetchCalls.length = 0;
    failDetail = false;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('fetches nothing while it is closed', async () => {
    await renderModal({ open: false });

    expect(fetchCalls).toEqual([]);
    expect(dialog()?.innerHTML ?? '').toBe('');
  });

  it('opens the crop health pop-up with the five steps of the API', async () => {
    await renderModal({ open: true, layer: 'crop-health' });

    expect(fetchCalls).toContain('crop-health:desouk');
    expect(fetchCalls).toContain('overview:desouk');

    const text = dialog()?.textContent ?? '';

    // Step 1: the summary with the NDVI of the area and the data team's lines.
    expect(text).toContain('0.56');
    expect(text).toContain('Moderate green');
    expect(text).toContain('Greenness is about normal (0.00)');
    expect(text).toContain('92%');

    // The area warning and the reading month stay visible.
    expect(text).toContain('These numbers describe the whole area, not your field.');
    expect(text).toContain('Latest reading: June 2025');

    // The step navigation uses the titles of the API.
    expect(text).toContain(en.explore.details.back);
    expect(text).toContain(en.explore.details.next);
    expect(text).toContain('Step 1 of 5');
    expect(text).toContain('Crop Health');
  });

  it('walks through the five steps and back to the first one', async () => {
    await renderModal({ open: true, layer: 'crop-health' });

    clickByText(en.explore.details.next);
    expect(dialog()?.textContent ?? '').toContain('Step 2 of 5');
    // The line chart of the three areas is drawn.
    expect(dialog()?.querySelectorAll('svg path').length ?? 0).toBeGreaterThan(0);

    clickByText(en.explore.details.next);
    expect(dialog()?.textContent ?? '').toContain('Step 3 of 5');
    expect(dialog()?.querySelectorAll('svg rect').length ?? 0).toBeGreaterThan(0);

    clickByText(en.explore.details.next);
    expect(dialog()?.textContent ?? '').toContain('Step 4 of 5');

    clickByText(en.explore.details.next);
    expect(dialog()?.textContent ?? '').toContain('Step 5 of 5');
    // The last step shows Restart instead of Next.
    expect(dialog()?.textContent ?? '').toContain(en.explore.details.restart);
    // The insight lines of the data team are printed as they are.
    expect(dialog()?.textContent ?? '').toContain('Weakest month: August 2016');

    clickByText(en.explore.details.restart);
    expect(dialog()?.textContent ?? '').toContain('Step 1 of 5');

    clickByText(en.explore.details.back);
    expect(dialog()?.textContent ?? '').toContain('Step 1 of 5');
  });

  it('opens the soil moisture pop-up with the calendar of the area', async () => {
    await renderModal({ open: true, layer: 'soil-moisture' });

    const text = dialog()?.textContent ?? '';

    expect(text).toContain('Jun 2025');
    expect(text).toContain('Drier than usual');
    expect(text).toContain('Wetter than usual');
    expect(text).toContain(en.explore.details.soilMoisture.smap);
    expect(text).toContain(en.explore.details.soilMoisture.power);
    // The agreement of the two sources, with the word of the API.
    expect(text).toContain('Weak agreement');
    // The report of the data team.
    expect(text).toContain('Check the soil in your own field.');
  });

  it('opens the heat stress pop-up with the fixed settings', async () => {
    await renderModal({ open: true, layer: 'heat-stress' });

    const text = dialog()?.textContent ?? '';

    expect(text).toContain('Heat threshold: 35 °C');
    expect(text).toContain('Variation: 2 SD');
    expect(text).toContain('119.5');
    expect(text).toContain('Moderate agreement');
    // The caveat stays next to the numbers.
    expect(text).toContain('daily high reached the threshold');
  });

  it('opens the land risk pop-up with the four signs', async () => {
    await renderModal({ open: true, layer: 'land-risk' });

    const text = dialog()?.textContent ?? '';

    // The signs of the atlas carry a question, not a label.
    expect(text).toContain('Is vegetation declining?');
    expect(text).toContain('Is the soil drying out?');
    expect(text).toContain('Is it getting hotter?');
    expect(text).toContain('Coast exposure (distance only)');
    expect(text).toContain('1.75');
    expect(text).toContain('Desertification risk');
  });

  it('opens every layer for every area', async () => {
    const marker: Record<DetailLayer, string> = {
      'crop-health': 'Crop Health',
      'soil-moisture': en.explore.details.soilMoisture.calendar,
      'heat-stress': en.explore.details.heatStress.fixedSettings,
      'land-risk': en.explore.details.landRisk.signs,
    };

    for (const centerId of ['desouk', 'sidi_salem', 'baltim'] as const) {
      for (const layer of ['crop-health', 'soil-moisture', 'heat-stress', 'land-risk'] as const) {
        await renderModal({ open: true, centerId, layer });

        const text = dialog()?.textContent ?? '';

        expect(text).toContain(marker[layer]);
        expect(text).toContain('Latest reading: June 2025');
      }
    }
  });

  it('shows an error banner when the endpoint fails', async () => {
    failDetail = true;

    await renderModal({ open: true, layer: 'crop-health' });

    const text = dialog()?.textContent ?? '';

    // The friendly message of the shared error helper, never a raw code.
    expect(text).toContain(en.api.generic);
    expect(text).toContain(en.explore.details.close);
    expect(text).not.toContain('Step 1 of 5');
  });
});
