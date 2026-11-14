'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Banner, Button, Skeleton } from '@/components/ui';
import { fetchDashboard, type DashboardResponse } from '@/lib/dashboard/api';
import { friendlyMessage } from '@/lib/soilmate/errors';

function fmt(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '—';
  return String(v);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetchDashboard();
        if (!cancelled) setData(resp);
      } catch (e) {
        if (!cancelled) setError(friendlyMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const plan = data?.plan?.plan ?? null;
  const seasonProgress = data?.seasonProgress;

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10 space-y-4">
        <Skeleton className="h-8 w-64 rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
        <Banner tone="error">{error}</Banner>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => window.location.reload()}>Retry</Button>
          <Button href="/explore" variant="secondary">Explore Land</Button>
        </div>
      </section>
    );
  }

  if (!data) return null;

  if (!data.header?.centerId && !data.header?.centerName) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10 space-y-4">
        <Banner tone="info">Pick your area in <Link href="/explore" className="underline">Explore Land</Link> and set up your farm to unlock the dashboard.</Banner>
      </section>
    );
  }

  if (!data.hasActivePlan || !data.plan) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10 space-y-4">
        <header>
          <h1 className="text-3xl font-extrabold text-deep">{data.header.farmName || 'My Farm'}</h1>
          <p className="text-sm font-semibold text-ink-soft">{data.header.locationLabel || [data.header.centerName, data.header.governorate].filter(Boolean).join(' · ')}</p>
        </header>
        <Banner tone="info">Choose a plan to unlock your dashboard. Save a rotation in <Link href="/lab" className="underline">Rotation Lab</Link>, then pick a plan in <Link href="/compare" className="underline">Compare Plans</Link>.</Banner>
        {data.land?.areaWarning ? <p className="text-xs font-semibold text-ink-soft">{data.land.areaWarning}</p> : null}
      </section>
    );
  }

  const rotation = plan?.rotation;
  const numbers = plan?.numbers || {};

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10 space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-deep">{data.header.farmName || 'My Farm'}</h1>
          <p className="text-sm font-semibold text-ink-soft">{data.header.locationLabel || [data.header.centerName, data.header.governorate].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="flex gap-2">
          <Button href="/dashboard/report" variant="secondary">View Report</Button>
          <Button href="/compare" variant="secondary">Change Plan</Button>
        </div>
      </header>

      <div className="rounded-card bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Active plan</p>
            <h2 className="text-xl font-extrabold text-deep">{(data.plan.planKey || '').replace('_', ' ')}{rotation?.label ? ` · ${rotation.label}` : ''}</h2>
            {plan?.text?.reason ? <p className="mt-1 text-sm font-semibold text-ink-soft">{plan.text.reason}</p> : null}
          </div>
          {data.plan.startDate ? <p className="text-xs font-semibold text-ink-soft">Start: {data.plan.startDate}</p> : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {typeof numbers.net_water_mm_yr === 'number' && <div className="rounded-lg bg-mint-1 p-3"><p className="text-lg font-extrabold text-deep">{Math.round(numbers.net_water_mm_yr)} mm/yr</p><p className="text-xs text-ink-soft">Net water need</p></div>}
          {typeof numbers.soil_score === 'number' && <div className="rounded-lg bg-mint-1 p-3"><p className="text-lg font-extrabold text-deep">{numbers.soil_score >= 0.75 ? 'High' : numbers.soil_score >= 0.45 ? 'Medium' : 'Low'}</p><p className="text-xs text-ink-soft">Soil health</p></div>}
          {numbers.income_level && <div className="rounded-lg bg-mint-1 p-3"><p className="text-lg font-extrabold capitalize text-deep">{fmt(numbers.income_level)}</p><p className="text-xs text-ink-soft">Income level</p></div>}
          {typeof numbers.bare_days_yr === 'number' && <div className="rounded-lg bg-mint-1 p-3"><p className="text-lg font-extrabold text-deep">{fmt(numbers.bare_days_yr)} days</p><p className="text-xs text-ink-soft">Bare days / year</p></div>}
        </div>
      </div>

      <div className="rounded-card bg-card p-4 shadow-card sm:p-5">
        <h2 className="text-lg font-extrabold text-deep">Season progress</h2>
        {seasonProgress ? (
          <div className="mt-3 grid gap-2 text-sm font-semibold text-ink-soft sm:grid-cols-2 lg:grid-cols-3">
            <p className="rounded-lg bg-mint-1 px-3 py-2">State: <span className="text-deep">{seasonProgress.state}</span>{seasonProgress.isEstimate ? ' (estimate)' : ''}</p>
            {seasonProgress.seasonLabel ? <p className="rounded-lg bg-mint-1 px-3 py-2">Season: <span className="text-deep">{seasonProgress.seasonLabel}</span></p> : null}
            {seasonProgress.cropName ? <p className="rounded-lg bg-mint-1 px-3 py-2">Crop: <span className="text-deep">{seasonProgress.cropName}</span></p> : null}
            {typeof seasonProgress.percent === 'number' ? <p className="rounded-lg bg-mint-1 px-3 py-2">Progress: <span className="text-deep">{Math.round(seasonProgress.percent)}%</span></p> : null}
            {typeof seasonProgress.dayInSeason === 'number' && typeof seasonProgress.daysInSeason === 'number' ? <p className="rounded-lg bg-mint-1 px-3 py-2">Day: <span className="text-deep">{seasonProgress.dayInSeason} / {seasonProgress.daysInSeason}</span></p> : null}
          </div>
        ) : <p className="mt-2 text-sm text-ink-soft">No progress data.</p>}
      </div>

      {data.land ? (
        <div className="rounded-card bg-card p-4 shadow-card space-y-3">
          <h2 className="text-lg font-extrabold text-deep">Land & area data</h2>
          {data.land.areaWarning ? <p className="text-xs font-semibold text-ink-soft">{data.land.areaWarning}</p> : null}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs text-ink-soft">
            <div className="rounded-lg bg-mint-1 p-2"><p className="font-bold text-deep">Crop health</p><p>Through: {fmt(data.land.dataThrough?.cropHealth)}</p></div>
            <div className="rounded-lg bg-mint-1 p-2"><p className="font-bold text-deep">Soil moisture</p><p>Through: {fmt(data.land.dataThrough?.soilMoisture)}</p></div>
            <div className="rounded-lg bg-mint-1 p-2"><p className="font-bold text-deep">Heat (weather)</p><p>Through: {fmt(data.land.dataThrough?.heatWeather)}</p></div>
            <div className="rounded-lg bg-mint-1 p-2"><p className="font-bold text-deep">Heat (satellite)</p><p>Through: {fmt(data.land.dataThrough?.heatSatellite)}</p></div>
          </div>

          {data.land.soilMoisture ? (() => {
            const sm = data.land.soilMoisture as Record<string, unknown>;
            const texts = (sm.texts as Record<string, unknown> | undefined) ?? undefined;
            const sat = sm.satellite as Record<string, unknown> | undefined;
            const mod = sm.model as Record<string, unknown> | undefined;
            const root = sm.rootZone as Record<string, unknown> | undefined;
            return (
              <div className="rounded-lg bg-mint-1 p-3 text-sm">
                <p className="font-extrabold text-deep">Soil moisture</p>
                <p className="mt-1 text-xs text-ink-soft">Satellite: {fmt(sat?.label)} · Model: {fmt(mod?.label)} · Root zone: {fmt(root?.label)}</p>
                {texts?.satelliteLine ? <p className="mt-1 text-xs text-ink-soft">{fmt(texts.satelliteLine)}</p> : null}
                {texts?.modelLine ? <p className="text-xs text-ink-soft">{fmt(texts.modelLine)}</p> : null}
                {texts?.last12Line ? <p className="text-xs text-ink-soft">{fmt(texts.last12Line)}</p> : null}
              </div>
            );
          })() : null}

          {data.land.landRisk ? (() => {
            const lr = data.land.landRisk as Record<string, unknown>;
            return (
              <div className="rounded-lg bg-mint-1 p-3 text-sm">
                <p className="font-extrabold text-deep">{fmt(lr.title || 'Land risk')}</p>
                <p className="text-xs text-ink-soft">Score: {fmt(lr.score)} · Level: {fmt(lr.level)}</p>
                {lr.notice ? <p className="mt-1 text-xs text-ink-soft">{fmt(lr.notice)}</p> : null}
              </div>
            );
          })() : null}
        </div>
      ) : null}

      {plan?.warnings?.length ? (
        <div className="rounded-card border border-amber-200 bg-amber-50 p-4 shadow-card">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700" aria-hidden="true">
              <AlertTriangle className="size-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold text-deep">Warnings &amp; notes</h2>
              <ul className="mt-2 space-y-2 text-sm text-ink">
                {plan.warnings.map((w, i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span className="font-semibold text-deep/90">{w.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {plan?.text ? (
        <div className="rounded-card bg-card p-4 shadow-card space-y-3">
          <h2 className="text-lg font-extrabold text-deep">Plan details</h2>
          {plan.text.benefits?.length ? <div><p className="font-bold text-deep">Benefits</p><ul className="list-disc pl-5 text-sm text-ink-soft">{plan.text.benefits.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null}
          {plan.text.gaps?.length ? <div><p className="font-bold text-deep">Information gaps</p><ul className="list-disc pl-5 text-sm text-ink-soft">{plan.text.gaps.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null}
          {plan.text.risks?.length ? <div><p className="font-bold text-deep">Risks to review</p><ul className="list-disc pl-5 text-sm text-ink-soft">{plan.text.risks.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null}
        </div>
      ) : null}
    </section>
  );
}
