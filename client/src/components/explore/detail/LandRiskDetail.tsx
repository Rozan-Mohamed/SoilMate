'use client';

import {
  asRecord,
  readIndicators,
  readReport,
  readRiskPoint,
  readStatusColor,
  readStringFrom,
} from '@/lib/explore-detail/read';
import type { LandRiskResponse } from '@/lib/explore-detail/types';
import { en } from '@/strings/en';

type Props = {
  data: LandRiskResponse;
};

/**
 * The land risk pop-up: the four signs of the screening and the report of the
 * data team. The score is a screening result, never a diagnosis.
 */
export function LandRiskDetail({ data }: Props) {
  const point = asRecord(data.point) ?? {};
  const risk = readRiskPoint(point);
  const indicators = readIndicators(point);
  const report = readReport(point.report);
  const method = asRecord(data.method) ?? {};

  const catalog = Array.isArray(data.chartCatalog) ? data.chartCatalog : [];

  return (
    <div className="flex flex-col gap-4 text-left">
      {risk && (risk.score !== null || risk.level) && (
        <section className="flex flex-col gap-2 rounded-2xl bg-mint-2/70 p-3">
          <h3 className="text-sm font-extrabold text-deep">
            {en.explore.details.landRisk.score}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-deep">
              {risk.score === null ? '—' : risk.score}
            </span>
            {risk.scaleMax !== null && (
              <span className="text-xs font-bold text-ink-soft">
                {en.explore.details.landRisk.outOf(risk.scaleMax, risk.scaleMin ?? 1)}
              </span>
            )}
          </div>
          {risk.level && <p className="text-sm font-extrabold text-primary">{risk.level}</p>}

          {readStringFrom(method, ['risk_score']) && (
            <p className="text-[11px] font-semibold text-ink-soft">
              {readStringFrom(method, ['risk_score'])}
            </p>
          )}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-extrabold text-deep">
          {en.explore.details.landRisk.signs}
        </h3>

        {indicators.length === 0 ? (
          <p className="rounded-xl bg-mint-2/70 px-3 py-6 text-center text-xs font-semibold text-ink-soft">
            {en.explore.details.noData}
          </p>
        ) : (
          <ul className="space-y-2">
            {indicators.map((indicator) => {
              const statusColor = readStatusColor(data.statusColors, indicator.status);

              return (
                <li key={indicator.id} className="rounded-xl bg-mint-2/50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-deep">
                      {indicator.label || indicator.question}
                    </span>
                    {indicator.status && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white"
                        style={{ background: statusColor ?? '#006c4a' }}
                      >
                        {indicator.status}
                      </span>
                    )}
                  </div>
                  {indicator.question && indicator.label && (
                    <p className="mt-0.5 text-[11px] font-semibold text-ink-soft">
                      {indicator.question}
                    </p>
                  )}
                  {indicator.text && (
                    <p className="mt-1 text-xs font-semibold text-ink">{indicator.text}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {report && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-extrabold text-deep">
            {en.explore.details.landRisk.report}
          </h3>

          {report.summary && (
            <p className="rounded-xl bg-mint-2/50 px-3 py-2 text-xs font-extrabold text-deep">
              {report.summary}
            </p>
          )}

          {report.observed.length > 0 && (
            <ReportBlock label={en.explore.details.landRisk.observed} lines={report.observed} />
          )}
          {report.meaning.length > 0 && (
            <ReportBlock label={en.explore.details.landRisk.meaning} lines={report.meaning} />
          )}
          {report.verify.length > 0 && (
            <ReportBlock label={en.explore.details.landRisk.verify} lines={report.verify} />
          )}

          {report.confidence && (
            <p className="text-[11px] font-semibold text-ink-soft">
              {en.explore.details.landRisk.confidence}: {report.confidence}
            </p>
          )}
        </section>
      )}

      {readStringFrom(method, ['scoring']) && (
        <p className="text-[11px] font-semibold text-ink-soft">
          {en.explore.details.landRisk.method}: {readStringFrom(method, ['scoring'])}
        </p>
      )}

      {catalog.length > 0 && (
        <section className="flex flex-col gap-1">
          <h3 className="text-xs font-extrabold text-deep">
            {en.explore.details.landRisk.charts}
          </h3>
          <ul className="space-y-0.5">
            {catalog.map((entry, index) => {
              const record = asRecord(entry);
              const title = readStringFrom(record, ['title', 'label', 'name']) ?? '';

              return (
                <li key={index} className="text-[11px] font-semibold text-ink-soft">
                  {title}
                  {readStringFrom(record, ['subtitle']) ? ` — ${readStringFrom(record, ['subtitle'])}` : ''}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

/** One part of the report. */
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
