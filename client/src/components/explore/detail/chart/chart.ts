import type { ChartPoint, Series } from '@/lib/explore-detail/read';

/**
 * The soilmate chart tokens. The selected area uses the strong green, the
 * other areas are faded so the farmer sees the difference without losing the
 * comparison.
 */
export const CHART_COLORS = ['#006c4a', '#48b080', '#90f4c0'];
const FADED_OPACITY = 0.32;

export const VIEW_WIDTH = 320;
export const VIEW_HEIGHT = 150;
const PADDING = { top: 10, right: 8, bottom: 24, left: 30 };

export type ChartSeries = {
  name: string;
  points: ChartPoint[];
  color?: string;
};

export type ChartAxis = {
  min: number;
  max: number;
  /** The x position of every point of the longest series. */
  steps: number;
};

/** The value range of every series, with a little room around it. */
export function chartAxis(series: ChartSeries[], fixed?: { min: number; max: number } | null): ChartAxis {
  const steps = Math.max(...series.map((item) => item.points.length), 1);

  // The API sends the axis of every chart; when it does, it is used as it is.
  if (fixed && Number.isFinite(fixed.min) && Number.isFinite(fixed.max)) {
    return { min: fixed.min, max: fixed.max, steps };
  }

  const values = series.flatMap((item) =>
    item.points.map((point) => point.y).filter((value): value is number => value !== null),
  );

  if (values.length === 0) {
    return { min: 0, max: 1, steps: 1 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const padding = span === 0 ? Math.max(Math.abs(max) * 0.1, 0.1) : span * 0.1;

  return { min: min - padding, max: max + padding, steps };
}

/** The color of one series: the selected one is strong, the others fade. */
export function seriesColor(
  series: ChartSeries,
  index: number,
  selectedName: string | null,
): { color: string; opacity: number; width: number } {
  const base = series.color ?? CHART_COLORS[index % CHART_COLORS.length];

  if (!selectedName) return { color: base, opacity: 1, width: 2 };
  if (series.name === selectedName) return { color: base, opacity: 1, width: 3 };

  return { color: base, opacity: FADED_OPACITY, width: 1.5 };
}

/** The path of one series. Missing values break the line instead of faking a zero. */
export function seriesPath(
  points: ChartPoint[],
  axis: ChartAxis,
  xFor: (index: number) => number,
  yFor: (value: number) => number,
): string {
  let path = '';
  let drawing = false;

  points.forEach((point, index) => {
    if (point.y === null) {
      drawing = false;
      return;
    }

    const command = drawing ? 'L' : 'M';
    path += `${command}${xFor(index).toFixed(2)},${yFor(point.y).toFixed(2)} `;
    drawing = true;
  });

  return path.trim();
}

/** The x position of a point inside the chart area. */
export function xForIndex(index: number, axis: ChartAxis): number {
  if (axis.steps <= 1) return PADDING.left;
  const width = VIEW_WIDTH - PADDING.left - PADDING.right;
  return PADDING.left + (width * index) / (axis.steps - 1);
}

/** The y position of a value inside the chart area. */
export function yForValue(value: number, axis: ChartAxis): number {
  const height = VIEW_HEIGHT - PADDING.top - PADDING.bottom;
  const span = axis.max - axis.min || 1;
  const ratio = (value - axis.min) / span;

  return PADDING.top + height * (1 - ratio);
}

/** A few x labels, so they never crowd each other. */
export function labelIndexes(count: number, maxLabels = 6): number[] {
  if (count <= maxLabels) return Array.from({ length: count }, (_, index) => index);

  const step = Math.ceil(count / maxLabels);
  const indexes: number[] = [];

  for (let index = 0; index < count; index += step) indexes.push(index);

  return indexes;
}

/** The series of the chart, prepared for drawing. */
export function chartSeries(series: Series[], colors?: Record<string, string>): ChartSeries[] {
  return series.map((item) => ({
    name: item.name,
    points: item.points,
    color: colors?.[item.name],
  }));
}
