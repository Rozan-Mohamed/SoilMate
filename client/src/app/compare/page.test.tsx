import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Farm } from '@/lib/soilmate/types';
import type { RotationLabPlansResponse } from '@/lib/lab/types';
import { en } from '@/strings/en';
import ComparePage from './page';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/compare',
}));

const apiFetchMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/soilmate/api', () => ({ apiFetch: apiFetchMock }));

const compareApi = vi.hoisted(() => ({
  fetchRotationPlans: vi.fn(),
  choosePlan: vi.fn(),
}));
vi.mock('@/lib/compare/api', () => compareApi);

function farmOf(overrides: Partial<Farm> = {}): Farm {
  return {
    id: 'farm-1',
    setupStatus: 'complete',
    centerId: 'desouk',
    farmName: 'Test Farm',
    farmLocationText: null,
    landArea: null,
    currentCrops: [],
    currentCropsDetail: [],
    waterSource: null,
    waterSourceOther: null,
    waterAvailability: null,
    soilType: null,
    equipment: [],
    seasonsPerYear: 2,
    priorities: [],
    rotationInput: { winter: 'wheat', summer: 'cotton' },
    activePlanId: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function plan(type: 'current' | 'water_saving' | 'soil_health', label: string): RotationLabPlansResponse['result']['plans']['current'] {
  return {
    plan_type: type,
    rotation: { winter: 'wheat', summer: 'cotton', label },
    current_is_best_for_goal: type === 'water_saving',
    numbers: { net_water_mm_yr: 1200, soil_score: 0.7, income_level: 'medium', bare_days_yr: 20, overlap_days_yr: 10, water_change_vs_current_pct: type === 'current' ? 0 : -15 },
    warnings: [],
    text: { reason: `${label} reason`, benefits: ['Benefit'], gaps: ['Gap'], risks: ['Risk'], evidence: ['Evidence'] },
  };
}

// Realistic backend-shaped response (GET /rotation-lab/plans)
const plansResponse: RotationLabPlansResponse = {
  key: 'desouk|wheat|cotton',
  input: { center: 'desouk', winter: 'wheat', summer: 'cotton' },
  singleSeason: false,
  emptySeason: null,
  version: 'v3-rotation-1.1',
  result: {
    center: 'desouk',
    current_input: { winter: 'wheat', summer: 'cotton' },
    plans: {
      current: plan('current', 'Wheat then Cotton'),
      water_saving: plan('water_saving', 'Wheat then Maize'),
      soil_health: plan('soil_health', 'Faba bean then Cotton'),
    },
  },
};

let root: Root;
let container: HTMLElement;

async function renderView() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<ComparePage />);
  });
}

async function flush(ms = 30) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

function text() {
  return container.textContent ?? '';
}

describe('Compare page (updated backend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    router.push.mockClear();
  });

  afterEach(() => {
    if (root) act(() => root.unmount());
    container?.remove();
  });

  it('shows loading state initially', async () => {
    apiFetchMock.mockReturnValue(new Promise(() => {}));
    await renderView();
    expect(text()).toContain(en.ui.loading);
  });

  it('shows empty/guidance state when no saved rotation exists', async () => {
    apiFetchMock.mockResolvedValue(farmOf({ centerId: 'desouk', rotationInput: { winter: null, summer: null } }));
    await renderView();
    await flush();

    expect(text()).toContain('Save a rotation in Rotation Lab before comparing plans.');
    expect(compareApi.fetchRotationPlans).not.toHaveBeenCalled();
  });

  it('renders populated plans from actual backend-shaped response', async () => {
    apiFetchMock.mockResolvedValue(farmOf());
    compareApi.fetchRotationPlans.mockResolvedValue(plansResponse);
    await renderView();
    await flush();

    expect(compareApi.fetchRotationPlans).toHaveBeenCalledWith({ center: 'desouk', winter: 'wheat', summer: 'cotton' });
    expect(text()).toContain('Your current rotation');
    expect(text()).toContain('Water-saving option');
    expect(text()).toContain('Soil-health option');
    expect(text()).toContain('Wheat then Cotton');
    expect(text()).toContain('Wheat then Maize');
  });

  it('shows error state safely when plans response is malformed/unexpected (no crash)', async () => {
    apiFetchMock.mockResolvedValue(farmOf());
    compareApi.fetchRotationPlans.mockResolvedValue({ key: 'x', input: { center: 'desouk', winter: 'wheat', summer: 'cotton' }, result: { plans: {} } } as unknown as RotationLabPlansResponse);
    await renderView();
    await flush();

    expect(text()).toContain('Plan options could not be loaded');
    expect(container).toBeTruthy();
  });

  it('shows error state when plans request fails (HTTP/network error)', async () => {
    apiFetchMock.mockResolvedValue(farmOf());
    compareApi.fetchRotationPlans.mockRejectedValue(new Error('Network error'));
    await renderView();
    await flush();

    expect(text()).toContain(en.api.generic);
    expect(container).toBeTruthy();
  });
});
