import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Farm } from '@/lib/soilmate/types';
import type { RotationLabOptionsResponse, RotationLabPlansResponse } from '@/lib/lab/types';
import { en } from '@/strings/en';
import { LabView } from './LabView';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/lab',
}));

const api = vi.hoisted(() => ({
  fetchFarm: vi.fn(),
  fetchRotationLabOptions: vi.fn(),
  lookupRotationLabPlans: vi.fn(),
  saveFarmRotation: vi.fn(),
}));

vi.mock('@/lib/lab/api', () => api);

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
    rotationInput: { winter: null, summer: null },
    activePlanId: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const options: RotationLabOptionsResponse = {
  version: 'v3-rotation-1.1',
  disclaimer: 'The tool supports farmers’ decisions and does not replace a local agricultural expert.',
  centers: [{ id: 'desouk', name: 'Desouk', nameAr: 'دسوق', governorate: 'Kafr El-Sheikh' }],
  winterCrops: [
    { id: 'wheat', name: 'Wheat', season: 'winter', roleTags: ['cereal'], description: 'Winter cereal.', image: { url: 'u', thumbUrl: 't', alt: 'Wheat' } },
    { id: 'fallow', name: 'No crop this season', season: 'any', roleTags: [], description: 'Leave the field fallow.', image: { url: 'u', thumbUrl: 't', alt: 'Fallow' } },
  ],
  summerCrops: [
    { id: 'cotton', name: 'Cotton', season: 'summer', roleTags: ['fiber'], description: 'Summer fiber crop.', image: { url: 'u', thumbUrl: 't', alt: 'Cotton' } },
    { id: 'fallow', name: 'No crop this season', season: 'any', roleTags: [], description: 'Leave the field fallow.', image: { url: 'u', thumbUrl: 't', alt: 'Fallow' } },
  ],
  rules: { minCrops: 1, invalidMessage: 'Please select at least one crop for your current rotation.' },
};

function plan(type: 'current' | 'water_saving' | 'soil_health', label: string): RotationLabPlansResponse['result']['plans']['current'] {
  return {
    plan_type: type,
    rotation: { winter: 'wheat', summer: 'cotton', label },
    current_is_best_for_goal: type === 'current',
    numbers: { net_water_mm_yr: 1389, soil_score: 0.64, income_level: 'medium', bare_days_yr: 17, overlap_days_yr: 25, water_change_vs_current_pct: type === 'current' ? 0 : -10 },
    warnings: [{ code: 'OVERLAP', severity: 'warning', message: 'Check timing with a local extension officer.' }],
    text: { reason: 'Reason text', benefits: ['Benefit'], gaps: ['Gap'], risks: ['Risk'] },
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
      water_saving: plan('water_saving', 'Wheat then Cotton'),
      soil_health: plan('soil_health', 'Wheat then Cotton'),
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
    root.render(<LabView />);
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

describe('LabView (updated backend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    router.push.mockClear();
  });

  afterEach(() => {
    if (root) act(() => root.unmount());
    container?.remove();
  });

  it('shows loading state while fetching', async () => {
    api.fetchFarm.mockReturnValue(new Promise(() => {}));
    api.fetchRotationLabOptions.mockReturnValue(new Promise(() => {}));
    await renderView();
    expect(text()).toContain(en.lab.loading);
  });

  it('renders empty rotation state when no saved rotation exists', async () => {
    api.fetchFarm.mockResolvedValue(farmOf());
    api.fetchRotationLabOptions.mockResolvedValue(options);
    await renderView();
    await flush();

    expect(text()).toContain(en.lab.planTitle);
    expect(api.lookupRotationLabPlans).not.toHaveBeenCalled();
    expect(text()).not.toContain('Rotation options for your farm');
  });

  it('loads saved rotation and renders populated plan options from actual backend-shaped response', async () => {
    api.fetchFarm.mockResolvedValue(farmOf({ rotationInput: { winter: 'wheat', summer: 'cotton' } }));
    api.fetchRotationLabOptions.mockResolvedValue(options);
    api.lookupRotationLabPlans.mockResolvedValue(plansResponse);
    await renderView();
    await flush();

    expect(api.lookupRotationLabPlans).toHaveBeenCalledWith({ center: 'desouk', winter: 'wheat', summer: 'cotton' });
    expect(text()).toContain('Rotation options for your farm');
    expect(text()).toContain('Your current rotation');
    expect(text()).toContain('Water-saving option');
    expect(text()).toContain('Soil-health option');
    expect(text()).toContain('Wheat then Cotton');
  });

  it('handles unexpected/malformed plans response safely without crashing', async () => {
    api.fetchFarm.mockResolvedValue(farmOf({ rotationInput: { winter: 'wheat', summer: 'cotton' } }));
    api.fetchRotationLabOptions.mockResolvedValue(options);
    api.lookupRotationLabPlans.mockResolvedValue({ key: 'x', input: { center: 'desouk', winter: 'wheat', summer: 'cotton' }, result: { plans: {} } } as unknown as RotationLabPlansResponse);
    await renderView();
    await flush();

    expect(text()).not.toContain('Rotation options for your farm');
    expect(container).toBeTruthy();
  });

  it('handles failed plans lookup without crashing (no plans rendered)', async () => {
    api.fetchFarm.mockResolvedValue(farmOf({ rotationInput: { winter: 'wheat', summer: 'cotton' } }));
    api.fetchRotationLabOptions.mockResolvedValue(options);
    api.lookupRotationLabPlans.mockRejectedValue(new Error('Network error'));
    await renderView();
    await flush();

    expect(text()).not.toContain('Rotation options for your farm');
    expect(container).toBeTruthy();
  });
});
