'use client';

import { useEffect, useRef, useState } from 'react';
import type { LayerGroup, Map as LeafletMap, TileLayer } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CenterId } from '@/lib/soilmate/types';
import { resolveFill } from '@/lib/explore/format';
import { hasGeometry } from '@/lib/explore/geometry';
import type { SelectedArea } from '@/lib/explore/location';
import type { BaseMapConfig } from '@/lib/explore/basemaps';
import type { LayerCenter } from '@/lib/explore/types';

type Props = {
  centers: LayerCenter[];
  selectedId: CenterId | null;
  /** What the API says about the place of the selected area, if anything. */
  selectedArea: SelectedArea | null;
  onSelect: (centerId: CenterId) => void;
  /** The NDVI layer adds a small face, the area name and its value. */
  showFaces: boolean;
  label: string;
  /** The basemap drawn underneath the data layer. */
  baseMap: BaseMapConfig;
};

const MAX_FIT_ZOOM = 14;
/** The zoom used when the API only gives a point for the selected area. */
const SELECTED_ZOOM = 12;

/**
 * The real interactive map. Leaflet is loaded in the browser only, so the page
 * renders on the server without any map code.
 *
 * The agricultural overlay and the basemap are two different things: the
 * overlay holds the rectangles and labels the API describes, the basemap is only
 * the imagery underneath. Switching the basemap therefore never touches the
 * selected area, the data layer or the current view.
 */
export function ExploreMapCanvas({
  centers,
  selectedId,
  selectedArea,
  onSelect,
  showFaces,
  label,
  baseMap,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const overlayRef = useRef<LayerGroup | null>(null);
  const selectionRef = useRef<LayerGroup | null>(null);
  const tileRef = useRef<TileLayer | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const onSelectRef = useRef(onSelect);
  const fittedSignatureRef = useRef('');
  const focusSignatureRef = useRef('');
  const selectedAreaRef = useRef<SelectedArea | null>(selectedArea);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    selectedAreaRef.current = selectedArea;
  }, [selectedArea]);

  // Create the map once. No centre is invented here: the view comes from the
  // geometry the API supplies.
  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    void (async () => {
      const L = await import('leaflet');
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      });

      leafletRef.current = L;
      mapRef.current = map;
      overlayRef.current = L.layerGroup().addTo(map);
      // The selection is drawn in its own group, so a data layer can change
      // without wiping the marker of the selected area.
      selectionRef.current = L.layerGroup().addTo(map);

      fittedSignatureRef.current = geometrySignature(centers);
      fitToGeometry(L, map, centers);

      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      overlayRef.current = null;
      selectionRef.current = null;
      tileRef.current = null;
      leafletRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The basemap is only the imagery: swapping it keeps the overlay, the
  // selected area and the current view.
  useEffect(() => {
    if (!ready) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    tileRef.current?.remove();
    tileRef.current = L.tileLayer(baseMap.tileUrl, {
      attribution: baseMap.attribution,
      maxZoom: baseMap.maxZoom,
    });
    tileRef.current.addTo(map);
  }, [ready, baseMap.tileUrl, baseMap.attribution, baseMap.maxZoom]);

  // The selection moves the map. It uses only what the API supplied: the box
  // of the area when there is one, the point of the area when there is one.
  // An area with neither keeps the current view, and the panel says so.
  const focusSignature = focusSignatureFor(selectedArea);

  useEffect(() => {
    if (!ready) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    const group = selectionRef.current;
    if (!L || !map || !group) return;

    if (focusSignature === focusSignatureRef.current) return;
    focusSignatureRef.current = focusSignature;

    focusSelectedArea(L, map, group, selectedAreaRef.current);
  }, [ready, focusSignature]);

  // The data overlay is rebuilt from the API response of the active layer.
  useEffect(() => {
    if (!ready) return;
    const L = leafletRef.current;
    const group = overlayRef.current;
    const map = mapRef.current;
    if (!L || !group || !map) return;

    group.clearLayers();

    centers.forEach((center, index) => {
      // An area without geometry from the API is never drawn.
      if (!hasGeometry(center.bbox)) return;

      const [west, south, east, north] = center.bbox;
      const bounds = L.latLngBounds([
        [south, west],
        [north, east],
      ]);
      const isSelected = center.centerId === selectedId;
      const fill = resolveFill(centers, index);

      const rectangle = L.rectangle(bounds, {
        color: isSelected ? '#184030' : '#ffffff',
        weight: isSelected ? 3 : 2,
        opacity: 0.95,
        fillColor: fill,
        fillOpacity: isSelected ? 0.55 : 0.3,
      });
      rectangle.on('click', () => onSelectRef.current(center.centerId));
      rectangle.bindTooltip(
        center.levelLabel ? `${center.name} — ${center.levelLabel}` : center.name,
        { sticky: true, direction: 'top', opacity: 0.95 },
      );
      rectangle.addTo(group);

      if (!showFaces) return;

      const marker = L.marker(L.latLng((south + north) / 2, (west + east) / 2), {
        icon: L.divIcon({
          className: 'soilmate-map-label-wrapper',
          html: labelHtml(center, isSelected),
          iconSize: [150, 58],
          iconAnchor: [75, 29],
        }),
        interactive: true,
        keyboard: false,
      });
      marker.on('click', () => onSelectRef.current(center.centerId));
      marker.addTo(group);
    });

    // The view moves only when the described geometry changes, never when the
    // basemap is switched. A selected area keeps the focus.
    const signature = geometrySignature(centers);
    if (signature !== fittedSignatureRef.current) {
      fittedSignatureRef.current = signature;

      const selected = selectedAreaRef.current;
      if (selected) {
        focusSelectedArea(L, map, selectionRef.current ?? group, selected);
      } else {
        fitToGeometry(L, map, centers);
      }
    }
  }, [centers, selectedId, showFaces, ready]);

  // Keep the canvas correct when the panel is resized.
  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [ready]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={label}
      className="soilmate-map h-full w-full"
    />
  );
}

/** The geometry the API described, as one comparable signature. */
function geometrySignature(centers: LayerCenter[]): string {
  return centers
    .filter((center) => hasGeometry(center.bbox))
    .map((center) => `${center.centerId}:${(center.bbox as number[]).join(',')}`)
    .join('|');
}

/**
 * The place of the selected area as one comparable signature, so the camera
 * only moves when the API described a different place.
 */
function focusSignatureFor(area: SelectedArea | null): string {
  if (!area) return '';

  const bbox = area.bbox ? area.bbox.join(',') : '';
  const location = area.location ? `${area.location.lat},${area.location.lon}` : '';

  return `${area.id}:${bbox}:${location}`;
}

/**
 * Moves the map to the selected area and marks it.
 *
 * Only data the API supplied is used: the box of the area when there is one,
 * the point of the area when there is one. An area with neither is not moved
 * to and not marked: the panel tells the user that this area has no map
 * coverage yet.
 */
function focusSelectedArea(
  L: typeof import('leaflet'),
  map: LeafletMap,
  group: LayerGroup,
  area: SelectedArea | null,
): void {
  group.clearLayers();
  if (!area) return;

  if (area.bbox) {
    const [west, south, east, north] = area.bbox;
    map.fitBounds(L.latLngBounds([[south, west], [north, east]]), {
      padding: [36, 36],
      maxZoom: MAX_FIT_ZOOM,
    });
    return;
  }

  if (area.location) {
    const { lat, lon } = area.location;
    map.setView([lat, lon], SELECTED_ZOOM);

    // A point for the area, on the coordinates the API gave.
    const marker = L.circleMarker([lat, lon], {
      radius: 9,
      color: '#184030',
      weight: 3,
      fillColor: '#1F6B45',
      fillOpacity: 0.85,
    });
    if (area.name) {
      marker.bindTooltip(area.name, { direction: 'top', opacity: 0.95 });
    }
    marker.addTo(group);
  }
}

/** Fits the view to the described areas, or to the world when there is none. */
function fitToGeometry(
  L: typeof import('leaflet'),
  map: LeafletMap,
  centers: LayerCenter[],
): void {
  const boxes = centers
    .map((center) => center.bbox)
    .filter((bbox): bbox is [number, number, number, number] => hasGeometry(bbox));

  if (boxes.length === 0) {
    // Nothing to show yet: the whole world, no invented centre.
    map.fitWorld();
    return;
  }

  const south = Math.min(...boxes.map((box) => box[1]));
  const west = Math.min(...boxes.map((box) => box[0]));
  const east = Math.max(...boxes.map((box) => box[2]));
  const north = Math.max(...boxes.map((box) => box[3]));

  map.fitBounds(L.latLngBounds([[south, west], [north, east]]), {
    padding: [36, 36],
    maxZoom: MAX_FIT_ZOOM,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function faceSvg(mood: 'sad' | 'neutral' | 'happy'): string {
  const mouth =
    mood === 'happy'
      ? 'M -8 4 Q 0 11 8 4'
      : mood === 'sad'
        ? 'M -8 10 Q 0 3 8 10'
        : 'M -8 7 L 8 7';

  return `<svg width="22" height="22" viewBox="-14 -14 28 28" aria-hidden="true"><circle cx="0" cy="0" r="13" fill="#ffffff" fill-opacity="0.92"/><circle cx="-5" cy="-3" r="1.9" fill="#12372a"/><circle cx="5" cy="-3" r="1.9" fill="#12372a"/><path d="${mouth}" stroke="#12372a" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
}

/** The face, the area name and its value, drawn on the area. */
function labelHtml(center: LayerCenter, isSelected: boolean): string {
  const value = center.valueLabel ? escapeHtml(center.valueLabel) : '';
  const name = escapeHtml(center.name);
  const face = center.face ? faceSvg(center.face) : '';
  const ring = isSelected ? 'ring-2 ring-deep' : '';

  return `<div class="flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 shadow-lg ${ring}"><span class="flex items-center gap-1.5 text-sm font-extrabold text-deep">${face}${name}</span>${value ? `<span class="text-xs font-bold text-ink-soft">${value}</span>` : ''}</div>`;
}
