'use client';

import {
  asRecord,
  readHeatSummary,
  readHeatTypicalYear,
  readLimits,
  readNumberFrom,
  readSources,
  readStringFrom,
  readTextBlock,
} from '@/lib/explore-detail/read';
import type { HeatStressResponse } from '@/lib/explore-detail/types';
import { en } from '@/strings/en';
import { LineChart } from './chart/LineChart';
import { chartSeries } from './chart/chart';
import { DataLimitationsNotice } from './DataLimitationsNotice';

type Props = {
  data: HeatStressResponse;
};

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * The heat stress pop-up. The settings are fixed (35 °C, 2 SD) — there is no
 * slider — and the caveats stay next to the numbers.
 */
export function HeatStressDetail({ data }: Props) {
  const summary = readHeatSummary(data.summary);
  const typicalYear = readHeatTypicalYear(data.comparison?.typicalYear);
  const texts = asRecord(data.texts) ?? {};
  const agreement = asRecord(data.comparison?.agreement);
  const agreementLevels = asRecord(data.labels?.agreementLevels) ?? {};

  const agreementLevel = readStringFrom(agreement, ['level']);
  const agreementWord = agreementLevel
    ? (readStringFrom(agreementLevels, [agreementLevel]) ?? agreementLevel)
    : null;

  const threshold = data.defaults?.thresholdC;
  const sigma = data.defaults?.sigma;

  const blocks = [
    readTextBlock(texts.q1 ? { question: texts.q1, answer: texts.a1, note: texts.n1 } : null),
    readTextBlock(texts.q2 ? { question: texts.q2, answer: texts.a2, note: texts.n2 } : null),
  ].filter((block): block is NonNullable<typeof block> => block !== null);

  const limits = readLimits(data.limits);
  const sources = readSources(data.sources);

  const chartSeriesData = typicalYear
    ? chartSeries([
        {
          name: en.explore.details.heatStress.weather,
          points: typicalYear.weather.map((value, index) => ({ x: MONTH_NAMES[index] ?? '', y: value })),
        },
        {
          name: en.explore.details.heatStress.satellite,
          points: typicalYear.satellite.map((value, index) => ({ x: MONTH_NAMES[index] ?? '', y: value })),
        },
      ])
    : [];

  return (
    <div className="flex flex-col gap-4 text-left">
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-extrabold text-deep">
          {en.explore.details.heatStress.summary}
        </h3>

        <dl className="space-y-1.5">
          {summary.avgHigh !== null && (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-mint-2/50 px-3 py-2">
              <dt className="text-xs font-bold text-ink-soft">
                {en.explore.details.heatStress.avgHigh}
              </dt>
              <dd className="text-sm font-extrabold text-deep">{summary.avgHigh} °C</dd>
            </div>
          )}

          {summary.avgLow !== null && (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-mint-2/50 px-3 py-2">
              <dt className="text-xs font-bold text-ink-soft">
                {en.explore.details.heatStress.avgLow}
              </dt>
              <dd className="text-sm font-extrabold text-deep">{summary.avgLow} °C</dd>
            </div>
          )}

          {summary.hottest && (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-mint-2/50 px-3 py-2">
              <dt className="text-xs font-bold text-ink-soft">
                {en.explore.details.heatStress.hottestDay}
              </dt>
              <dd className="text-sm font-extrabold text-deep">
                {summary.hottest.date} · {summary.hottest.value} °C
              </dd>
            </div>
          )}

          {summary.heatDays !== null && (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-mint-2/50 px-3 py-2">
              <dt className="text-xs font-bold text-ink-soft">
                {en.explore.details.heatStress.hotDays}
              </dt>
              <dd className="text-sm font-extrabold text-deep">{summary.heatDays}</dd>
            </div>
          )}

          {summary.longestSpell && (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-mint-2/50 px-3 py-2">
              <dt className="text-xs font-bold text-ink-soft">
                {en.explore.details.heatStress.longestSpell}
              </dt>
              <dd className="text-sm font-extrabold text-deep">
                {summary.longestSpell.days} · {summary.longestSpell.from}
              </dd>
            </div>
          )}

          {summary.trendPerDecade !== null && (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-mint-2/50 px-3 py-2">
              <dt className="text-xs font-bold text-ink-soft">
                {en.explore.details.heatStress.trend}
              </dt>
              <dd className="text-sm font-extrabold text-deep">{summary.trendPerDecade} °C</dd>
            </div>
          )}
        </dl>


      </section>

      {(threshold !== undefined || sigma !== undefined) && (
        <section className="flex flex-col gap-2 rounded-2xl bg-mint-2/70 p-3">
          <h3 className="text-sm font-extrabold text-deep">
            {en.explore.details.heatStress.fixedSettings}
          </h3>
          <div className="flex flex-wrap gap-2">
            {threshold !== undefined && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-deep">
                {en.explore.details.heatStress.threshold}: {threshold} °C
              </span>
            )}
            {sigma !== undefined && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-deep">
                {en.explore.details.heatStress.sigma}: {sigma} SD
              </span>
            )}
          </div>
          <p className="text-[11px] font-semibold text-ink-soft">
            {en.explore.details.heatStress.fixedSettingsNote}
          </p>
        </section>
      )}

      {agreementWord && (
        <section className="flex flex-col gap-1 rounded-2xl bg-mint-2/70 p-3">
          <h3 className="text-sm font-extrabold text-deep">
            {en.explore.details.heatStress.agreement}
          </h3>
          <p className="text-sm font-extrabold text-primary">{agreementWord}</p>
          <p className="text-xs font-semibold text-ink">
            {[
              readNumberFrom(agreement, ['agree_months']) !== null &&
                readNumberFrom(agreement, ['months']) !== null
                ? `${readNumberFrom(agreement, ['agree_months'])} of ${readNumberFrom(agreement, ['months'])} months`
                : null,
              readNumberFrom(agreement, ['agree_pct']) !== null
                ? `${readNumberFrom(agreement, ['agree_pct'])}%`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </section>
      )}

      {chartSeriesData.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-extrabold text-deep">
            {en.explore.details.heatStress.typicalYear}
          </h3>
          <LineChart
            series={chartSeriesData}
            title={en.explore.details.heatStress.typicalYear}
            unit="°C"
            emptyLabel={en.explore.details.noData}
          />
        </section>
      )}

      {blocks.length > 0 && (
        <section className="flex flex-col gap-2">
          {blocks.map((block, index) => (
            <div key={index} className="rounded-2xl bg-mint-2/50 p-3">
              {block.question && (
                <p className="text-xs font-extrabold text-deep">{block.question}</p>
              )}
              {block.answer && <p className="mt-1 text-xs font-semibold text-ink">{block.answer}</p>}
              {block.note && (
                <p className="mt-1 text-[11px] font-semibold text-ink-soft">{block.note}</p>
              )}
            </div>
          ))}
        </section>
      )}

      <DataLimitationsNotice items={limits} />

      {sources.length > 0 && (
        <section className="flex flex-col gap-1">
          {sources.map((source, index) => (
            <p key={index} className="text-[11px] font-semibold text-ink-soft">
              {source.title}
              {source.detail ? ` — ${source.detail}` : ''}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}
