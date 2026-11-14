'use client';

import type { ChartAxis, ChartSeries } from './chart';
import {
  chartAxis,
  seriesColor,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  xForIndex,
  yForValue,
} from './chart';
import { ChartLegend } from './LineChart';

type Props = {
  series: ChartSeries[];
  selectedName?: string | null;
  title?: string | null;
  unit?: string | null;
  /** The axis the API sends for this chart. */
  axis?: { min: number; max: number } | null;
  emptyLabel?: string;
};

const PADDING = { top: 10, right: 8, bottom: 24, left: 30 };

/**
 * A hand written bar chart: one group per month, one bar per area. The
 * selected area is drawn strong, the other areas fade into the background.
 */
export function BarChart({
  series,
  selectedName = null,
  title = null,
  unit = null,
  axis = null,
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

  const plotWidth = VIEW_WIDTH - PADDING.left - PADDING.right;
  const groupWidth = plotWidth / Math.max(scale.steps, 1);
  const barWidth = Math.max(groupWidth / Math.max(series.length, 1) - 2, 1.5);
  const zero = Math.min(Math.max(0, scale.min), scale.max);

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={title ? `${title}${unit ? ` (${unit})` : ''}` : 'Chart'}
      >
        <line
          x1={PADDING.left}
          x2={VIEW_WIDTH - PADDING.right}
          y1={yForValue(zero, scale)}
          y2={yForValue(zero, scale)}
          stroke="#d4ece0"
          strokeWidth={1}
        />

        {series.map((item, seriesIndex) => {
          const style = seriesColor(item, seriesIndex, selectedName);

          return (
            <g key={item.name || seriesIndex}>
              {item.points.map((point, pointIndex) => {
                if (point.y === null) return null;

                const groupStart = PADDING.left + groupWidth * pointIndex;
                const x = groupStart + seriesIndex * barWidth;

                const y = yForValue(point.y, scale);
                const base = yForValue(zero, scale);
                const height = Math.max(Math.abs(base - y), 1);

                return (
                  <rect
                    key={`${item.name}-${pointIndex}`}
                    x={x}
                    y={Math.min(y, base)}
                    width={barWidth}
                    height={height}
                    rx={1}
                    fill={style.color}
                    opacity={style.opacity}
                  />
                );
              })}
            </g>
          );
        })}

        {series[0]?.points.map((point, index) =>
          index % Math.ceil(scale.steps / 6) === 0 ? (
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
          ) : null,
        )}
      </svg>

      <ChartLegend series={series} selectedName={selectedName} />
    </figure>
  );
}
