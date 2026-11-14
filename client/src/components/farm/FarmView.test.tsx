import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ApiError } from '@/lib/soilmate/errors';
import type { Crop, Farm, MetaOptions } from '@/lib/soilmate/types';
import { en } from '@/strings/en';
import { FarmView } from './FarmView';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/farm',
}));

const journey = vi.hoisted(() => ({ steps: [], nextRoute: '/farm', loading: false, refresh: vi.fn() }));
vi.mock('@/providers/JourneyProvider', () => ({ useJourney: () => journey }));

const options: MetaOptions = {
  waterSource: [
    { id: 'rain', label: 'Rain', hint: 'Rainfed pure' },
    { id: 'mixed', label: 'Mixed Sources', hint: 'Rain + Supplemental' },
    { id: 'other', label: 'Other', hint: 'Retention pond' },
  ],
  waterAvailability: [
    { id: 'often_limited', label: 'Often Limited', hint: 'Rain-dependent risk' },
    { id: 'sometimes_limited', label: 'Sometimes Limited', hint: 'Seasonal dry spells' },
  ],
  soilType: [
    { id: 'loamy', label: 'Loamy', hint: 'Rich & crumbly.' },
    { id: 'not_sure', label: 'Not Sure', hint: 'We will treat it as unknown.' },
  ],
  equipment: [{ id: 'standard_tractor', label: 'Standard Tractor' }],
  seasonsPerYear: [
    { id: 1, label: '1 Season / Year', hint: 'Single cash crop.' },
    { id: 2, label: '2 Seasons / Year', hint: 'Cash crop plus a cover.', recommended: true },
  ],
  priority: [
    { id: 'save_water', label: 'Save Water', profileLabel: 'Save Water', hint: 'Keep moisture.' },
    { id: 'improve_soil', label: 'Improve Soil', profileLabel: 'Improve Soil', hint: 'Build soil.' },
    { id: 'protect_land', label: 'Protect Land', profileLabel: 'Protect My Land', hint: 'Stop erosion.' },
    { id: 'manage_costs', label: 'Manage Costs', profileLabel: 'Reduce Costs', hint: 'Spend less.' },
  ],
  slots: [],
  areaUnit: ['acres'],
  limits: { maxPriorities: 3 },
};

const crops: Crop[] = [
  {
    id: 'field-corn',
    name: 'Field Corn',
    subtitle: 'Main cash crop',
    category: 'cash_crop',
    roleTag: 'Cash Crop',
    benefitTag: null,
    description: '',
    slots: [],
    selectableAsCurrent: true,
    image: {
      url: 'http://localhost:4000/static/crops/field-corn.webp',
      thumbUrl: 'http://localhost:4000/static/crops/thumb/field-corn.webp',
      alt: 'Rows of field corn ready for harvest',
    },
    calendar: { plantingLabel: '', harvestLabel: '' },
  },
  {
    id: 'soybeans',
    name: 'Soybeans',
    subtitle: 'Legume',
    category: 'legume',
    roleTag: 'Legume',
    benefitTag: null,
    description: '',
    slots: [],
    selectableAsCurrent: true,
    image: {
      url: 'http://localhost:4000/static/crops/soybeans.webp',
      thumbUrl: 'http://localhost:4000/static/crops/thumb/soybeans.webp',
      alt: 'Soybean plants with green pods',
    },
    calendar: { plantingLabel: '', harvestLabel: '' },
  },
];

function farmOf(overrides: Partial<Farm> = {}): Farm {
  return {
    id: 'farm-1',
    setupStatus: 'center_selected',
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
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const saved: { payload?: unknown } = {};
let farm: Farm = farmOf();
let saveError: ApiError | null = null;
/** The crops the API answers with; a test can empty the catalog. */
let cropCatalog: Crop[] = crops;

vi.mock('@/lib/farm/api', () => ({
  fetchFarm: vi.fn(async () => farm),
  fetchOptions: vi.fn(async () => options),
  fetchCurrentCrops: vi.fn(async () => ({ crops: cropCatalog })),
  saveFarm: vi.fn(async (payload: unknown) => {
    saved.payload = payload;
    if (saveError) throw saveError;
    farm = farmOf({
      setupStatus: 'complete',
      currentCrops: (payload as { currentCrops: string[] }).currentCrops,
      waterSource: (payload as { waterSource: never }).waterSource,
      waterAvailability: (payload as { waterAvailability: never }).waterAvailability,
      soilType: (payload as { soilType: never }).soilType,
      equipment: (payload as { equipment: never }).equipment,
      seasonsPerYear: (payload as { seasonsPerYear: never }).seasonsPerYear,
      priorities: (payload as { priorities: never }).priorities,
    });
    return farm;
  }),
}));

let root: Root;
let container: HTMLElement;

async function renderView() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root.render(<FarmView />);
  });

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

function buttonByLabel(label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find(
    (candidate) =>
      (candidate.getAttribute('aria-label') || candidate.textContent || '').includes(label),
  );

  if (!button) throw new Error(`Button "${label}" not found`);

  return button;
}

async function click(label: string) {
  await act(async () => {
    buttonByLabel(label).click();
  });
}

describe('my farm', () => {
  beforeEach(async () => {
    farm = farmOf();
    saveError = null;
    saved.payload = undefined;
    cropCatalog = crops;
    router.push.mockClear();
    journey.refresh.mockClear();
    vi.clearAllMocks();

    await renderView();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('shows a card for every crop of the API', () => {
    // The two crops of the API answer are selectable cards.
    const names = Array.from(container.querySelectorAll('button[aria-pressed]'))
      .map((button) => button.textContent ?? '')
      .filter((text) => text.includes('Field Corn') || text.includes('Soybeans'));

    expect(names).toHaveLength(2);

    // The image of the API is used, with the alt text of the API.
    const image = container.querySelector<HTMLImageElement>('button[aria-pressed] img');
    expect(image?.getAttribute('src')).toBe(
      'http://localhost:4000/static/crops/thumb/field-corn.webp',
    );
    expect(image?.getAttribute('alt')).toBe('Rows of field corn ready for harvest');
  });

  it('selects several crops and keeps the ids of the API', async () => {
    await click('Field Corn');
    await click('Soybeans');

    const selected = Array.from(container.querySelectorAll('button[aria-pressed="true"]'))
      .map((button) => button.textContent ?? '')
      .filter((text) => text.includes('Field Corn') || text.includes('Soybeans'));

    expect(selected).toHaveLength(2);

    // The crop ids of the API are what the payload carries.
    await click('Mixed Sources');
    await click('Sometimes Limited');
    await click('Loamy');
    await click('1 Season / Year');
    await click('Save Water');

    await act(async () => {
      buttonByLabel(en.farm.save).click();
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect((saved.payload as { currentCrops: string[] }).currentCrops).toEqual([
      'field-corn',
      'soybeans',
    ]);
  });

  it('says so when the API answers an empty crop catalog', async () => {
    act(() => root.unmount());
    container.remove();

    cropCatalog = [];
    await renderView();

    const text = container.textContent ?? '';

    // The farmer is told the catalog is empty, not that nothing is chosen.
    expect(text).toContain(en.farm.crops.catalogEmpty);
    expect(text).not.toContain(en.farm.crops.empty);

    // And the form cannot be saved without a crop.
    expect(buttonByLabel(en.farm.save).disabled).toBe(true);
  });

  it('shows every section of the form', () => {
    const text = container.textContent ?? '';

    expect(text).toContain(en.farm.title);
    expect(text).toContain(en.farm.tag);
    expect(text).toContain(en.farm.crops.title);
    expect(text).toContain(en.farm.water.source);
    expect(text).toContain(en.farm.water.availability);
    expect(text).toContain(en.farm.soil.title);
    expect(text).toContain(en.farm.equipment.title);
    expect(text).toContain(en.farm.seasons.title);
    expect(text).toContain(en.farm.priorities.title);

    // The labels come from the API.
    expect(text).toContain('Mixed Sources');
    expect(text).toContain('2 Seasons / Year');
    expect(text).toContain('Save Water');
  });

  it('preselects nothing when the API has nothing saved', () => {
    const pressed = Array.from(container.querySelectorAll<HTMLElement>('[aria-pressed="true"]'));

    expect(pressed).toHaveLength(0);
  });

  it('shows the saved answers of the API', async () => {
    act(() => root.unmount());
    container.remove();

    farm = farmOf({
      currentCrops: ['field-corn'],
      waterSource: 'mixed',
      waterAvailability: 'sometimes_limited',
      soilType: 'loamy',
      seasonsPerYear: 2,
      priorities: ['save_water'],
    });

    await renderView();

    const pressed = Array.from(container.querySelectorAll<HTMLElement>('[aria-pressed="true"]'));

    expect(pressed.length).toBeGreaterThanOrEqual(5);
    expect(container.textContent).toContain('Field Corn');
  });

  it('asks for an area first when the farm has none', () => {
    act(() => root.unmount());
    container.remove();

    farm = farmOf({ centerId: null, setupStatus: 'none' });

    return renderView().then(() => {
      expect(container.textContent).toContain(en.farm.pickArea.title);
      expect(container.querySelector('a[href="/explore"]')).not.toBeNull();
    });
  });

  it('keeps the save button disabled until every section has a value', async () => {
    const save = buttonByLabel(en.farm.save);
    expect(save.disabled).toBe(true);

    await click('Field Corn');
    await click('Mixed Sources');
    await click('Sometimes Limited');
    await click('Loamy');
    await click('2 Seasons / Year');

    // The priorities are still missing.
    expect(buttonByLabel(en.farm.save).disabled).toBe(true);

    await click('Save Water');
    expect(buttonByLabel(en.farm.save).disabled).toBe(false);
  });

  it('shows the water source note only for the "other" source', async () => {
    expect(container.querySelector('#farm-water-other')).toBeNull();

    await click('Other');
    expect(container.querySelector('#farm-water-other')).not.toBeNull();

    await click('Rain');
    expect(container.querySelector('#farm-water-other')).toBeNull();
  });

  it('saves the form and goes to the Rotation Lab', async () => {
    await click('Field Corn');
    await click('Mixed Sources');
    await click('Sometimes Limited');
    await click('Loamy');
    await click('Standard Tractor');
    await click('2 Seasons / Year');
    await click('Save Water');

    await act(async () => {
      buttonByLabel(en.farm.save).click();
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(saved.payload).toEqual({
      currentCrops: ['field-corn'],
      waterSource: 'mixed',
      waterSourceOther: null,
      waterAvailability: 'sometimes_limited',
      soilType: 'loamy',
      equipment: ['standard_tractor'],
      seasonsPerYear: 2,
      priorities: ['save_water'],
    });

    expect(journey.refresh).toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/lab');
  });

  it('never sends a center with the form', async () => {
    await click('Field Corn');
    await click('Mixed Sources');
    await click('Sometimes Limited');
    await click('Loamy');
    await click('2 Seasons / Year');
    await click('Save Water');

    await act(async () => {
      buttonByLabel(en.farm.save).click();
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(saved.payload).not.toHaveProperty('centerId');
  });

  it('keeps the save button disabled when the 4th priority would be added', async () => {
    await click('Save Water');
    await click('Improve Soil');
    await click('Protect Land');

    expect(buttonByLabel('Manage Costs').disabled).toBe(true);
    expect(container.textContent).toContain(en.farm.priorities.selected(3));
  });

  it('removes a crop the API does not know and saves nothing', async () => {
    saveError = new ApiError(422, 'UNKNOWN_CROP', 'Unknown crop', {
      unknownIds: ['field-corn'],
    });

    await click('Field Corn');
    await click('Mixed Sources');
    await click('Sometimes Limited');
    await click('Loamy');
    await click('2 Seasons / Year');
    await click('Save Water');

    await act(async () => {
      buttonByLabel(en.farm.save).click();
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(container.textContent).toContain(en.farm.unknownCrop);
    expect(router.push).not.toHaveBeenCalled();

    // The crop that is gone is no longer selected.
    const pressed = Array.from(container.querySelectorAll<HTMLElement>('[aria-pressed="true"]'));
    expect(pressed.some((item) => item.textContent?.includes('Field Corn'))).toBe(false);
  });

  it('shows the area again when the API answers 409', async () => {
    act(() => root.unmount());
    container.remove();

    farm = farmOf({ centerId: null, setupStatus: 'none' });
    saveError = new ApiError(409, 'FARM_SETUP_INCOMPLETE', 'Choose an area first.');

    await renderView();

    expect(container.textContent).toContain(en.farm.pickArea.title);
  });
});
