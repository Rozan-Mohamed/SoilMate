'use client';

import type { ChartAxis, ChartSeries } from './chart';
import {
  chartAxis,
  labelIndexes,
  seriesColor,
  seriesPath,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  xForIndex,
  yForValue,
} from './chart';

type Props = {
  series: ChartSeries[];
  /** The chart key of the selected area; it is drawn strong, the others faded. */
  selectedName?: string | null;
  title?: string | null;
  unit?: string | null;
  /** The axis the API sends for this chart. */
  axis?: { min: number; max: number } | null;
  /** A reference line, e.g. the bare NDVI line. */
  reference?: number | null;
  emptyLabel?: string;
};

/**
 * A hand written line chart. It scales with its container, so it never
 * overflows on a phone.
 */
export function LineChart({
  series,
  selectedName = null,
  title = null,
  unit = null,
  axis = null,
  reference = null,
  emptyLabel = 'No data',
}: Props) {
  const scale: ChartAxis = chartAxis(series, axis);
  const hasValues = series.some((item) => item.points.some((point) => point.y !== null));

  if (!hasValues) {
    return (
      <p className="rounded-xl bg-mint-2/70 px-3 py-6 text-center text-xs font-semibold text-ink-soft">
        {emptyLabel}
      </p>
    );
  }

  const labels = labelIndexes(scale.steps);
  const gridValues = [scale.min, (scale.min + scale.max) / 2, scale.max];

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={title ? `${title}${unit ? ` (${unit})` : ''}` : 'Chart'}
      >
        {gridValues.map((value) => (
          <g key={value}>
            <line
              x1={30}
              x2={VIEW_WIDTH - 8}
              y1={yForValue(value, scale)}
              y2={yForValue(value, scale)}
              stroke="#d4ece0"
              strokeWidth={1}
            />
            <text
              x={26}
              y={yForValue(value, scale) + 3}
              textAnchor="end"
              fontSize={8}
              fill="#4d6b5d"
            >
              {value.toFixed(2)}
            </text>
          </g>
        ))}

        {reference !== null && reference !== undefined && (
          <g>
            <line
              x1={30}
              x2={VIEW_WIDTH - 8}
              y1={yForValue(reference, scale)}
              y2={yForValue(reference, scale)}
              stroke="#c4553b"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            <text
              x={VIEW_WIDTH - 10}
              y={yForValue(reference, scale) - 4}
              textAnchor="end"
              fontSize={7}
              fill="#c4553b"
            >
              {reference}
            </text>
          </g>
        )}

        {series.map((item, index) => {
          const style = seriesColor(item, index, selectedName);

          return (
            <g key={item.name || index}>
              <path
                d={seriesPath(
                  item.points,
                  scale,
                  (pointIndex) => xForIndex(pointIndex, scale),
                  (value) => yForValue(value, scale),
                )}
                fill="none"
                stroke={style.color}
                strokeWidth={style.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={style.opacity}
              />
              {item.points.map((point, pointIndex) =>
                point.y === null ? null : (
                  <circle
                    key={`${item.name}-${pointIndex}`}
                    cx={xForIndex(pointIndex, scale)}
                    cy={yForValue(point.y, scale)}
                    r={style.opacity === 1 ? 2.5 : 1.8}
                    fill={style.color}
                    opacity={style.opacity}
                  />
                ),
              )}
            </g>
          );
        })}

        {labels.map((index) => {
          const point = series.find((item) => item.points[index])?.points[index];
          if (!point) return null;

          return (
            <text
              key={index}
              x={xForIndex(index, scale)}
              y={VIEW_HEIGHT - 8}
              textAnchor="middle"
              fontSize={8}
              fill="#4d6b5d"
            >
              {point.x}
            </text>
          );
        })}
      </svg>

      <ChartLegend series={series} selectedName={selectedName} />
    </figure>
  );
}

/** The areas of the chart. The selected one is named in full. */
export function ChartLegend({
  series,
  selectedName = null,
}: {
  series: ChartSeries[];
  selectedName?: string | null;
}) {
  if (series.length === 0) return null;

  return (
    <ul className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
      {series.map((item, index) => {
        const style = seriesColor(item, index, selectedName);
        const selected = selectedName !== null && item.name === selectedName;

        return (
          <li key={item.name || index} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: style.color, opacity: style.opacity }}
            />
            <span
              className={
                selected
                  ? 'text-xs font-extrabold text-deep'
                  : 'text-xs font-semibold text-ink-soft'
              }
            >
              {item.name}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
