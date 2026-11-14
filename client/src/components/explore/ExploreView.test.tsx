import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  centerOverviewResponse,
  centersResponse,
  mapLayerResponse,
  LAYERS,
} from '@/lib/explore/fixtures';
import type { CenterId } from '@/lib/soilmate/types';
import { en } from '@/strings/en';
import { ExploreView } from './ExploreView';

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/explore',
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const journey = vi.hoisted(() => ({
  steps: [] as { id: string; status: string }[],
  nextRoute: '/explore',
  loading: false,
  refresh: vi.fn(),
}));
vi.mock('@/providers/JourneyProvider', () => ({ useJourney: () => journey }));

// The real map draws with Leaflet in the browser; the tests use a stub that
// reports exactly what the map received.
vi.mock('@/components/explore/ExploreMapCanvas', () => ({
  ExploreMapCanvas: (props: {
    centers: { centerId: string; bbox: unknown }[];
    selectedId: string | null;
    selectedArea: {
      id: string;
      name: string;
      bbox: unknown;
      location: { lat: number; lon: number } | null;
    } | null;
    baseMap: { id: string };
  }) => (
    <div
      data-testid="explore-map"
      data-base-map={props.baseMap.id}
      data-selected={props.selectedId ?? ''}
      data-selected-area={props.selectedArea?.id ?? ''}
      data-selected-location={
        props.selectedArea?.location
          ? `${props.selectedArea.location.lat},${props.selectedArea.location.lon}`
          : ''
      }
      data-drawn={props.centers
        .filter((center) => Array.isArray(center.bbox))
        .map((center) => center.centerId)
        .join(',')}
    />
  ),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const calls: { url: string; method: string; body: unknown }[] = [];

const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

function installFetch(failCenters = false, delayOverviewMs = 0) {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ url, method, body });

      if (failCenters && url.includes('/centers')) {
        return new Response(
          JSON.stringify({ error: { code: 'INTERNAL', message: 'Boom' } }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.endsWith('/farm/center')) return json({ id: 'farm-1' });
      if (url.includes('/map/layers/')) return json(mapLayerResponse(url.split('/map/layers/')[1]));
      if (url.endsWith('/map/layers')) return json({ layers: LAYERS });
      if (url.includes('/centers/') && url.includes('/overview')) {
        if (delayOverviewMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayOverviewMs));
        }
        return json(centerOverviewResponse(url.split('/centers/')[1].split('/')[0] as CenterId));
      }
      if (url.includes('/centers')) {
        const query = new URL(url, 'http://local').searchParams.get('q') ?? '';
        return json(centersResponse(query));
      }
      if (url.endsWith('/journey')) return json({ steps: [], nextRoute: '/explore' });
      return json({});
    }),
  );
}

let root: Root;
let container: HTMLElement;

async function renderView() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<ExploreView />);
  });
}

async function waitFor(check: () => void, timeout = 3000) {
  const start = Date.now();
  for (;;) {
    try {
      check();
      return;
    } catch (error) {
      if (Date.now() - start > timeout) throw error;
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
    }
  }
}

async function clickByText(label: string, selector = 'button, a') {
  const element = Array.from(container.querySelectorAll<HTMLElement>(selector)).find(
    (candidate) => candidate.textContent?.includes(label),
  );
  if (!element) throw new Error(`Element "${label}" not found`);

  await act(async () => {
    element.click();
  });
}

function mapStub() {
  const element = container.querySelector<HTMLElement>('[data-testid="explore-map"]');
  if (!element) throw new Error('The map is not rendered');
  return element;
}

function layerIsActive(label: string): boolean {
  const button = Array.from(container.querySelectorAll<HTMLElement>('button')).find(
    (candidate) => candidate.textContent?.trim() === label,
  );
  return button?.getAttribute('aria-pressed') === 'true';
}

describe('explore land', () => {
  beforeEach(async () => {
    calls.length = 0;
    vi.clearAllMocks();
    journey.steps = [];
    window.localStorage.clear();
    window.sessionStorage.clear();
    installFetch();
    await renderView();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('loads the three areas, the layer list and the default layer', async () => {
    await waitFor(() => expect(container.querySelector('[data-testid="explore-map"]')).not.toBeNull());

    expect(container.textContent).toContain(en.explore.title);
    expect(container.textContent).toContain('Desouk');
    expect(container.textContent).toContain('Sidi Salem');
    expect(container.textContent).toContain('Baltim');
    expect(container.textContent).toContain('Field Overview');
    expect(container.textContent).toContain('Erosion Risk');
    expect(container.textContent).toContain('Not available yet');

    const urls = calls.map((call) => call.url);
    expect(urls).toContain('/api/centers');
    expect(urls).toContain('/api/map/layers');
    expect(urls).toContain('/api/map/layers/crop_health');
  });

  it('shows the area data and writes the farm area once an area is picked', async () => {
    await waitFor(() => expect(container.querySelector('[data-testid="explore-map"]')).not.toBeNull());

    await clickByText('Desouk');

    await waitFor(() => expect(container.textContent).toContain('Drier than usual'));
    expect(container.textContent).toContain('Typical heat');
    expect(container.textContent).toContain('Land risk');
    expect(container.textContent).toContain('Latest reading');

    const farmWrites = calls.filter((call) => call.url.endsWith('/farm/center'));
    expect(farmWrites).toHaveLength(1);
    expect(farmWrites[0].method).toBe('PUT');
    expect(farmWrites[0].body).toEqual({ centerId: 'desouk' });
    expect(journey.refresh).toHaveBeenCalled();
  });

  it('never calls the endpoint of the unavailable erosion layer', async () => {
    await waitFor(() => expect(container.querySelector('[data-testid="explore-map"]')).not.toBeNull());

    await clickByText('Erosion Risk');

    expect(calls.some((call) => call.url.includes('erosion_risk'))).toBe(false);
  });

  it('switches the map layer', async () => {
    await waitFor(() => expect(container.querySelector('[data-testid="explore-map"]')).not.toBeNull());

    await clickByText('Soil Moisture');

    await waitFor(() =>
      expect(calls.some((call) => call.url.endsWith('/map/layers/soil_moisture'))).toBe(true),
    );
  });

  it('searches the covered areas and shows the coverage note when nothing matches', async () => {
    await waitFor(() => expect(container.querySelector('[data-testid="explore-map"]')).not.toBeNull());

    const input = container.querySelector<HTMLInputElement>('#explore-search');
    expect(input).not.toBeNull();

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(input, 'zzz');
      input?.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await waitFor(() =>
      expect(calls.some((call) => call.url.includes('/centers?q=zzz'))).toBe(true),
    );
    await waitFor(() => expect(container.textContent).toContain('We currently cover'));
  });

  it('keeps the rotation lab closed until the farm step is done', async () => {
    journey.steps = [{ id: 'lab', status: 'locked' }];
    await act(async () => {
      root.render(<ExploreView />);
    });

    await waitFor(() => expect(container.textContent).toContain(en.explore.cta.labLocked));
    expect(container.querySelector('a[href="/lab"]')).toBeNull();

    journey.steps = [{ id: 'lab', status: 'current' }];
    await act(async () => {
      root.render(<ExploreView />);
    });

    await waitFor(() => expect(container.querySelector('a[href="/lab"]')).not.toBeNull());
  });

  it('shows an error and a retry when the API fails', async () => {
    // A fresh mount, so the load effect runs against the failing API.
    act(() => root.unmount());
    container.remove();
    calls.length = 0;
    installFetch(true);
    await renderView();

    await waitFor(() => expect(container.textContent).toContain(en.explore.errors.layer));
    expect(container.textContent).toContain(en.explore.errors.retry);
  });

  it('switches between the street and the satellite base map', async () => {
    await waitFor(() => expect(container.querySelector('[data-testid="explore-map"]')).not.toBeNull());

    expect(mapStub().getAttribute('data-base-map')).toBe('street');

    await clickByText(en.explore.baseMap.satellite);
    await waitFor(() => expect(mapStub().getAttribute('data-base-map')).toBe('satellite'));

    await clickByText(en.explore.baseMap.street);
    await waitFor(() => expect(mapStub().getAttribute('data-base-map')).toBe('street'));
  });

  it('keeps the selected area and the selected data layer when the base map changes', async () => {
    await waitFor(() => expect(container.querySelector('[data-testid="explore-map"]')).not.toBeNull());

    await clickByText('Desouk');
    await waitFor(() => expect(mapStub().getAttribute('data-selected')).toBe('desouk'));

    await clickByText('Soil Moisture');
    await waitFor(() => expect(layerIsActive('Soil Moisture')).toBe(true));

    await clickByText(en.explore.baseMap.satellite);
    await waitFor(() => expect(mapStub().getAttribute('data-base-map')).toBe('satellite'));

    // The area, the data layer and the selection are all still there.
    expect(mapStub().getAttribute('data-selected')).toBe('desouk');
    expect(layerIsActive('Soil Moisture')).toBe(true);
    expect(container.textContent).toContain('Latest reading');
  });

  it('draws every area the API describes', async () => {
    await waitFor(() => expect(container.querySelector('[data-testid="explore-map"]')).not.toBeNull());

    // The API describes a box for all three areas, so all three are drawn.
    expect(mapStub().getAttribute('data-drawn')).toBe('desouk,sidi_salem,baltim');
    expect(container.textContent).not.toContain('no map geometry');
  });

  it('tells the map about the selected area, with the place the API gave', async () => {
    await waitFor(() => expect(container.querySelector('[data-testid="explore-map"]')).not.toBeNull());

    await clickByText('Desouk');
    await waitFor(() => expect(mapStub().getAttribute('data-selected-area')).toBe('desouk'));

    // The API gives a map centre for every area, so the map can go there.
    expect(mapStub().getAttribute('data-selected-location')).toBe('31.15,30.65');

    await clickByText('Baltim');
    await waitFor(() => expect(mapStub().getAttribute('data-selected-area')).toBe('baltim'));

    expect(mapStub().getAttribute('data-selected-location')).toBe('31.55,31.115');
    expect(container.textContent).not.toContain('No map coverage');
  });

  it('never shows the details of the previous area for the newly selected one', async () => {
    // A fresh mount with a slow overview, so the moment right after the click
    // can be checked.
    act(() => root.unmount());
    container.remove();
    calls.length = 0;
    installFetch(false, 80);
    await renderView();

    await waitFor(() => expect(container.querySelector('[data-testid="explore-map"]')).not.toBeNull());

    await clickByText('Desouk');
    await waitFor(() => expect(container.textContent).toContain('119.5'));

    await clickByText('Baltim');

    // The numbers of Desouk are gone at once, and the card names the new area.
    expect(container.textContent).not.toContain('119.5');
    expect(container.textContent).toContain('Loading the data for Baltim');

    await waitFor(() => expect(container.textContent).toContain('6.2'));
    expect(container.textContent).not.toContain('119.5');
  });

  it('keeps the layer panel inside the map area and above the map', async () => {
    await waitFor(() => expect(container.querySelector('[data-testid="explore-map"]')).not.toBeNull());

    const panel = container.querySelector<HTMLElement>('aside');
    expect(panel).not.toBeNull();

    // The panel floats on the map, inside the map area...
    const mapArea = mapStub().closest('.isolate');
    expect(mapArea).not.toBeNull();
    expect(panel?.closest('.isolate')).toBe(mapArea);

    // ...and it is painted over the map panes.
    expect(panel?.className).toContain('lg:z-20');

    // The base map switch stays in the header row, so the panel cannot cover
    // it any more.
    const baseMapSwitch = container.querySelector('[role="group"]');
    expect(baseMapSwitch).not.toBeNull();
    expect(baseMapSwitch?.closest('.isolate')).toBeNull();
  });
});
