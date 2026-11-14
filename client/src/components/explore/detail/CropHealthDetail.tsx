'use client';

import { useState } from 'react';
import { formatNdvi } from '@/lib/explore/format';
import {
  asRecord,
  readChartAxis,
  readChartReference,
  readChartSeries,
  readChartSubtitle,
  readChartTitle,
  readInsights,
  readLimits,
  readNumberFrom,
  readSteps,
  readStringFrom,
  readSummaryCard,
  readSummaryRows,
} from '@/lib/explore-detail/read';
import type { CropHealthResponse } from '@/lib/explore-detail/types';
import { en } from '@/strings/en';
import { BarChart } from './chart/BarChart';
import { chartSeries } from './chart/chart';
import { LineChart } from './chart/LineChart';
import { DataLimitationsNotice } from './DataLimitationsNotice';
import { DetailSteps } from './DetailSteps';

type Props = {
  data: CropHealthResponse;
};

/** Used only when the API sends no steps of its own. */
const STEP_LABELS = [
  en.explore.details.cropHealth.summary,
  en.explore.details.cropHealth.greenChart,
  en.explore.details.cropHealth.bareChart,
  en.explore.details.cropHealth.trendChart,
  en.explore.details.cropHealth.insights,
];

/**
 * The crop health pop-up: five steps with the summary, the three charts of the
 * data team and the six insight lines. The charts keep all three areas; the
 * selected one is drawn strong.
 */
export function CropHealthDetail({ data }: Props) {
  const [step, setStep] = useState(0);

  const steps = readSteps(data.ui);
  const labels = steps.length > 0 ? steps.map((item) => item.title) : STEP_LABELS;

  const chartKey = readStringFrom(data.center, ['chartKey']) ?? '';
  const color = readStringFrom(data.center, ['color']);
  const colors = chartKey && color ? { [chartKey]: color } : undefined;

  const latest = asRecord(data.center?.latest) ?? {};
  const ndvi = readNumberFrom(latest, ['ndvi']);
  const levelLabel = readStringFrom(asRecord(latest.level), ['label']);
  const monthLabel = readStringFrom(latest, ['label']);
  const anomalyWord = readStringFrom(latest, ['anomaly_word']);

  const summary = readSummaryCard(data.center?.summaryCard);
  const summaryRows = readSummaryRows(data.center?.summaryCard);
  const insights = readInsights(data.center?.insights);

  const chartA = readChartSeries(data.charts, 'A');
  const chartB = readChartSeries(data.charts, 'B');
  const chartE = readChartSeries(data.charts, 'E');
  const limits = readLimits(asRecord(data.meta)?.limits);

  return (
    <div className="flex flex-col gap-4 text-left">
      <DetailSteps labels={labels} current={step} onChange={setStep} />

      {step === 0 && (
        <section className="flex flex-col gap-3">
          <div className="rounded-2xl bg-mint-2/70 p-3">
            <p className="text-sm font-extrabold text-deep">{data.center?.name ?? ''}</p>
            <p className="mt-1 text-xs font-semibold text-ink-soft">
              {en.explore.details.cropHealth.ndvi}
            </p>
            <p className="text-2xl font-extrabold text-deep">{formatNdvi(ndvi)}</p>

            <p className="mt-1 text-xs font-bold text-primary">
              {[levelLabel, monthLabel, anomalyWord].filter(Boolean).join(' · ')}
            </p>
          </div>

          <dl className="space-y-1.5">
            {summary.greenPctLast12 !== null && (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-mint-2/50 px-3 py-2">
                <dt className="text-xs font-bold text-ink-soft">
                  {en.explore.details.cropHealth.greenMonths}
                </dt>
                <dd className="text-sm font-extrabold text-deep">{summary.greenPctLast12}%</dd>
              </div>
            )}

            {summary.bareMonthsPerYear !== null && (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-mint-2/50 px-3 py-2">
                <dt className="text-xs font-bold text-ink-soft">
                  {en.explore.details.cropHealth.bareMonths}
                </dt>
                <dd className="text-sm font-extrabold text-deep">
                  {summary.bareMonthsPerYear}
                  {summary.lowestMonth ? ` · ${summary.lowestMonth}` : ''}
                </dd>
              </div>
            )}
          </dl>

          {summaryRows.length > 0 && (
            <ul className="space-y-1.5">
              {summaryRows.map((text, index) => (
                <li
                  key={index}
                  className="rounded-xl bg-mint-2/40 px-3 py-2 text-xs font-semibold text-ink"
                >
                  {text}
                </li>
              ))}
            </ul>
          )}

          {summary.sourceTag && (
            <p className="text-[11px] font-semibold text-ink-soft">{summary.sourceTag}</p>
          )}
        </section>
      )}

      {step === 1 && (
        <ChartBlock
          title={readChartTitle(data.charts, 'A') ?? en.explore.details.cropHealth.greenChart}
          subtitle={readChartSubtitle(data.charts, 'A')}
          series={chartA}
          colors={colors}
          chartKey={chartKey}
          axis={readChartAxis(data.ui, 'A')}
          reference={readChartReference(data.charts, 'A')}
        />
      )}

      {step === 2 && (
        <ChartBlock
          title={readChartTitle(data.charts, 'B') ?? en.explore.details.cropHealth.bareChart}
          subtitle={readChartSubtitle(data.charts, 'B')}
          series={chartB}
          colors={colors}
          chartKey={chartKey}
          axis={readChartAxis(data.ui, 'B')}
          bar
        />
      )}

      {step === 3 && (
        <ChartBlock
          title={readChartTitle(data.charts, 'E') ?? en.explore.details.cropHealth.trendChart}
          subtitle={readChartSubtitle(data.charts, 'E')}
          series={chartE}
          colors={colors}
          chartKey={chartKey}
          axis={readChartAxis(data.ui, 'E')}
        />
      )}

      {step === 4 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-extrabold text-deep">
            {en.explore.details.cropHealth.insights}
          </h3>

          {insights.length === 0 ? (
            <p className="rounded-xl bg-mint-2/70 px-3 py-6 text-center text-xs font-semibold text-ink-soft">
              {en.explore.details.noData}
            </p>
          ) : (
            <ol className="space-y-2">
              {insights.map((text, index) => (
                <li
                  key={index}
                  className="flex gap-2 rounded-xl bg-mint-2/50 px-3 py-2 text-left text-xs font-semibold text-ink"
                >
                  <span className="font-extrabold text-primary">{index + 1}.</span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <DataLimitationsNotice items={limits} />
    </div>
  );
}

/** One chart of the pop-up: a line or a bar chart of the data team. */
function ChartBlock({
  title,
  subtitle,
  series,
  colors,
  chartKey,
  axis,
  reference = null,
  bar = false,
}: {
  title: string;
  subtitle: string | null;
  series: ReturnType<typeof readChartSeries>;
  colors: Record<string, string> | undefined;
  chartKey: string;
  axis: { min: number; max: number } | null;
  reference?: number | null;
  bar?: boolean;
}) {
  const prepared = chartSeries(series, colors);

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-extrabold text-deep">{title}</h3>
      {subtitle && <p className="-mt-1 text-[11px] font-semibold text-ink-soft">{subtitle}</p>}

      {bar ? (
        <BarChart
          series={prepared}
          selectedName={chartKey}
          axis={axis}
          emptyLabel={en.explore.details.noData}
        />
      ) : (
        <LineChart
          series={prepared}
          selectedName={chartKey}
          axis={axis}
          reference={reference}
          emptyLabel={en.explore.details.noData}
        />
      )}
    </section>
  );
}
