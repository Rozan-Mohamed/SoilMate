import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRoot, type Root } from 'react-dom/client';
import { ExploreMapCanvas } from './ExploreMapCanvas';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const STREET = {
  id: 'street' as const,
  label: 'Street',
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
};

const CENTERS = [
  {
    centerId: 'desouk' as const,
    name: 'Desouk',
    bbox: [30.55, 31.05, 30.75, 31.25] as [number, number, number, number],
    value: 0.56,
    valueLabel: '0.56',
    levelId: 'mid',
    levelLabel: 'Moderate green',
    fillHex: '#9eb555',
    face: 'neutral' as const,
  },
  {
    // No geometry from the API: it must never be drawn.
    centerId: 'baltim' as const,
    name: 'Baltim',
    bbox: null,
    value: 0.52,
    valueLabel: '0.52',
    levelId: 'mid',
    levelLabel: 'Moderate green',
    fillHex: '#9eb555',
    face: 'neutral' as const,
  },
];

let root: Root;
let container: HTMLElement;

async function renderMap(overrides: Partial<Parameters<typeof ExploreMapCanvas>[0]> = {}) {
  container = document.createElement('div');
  // Leaflet needs a sized container.
  container.style.width = '800px';
  container.style.height = '600px';
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root.render(
      <ExploreMapCanvas
        centers={CENTERS}
        selectedId={null}
        selectedArea={null}
        onSelect={() => {}}
        showFaces
        label="Map"
        baseMap={STREET}
        {...overrides}
      />,
    );
  });

  // Let the dynamic leaflet import resolve.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

/** The tile urls describe where the map looks, so they show that it moved. */
function tileUrls(): string[] {
  return Array.from(container.querySelectorAll<HTMLImageElement>('.leaflet-tile')).map(
    (tile) => tile.src,
  );
}

function overlayPaths(): NodeListOf<SVGPathElement> {
  return container.querySelectorAll('.leaflet-overlay-pane path');
}

describe('leaflet map', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(''))));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it('mounts Leaflet, draws only the area with geometry and keeps the attribution', async () => {
    await renderMap();

    const map = container.querySelector('.leaflet-container');
    expect(map).not.toBeNull();

    // The attribution of the tile source is visible on the map.
    expect(container.textContent).toContain('OpenStreetMap');

    // Only Desouk has geometry, so only one overlay path is drawn.
    expect(overlayPaths().length).toBe(1);

    // The label of the mapped area is on the map.
    expect(container.textContent).toContain('Desouk');
    expect(container.textContent).not.toContain('Baltim');
  });

  it('swaps the basemap without touching the data overlay', async () => {
    await renderMap();

    const before = overlayPaths().length;
    expect(before).toBe(1);

    await act(async () => {
      root.render(
        <ExploreMapCanvas
          centers={CENTERS}
          selectedId="desouk"
          selectedArea={null}
          onSelect={() => {}}
          showFaces
          label="Map"
          baseMap={{
            ...STREET,
            id: 'satellite',
            tileUrl:
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: 'Tiles © Esri',
          }}
        />,
      );
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // The overlay is still there and the new attribution is shown.
    expect(overlayPaths().length).toBe(1);
    expect(container.textContent).toContain('Tiles © Esri');
  });

  it('moves the map to the selected area when the API gave a point for it', async () => {
    await renderMap();

    const before = tileUrls();

    await act(async () => {
      root.render(
        <ExploreMapCanvas
          centers={CENTERS}
          selectedId="baltim"
          selectedArea={{
            id: 'baltim',
            name: 'Baltim',
            bbox: null,
            location: { lat: 31.3, lon: 30.9 },
          }}
          onSelect={() => {}}
          showFaces
          label="Map"
          baseMap={STREET}
        />,
      );
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // The map looks at the point the API gave for the selected area.
    expect(tileUrls()).not.toEqual(before);

    // The point is marked, and the area without geometry is still not drawn
    // as a box.
    expect(overlayPaths().length).toBe(2);
    expect(container.querySelector('.leaflet-overlay-pane path[stroke="#184030"]')).not.toBeNull();
  });

  it('keeps the view and draws nothing when the API gave no place for the area', async () => {
    await renderMap();

    const before = tileUrls();

    await act(async () => {
      root.render(
        <ExploreMapCanvas
          centers={CENTERS}
          selectedId="baltim"
          selectedArea={{ id: 'baltim', name: 'Baltim', bbox: null, location: null }}
          onSelect={() => {}}
          showFaces
          label="Map"
          baseMap={STREET}
        />,
      );
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // No invented location: the view does not move and nothing is marked.
    expect(tileUrls()).toEqual(before);
    expect(overlayPaths().length).toBe(1);
  });

  it('keeps the map inside its own stacking context', () => {
    // Leaflet paints its panes with z-index 200–1000. Without a stacking
    // context of their own they escape the map and cover the sticky navbar.
    const css = readFileSync(
      resolve(process.cwd(), 'src/app/globals.css'),
      'utf8',
    );
    const rule = css.match(/\.soilmate-map\s*\{[^}]*\}/)?.[0] ?? '';

    expect(rule).toContain('isolation: isolate');
  });
});
