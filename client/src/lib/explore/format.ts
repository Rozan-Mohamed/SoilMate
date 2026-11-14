import type { LayerCenter, MapLegend } from './types';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** "2025-06" -> "June 2025" */
export function formatMonth(value: string | null | undefined): string {
  if (!value) return '';
  const match = /^(\d{4})-(\d{1,2})$/.exec(value.trim());
  if (!match) return value;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return value;
  return `${MONTH_NAMES[month - 1]} ${match[1]}`;
}

/** "2024-06-14" -> "14 June 2024" */
export function formatDay(value: string | null | undefined): string {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return value;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return value;
  return `${Number(match[3])} ${MONTH_NAMES[month - 1]} ${match[1]}`;
}

/** NDVI is always shown with 2 decimals and never as "-0.00". */
export function formatNdvi(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const rounded = Math.round(value * 100) / 100;
  return (Object.is(rounded, -0) ? 0 : rounded).toFixed(2);
}

/**
 * The heat layer has no fill colors, so the three areas are shaded by the rank
 * of their value. The ramp uses the project tokens (mint-3 -> leaf -> primary).
 */
export const RANK_COLORS = ['#d4ece0', '#48b080', '#006c4a'];

export function rankFill(values: number[], index: number): string {
  const sorted = [...values].sort((a, b) => a - b);
  const position = sorted.indexOf(values[index]);
  const step = sorted.length > 1 ? Math.round((position / (sorted.length - 1)) * (RANK_COLORS.length - 1)) : 0;
  return RANK_COLORS[step] ?? RANK_COLORS[0];
}

/** The fill color of one area: the data file color, or a rank shade. */
export function resolveFill(centers: LayerCenter[], index: number): string {
  const center = centers[index];
  if (!center) return RANK_COLORS[0];
  if (center.fillHex) return center.fillHex;

  const numeric = centers.map((item) => (typeof item.value === 'number' ? item.value : null));
  const usable = numeric.filter((value): value is number => value !== null);
  if (usable.length < 2) return RANK_COLORS[0];

  return rankFill(numeric.map((value) => value ?? 0), index);
}

/** The legend of the active layer, drawn from the API response. */
export function legendStops(legend: MapLegend | undefined): { offset: number; color: string }[] {
  if (!legend?.stops?.length) return [];
  const values = legend.stops.map(([value]) => value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  return legend.stops.map(([value, color]) => ({
    offset: ((value - min) / span) * 100,
    color,
  }));
}
