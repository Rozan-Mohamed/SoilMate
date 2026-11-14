'use client';

import { useMemo, useState } from 'react';
import {
  asRecord,
  readAgreement,
  readCalendar,
  readLimits,
  readNumberFrom,
  readReport,
  readSources,
  readStringFrom,
  readTextBlock,
  readTypicalYear,
  readYearsStrip,
  type CalendarRow,
  type TypicalRow,
} from '@/lib/explore-detail/read';
import type { SoilMoistureResponse } from '@/lib/explore-detail/types';
import { en } from '@/strings/en';
import { DataLimitationsNotice } from './DataLimitationsNotice';

type Props = {
  data: SoilMoistureResponse;
};

/**
 * The colors of the contract for the moisture states (assumption A9: fixed
 * constants, not from the data files). The words always come from the API.
 */
const STATE_COLORS: Record<string, string> = {
  dry: '#D9B26F',
  normal: '#A8D5A2',
  wet: '#8EC5E8',
  no_data: '#CFCFCF',
};

const SOURCE_LABELS: Record<string, string> = {
  sm: en.explore.details.soilMoisture.smapShort,
  model: en.explore.details.soilMoisture.powerShort,
  root: en.explore.details.soilMoisture.rootShort,
};

/**
 * The soil moisture pop-up: the calendar of the months with the SMAP row and
 * the POWER row, the typical year, the strip of the years, the agreement of
 * the two sources and the root zone.
 */
export function SoilMoistureDetail({ data }: Props) {
  const calendar = useMemo(() => readCalendar(data.calendar), [data.calendar]);
  const typicalYear = useMemo(() => readTypicalYear(data.typicalYear), [data.typicalYear]);
  const yearsStrip = useMemo(() => readYearsStrip(data.yearsStrip), [data.yearsStrip]);
  const agreement = readAgreement(data.agreement);
  const report = readReport(asRecord(data.texts)?.report);

  const stateLabels = asRecord(data.labels?.states) ?? {};
  const agreementLevels = asRecord(data.labels?.agreementLevels) ?? {};
  const texts = asRecord(data.texts) ?? {};
  const card = asRecord(data.card) ?? {};

  const word = (state: string | null): string => {
    if (!state) return en.explore.details.soilMoisture.noData;
    return readStringFrom(stateLabels, [state]) ?? state;
  };

  const colorOf = (state: string | null) =>
    state ? (STATE_COLORS[state] ?? STATE_COLORS.no_data) : STATE_COLORS.no_data;

  const years = useMemo(() => {
    const found = calendar.map((row) => row.year).filter((year): year is number => year !== null);
    const unique = Array.from(new Set(found)).sort((a, b) => a - b);

    if (unique.length > 0) return unique;

    return yearsStrip
      .map((entry) => entry.year)
      .filter((year): year is number => year !== null);
  }, [calendar, yearsStrip]);

  const [year, setYear] = useState<number | null>(null);
  const activeYear = year ?? years[years.length - 1] ?? null;

  const monthRows = calendar.filter((row) => row.year === activeYear);

  const agreementWord = agreement?.level
    ? (readStringFrom(agreementLevels, [agreement.level]) ?? agreement.level)
    : null;

  const insight4 = readTextBlock(texts.insight4_satellite_vs_model);
  const agreementNumbers =
    readStringFrom(insight4, ['numbers']) ??
    (agreement?.agreeMonths !== null && agreement?.months !== null && agreement
      ? `${agreement.agreeMonths} of ${agreement.months} months (${agreement.agreePct}%)`
      : null);

  const insightBlocks = [
    readTextBlock(texts.insight1_calendar),
    readTextBlock(texts.insight2_typical_year),
    readTextBlock(texts.insight3_years),
    insight4,
    readTextBlock(texts.insight5_root),
  ].filter((block): block is NonNullable<typeof block> => block !== null);

  const limits = readLimits(data.limits);
  const sources = readSources(data.sources);

  return (
    <div className="flex flex-col gap-4 text-left">
      <section className="flex flex-col gap-2">
        <dl className="grid gap-2 sm:grid-cols-3">
          <Needle
            label={en.explore.details.soilMoisture.smap}
            state={readStringFrom(card, ['sm_state'])}
            needle={readNumberFrom(card, ['sm_needle'])}
            word={word}
            color={colorOf}
          />
          <Needle
            label={en.explore.details.soilMoisture.power}
            state={readStringFrom(card, ['model_state'])}
            needle={readNumberFrom(card, ['model_needle'])}
            word={word}
            color={colorOf}
          />
          <Needle
            label={en.explore.details.soilMoisture.rootShort}
            state={readStringFrom(card, ['root_state'])}
            needle={readNumberFrom(card, ['root_needle'])}
            word={word}
            color={colorOf}
          />
        </dl>

        <p className="text-xs font-semibold text-ink-soft">
          {readStringFrom(asRecord(texts.card), ['last_reading'])}
        </p>
        <p className="text-xs font-semibold text-ink">
          {readStringFrom(asRecord(texts.card), ['satellite_line'])}
        </p>
        <p className="text-xs font-semibold text-ink">
          {readStringFrom(asRecord(texts.card), ['model_line'])}
        </p>
        <p className="text-xs font-semibold text-ink-soft">
          {readStringFrom(asRecord(texts.card), ['last12_line'])}
        </p>
        {readStringFrom(asRecord(texts.card), ['disagree_note']) && (
          <p className="text-xs font-bold text-primary">
            {readStringFrom(asRecord(texts.card), ['disagree_note'])}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-deep">
            {en.explore.details.soilMoisture.calendar}
          </h3>
          {activeYear !== null && (
            <span className="text-xs font-extrabold text-primary">{activeYear}</span>
          )}
        </div>

        {years.length > 1 && (
          <input
            type="range"
            min={years[0]}
            max={years[years.length - 1]}
            step={1}
            value={activeYear ?? years[0]}
            onChange={(event) => setYear(Number(event.target.value))}
            aria-label={en.explore.details.soilMoisture.year}
            className="w-full accent-primary"
          />
        )}

        {monthRows.length === 0 ? (
          <p className="rounded-xl bg-mint-2/70 px-3 py-4 text-center text-xs font-semibold text-ink-soft">
            {en.explore.details.noData}
          </p>
        ) : (
          <ul className="space-y-1">
            {monthRows.map((row, index) => (
              <CalendarLine
                key={`${row.year}-${row.month}-${index}`}
                row={row}
                word={word}
                color={colorOf}
              />
            ))}
          </ul>
        )}
      </section>

      {typicalYear.length > 0 && (
        <TypicalYearGrid rows={typicalYear} />
      )}

      {yearsStrip.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-extrabold text-deep">
            {en.explore.details.soilMoisture.yearsStrip}
          </h3>
          <ul className="flex flex-wrap gap-1">
            {yearsStrip.map((entry, index) => (
              <li
                key={`${entry.label}-${index}`}
                className="flex flex-col items-center rounded-lg border border-mint-3 px-2 py-1"
                title={`${entry.monthsAvailable ?? 0} months`}
              >
                <span className="text-[10px] font-extrabold text-deep">{entry.label}</span>
                <span
                  aria-hidden="true"
                  className="mt-1 h-1.5 w-6 rounded-full"
                  style={{
                    background: entry.partial ? '#c9c9c9' : '#48b080',
                    opacity: entry.monthsAvailable === null ? 1 : 0.35 + 0.65 * Math.min(entry.monthsAvailable / 12, 1),
                  }}
                />
                <span className="mt-0.5 text-[9px] font-bold text-ink-soft">
                  {entry.monthsAvailable ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {agreementWord && (
        <section className="flex flex-col gap-1 rounded-2xl bg-mint-2/70 p-3">
          <h3 className="text-sm font-extrabold text-deep">
            {en.explore.details.soilMoisture.agreement}
          </h3>
          <p className="text-sm font-extrabold text-primary">{agreementWord}</p>
          {agreementNumbers && (
            <p className="text-xs font-semibold text-ink">{agreementNumbers}</p>
          )}
        </section>
      )}

      {report && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-extrabold text-deep">
            {en.explore.details.soilMoisture.summary}
          </h3>

          {report.observed && (
            <ReportBlock label={en.explore.details.soilMoisture.observed} lines={report.observed} />
          )}
          {report.meaning && (
            <ReportBlock label={en.explore.details.soilMoisture.mayMean} lines={report.meaning} />
          )}
          {report.verify && (
            <ReportBlock label={en.explore.details.soilMoisture.toVerify} lines={report.verify} />
          )}
        </section>
      )}

      {insightBlocks.length > 0 && (
        <section className="flex flex-col gap-2">
          {insightBlocks.map((block, index) => (
            <div key={index} className="rounded-2xl bg-mint-2/50 p-3">
              {block.question && (
                <p className="text-xs font-extrabold text-deep">{block.question}</p>
              )}
              {block.answer && <p className="mt-1 text-xs font-semibold text-ink">{block.answer}</p>}
              {block.note && <p className="mt-1 text-[11px] font-semibold text-ink-soft">{block.note}</p>}
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

/** One source of the card: the state word and the needle. */
function Needle({
  label,
  state,
  needle,
  word,
  color,
}: {
  label: string;
  state: string | null;
  needle: number | null;
  word: (state: string | null) => string;
  color: (state: string | null) => string;
}) {
  return (
    <div className="rounded-2xl bg-mint-2/60 p-3">
      <p className="text-[11px] font-extrabold text-ink-soft">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-extrabold text-deep">
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: color(state) }}
        />
        {word(state)}
      </p>
      {needle !== null && (
        <p className="mt-0.5 text-[11px] font-bold text-ink-soft">
          {en.explore.details.soilMoisture.needle}: {needle}
        </p>
      )}
    </div>
  );
}

/** One month of the calendar: the SMAP row and the POWER row. */
function CalendarLine({
  row,
  word,
  color,
}: {
  row: CalendarRow;
  word: (state: string | null) => string;
  color: (state: string | null) => string;
}) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-xl bg-mint-2/40 px-3 py-1.5">
      <span className="text-xs font-bold text-ink-soft">{row.label}</span>

      <span className="flex items-center gap-2">
        <span className="flex items-center gap-1">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full"
            style={{ background: color(row.satellite) }}
          />
          <span className="text-[11px] font-bold text-deep">{word(row.satellite)}</span>
        </span>

        <span className="flex items-center gap-1">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full"
            style={{ background: color(row.model) }}
          />
          <span className="text-[11px] font-bold text-deep">{word(row.model)}</span>
        </span>
      </span>
    </li>
  );
}

/** The typical year: the typical value of every month, per source. */
function TypicalYearGrid({ rows }: { rows: TypicalRow[] }) {
  const sources = Array.from(new Set(rows.map((row) => row.source ?? '')));
  const months = Array.from(new Set(rows.map((row) => row.month ?? 0))).sort(
    (a, b) => a - b,
  );

  const values = rows.map((row) => row.typical).filter((value): value is number => value !== null);
  const max = values.length > 0 ? Math.max(...values) : 100;
  const min = values.length > 0 ? Math.min(...values) : 0;

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-extrabold text-deep">
        {en.explore.details.soilMoisture.typicalYear}
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[18rem] border-collapse text-left">
          <thead>
            <tr>
              <th className="pb-1 pr-2 text-[10px] font-extrabold uppercase tracking-wide text-ink-soft">
                {en.explore.details.soilMoisture.source}
              </th>
              {months.map((month) => (
                <th
                  key={month}
                  scope="col"
                  className="pb-1 pr-1 text-center text-[10px] font-extrabold uppercase tracking-wide text-ink-soft"
                >
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source}>
                <th scope="row" className="py-0.5 pr-2 text-[11px] font-bold text-deep">
                  {SOURCE_LABELS[source] ?? source}
                </th>
                {months.map((month) => {
                  const row = rows.find(
                    (item) => item.month === month && (item.source ?? '') === source,
                  );
                  const value = row?.typical ?? null;
                  const ratio =
                    value === null || max === min ? 0 : (value - min) / (max - min);

                  return (
                    <td key={month} className="px-0.5 py-0.5">
                      <span
                        title={
                          value === null
                            ? en.explore.details.noData
                            : `${value} (${row?.low ?? '—'} – ${row?.high ?? '—'})`
                        }
                        className="grid h-6 min-w-[0.7rem] place-items-center rounded text-[9px] font-extrabold text-deep"
                        style={{
                          background: `rgba(72, 176, 128, ${0.15 + ratio * 0.6})`,
                        }}
                      >
                        {value === null ? '' : Math.round(value)}
                        <span className="sr-only">
                          {value === null
                            ? en.explore.details.noData
                            : `${value} (${row?.low ?? '—'} – ${row?.high ?? '—'})`}
                        </span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] font-semibold text-ink-soft">
        {en.explore.details.soilMoisture.typicalYearNote}
      </p>
    </section>
  );
}

/** One part of the report: the observed, the meaning or the check. */
function ReportBlock({ label, lines }: { label: string; lines: string[] }) {
  return (
    <div className="rounded-xl bg-mint-2/50 px-3 py-2">
      <p className="text-xs font-extrabold text-deep">{label}</p>
      <ul className="mt-1 space-y-0.5">
        {lines.map((line, index) => (
          <li key={index} className="text-xs font-semibold text-ink">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
