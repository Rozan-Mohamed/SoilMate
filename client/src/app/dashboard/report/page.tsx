'use client';

import { useEffect, useState } from 'react';
import { Banner, Button, Skeleton } from '@/components/ui';
import { fetchReportSummary, type ReportResponse } from '@/lib/dashboard/api';
import { friendlyMessage } from '@/lib/soilmate/errors';

export default function ReportPage() {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetchReportSummary();
        if (!cancelled) setReport(resp);
      } catch (e) {
        if (!cancelled) setError(friendlyMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:py-10 space-y-4">
        <Skeleton className="h-8 w-64 rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:py-10">
        <Banner tone="error">{error}</Banner>
        <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
      </section>
    );
  }

  if (!report) return null;

  const sm = report.soilMoistureReport;
  const lr = report.landRiskReport;
  const plan = report.plan?.plan;

  return (
    <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:py-10 space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-deep">Farm Report</h1>
          <p className="text-sm font-semibold text-ink-soft">
            Generated: {new Date(report.generatedAt).toLocaleString()} {report.center ? `· ${report.center.name}` : ''}
          </p>
        </div>
        <Button onClick={() => window.print()}>Print</Button>
      </header>

      {sm ? (
        <div className="rounded-card bg-card p-4 shadow-card space-y-3">
          <h2 className="text-xl font-extrabold text-deep">Soil moisture</h2>
          <div><p className="font-bold text-deep">What we observed</p><p className="text-sm text-ink-soft">{sm.observed}</p></div>
          <div><p className="font-bold text-deep">What it might mean</p><p className="text-sm text-ink-soft">{sm.may_mean}</p></div>
          <div><p className="font-bold text-deep">What to check on your land</p><p className="text-sm text-ink-soft">{sm.to_verify}</p></div>
        </div>
      ) : null}

      {lr ? (
        <div className="rounded-card bg-card p-4 shadow-card space-y-3">
          <h2 className="text-xl font-extrabold text-deep">Land risk</h2>
          {lr.summary ? <p className="text-sm font-semibold text-ink-soft">{lr.summary}</p> : null}
          {lr.observed?.length ? <div><p className="font-bold text-deep">Observed</p><ul className="list-disc pl-5 text-sm text-ink-soft">{lr.observed.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null}
          {lr.meaning?.length ? <div><p className="font-bold text-deep">What it might mean</p><ul className="list-disc pl-5 text-sm text-ink-soft">{lr.meaning.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null}
          {lr.verify?.length ? <div><p className="font-bold text-deep">What to check</p><ul className="list-disc pl-5 text-sm text-ink-soft">{lr.verify.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null}
          {lr.confidence ? <p className="text-xs font-semibold text-ink-soft">Confidence: {lr.confidence}</p> : null}
        </div>
      ) : null}

      {report.plan ? (
        <div className="rounded-card bg-card p-4 shadow-card space-y-3">
          <h2 className="text-xl font-extrabold text-deep">Active plan</h2>
          <p className="text-sm font-semibold text-ink-soft">{(report.plan.planKey || '').replace('_', ' ')} {plan?.rotation?.label ? `· ${plan.rotation.label}` : ''}</p>
          {plan?.text?.reason ? <p className="text-sm text-ink-soft">{plan.text.reason}</p> : null}
          {plan?.text?.benefits?.length ? <div><p className="font-bold text-deep">Benefits</p><ul className="list-disc pl-5 text-sm text-ink-soft">{plan.text.benefits.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null}
          {plan?.text?.gaps?.length ? <div><p className="font-bold text-deep">Information gaps</p><ul className="list-disc pl-5 text-sm text-ink-soft">{plan.text.gaps.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null}
          {plan?.text?.risks?.length ? <div><p className="font-bold text-deep">Risks to review</p><ul className="list-disc pl-5 text-sm text-ink-soft">{plan.text.risks.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null}
        </div>
      ) : (
        <Banner tone="info">No active plan chosen yet. Choose a plan in Compare Plans to include it in your report.</Banner>
      )}

      {report.disclaimer ? <p className="text-xs font-semibold text-ink-soft">{report.disclaimer}</p> : null}
    </section>
  );
}
