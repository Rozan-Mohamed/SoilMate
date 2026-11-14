'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Sprout } from 'lucide-react';
import { Banner, Button, Skeleton, Spinner } from '@/components/ui';
import { ApiError, friendlyMessage } from '@/lib/soilmate/errors';
import {
  fetchFarm,
  fetchRotationLabOptions,
  lookupRotationLabPlans,
  saveFarmRotation,
} from '@/lib/lab/api';
import type {
  Farm,
  RotationLabOptionsResponse,
  RotationLabPlan,
  RotationLabPlansResponse,
} from '@/lib/lab/types';
import {
  LAB_SEASONS,
  canSubmitRotation,
  cropForSeason,
  emptyLabSelection,
  rotationBody,
  type LabSelection,
} from '@/lib/lab/validation';
import { en } from '@/strings/en';
import { LabSeasonCard } from './LabSeasonCard';

type Status = 'loading' | 'ready' | 'error';

const PLAN_ORDER: Array<RotationLabPlan['plan_type']> = ['current', 'water_saving', 'soil_health'];
const PLAN_TITLES: Record<string, string> = {
  current: 'Your current rotation',
  water_saving: 'Water-saving option',
  soil_health: 'Soil-health option',
};

function PlanCard({ plan, title }: { plan: RotationLabPlan; title: string }) {
  const n = plan.numbers || {};
  return (
    <div className="rounded-2xl border-2 border-mint-3 bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-extrabold text-deep">{title}</h3>
          <p className="mt-0.5 text-sm font-semibold text-ink-soft">{plan.rotation?.label}</p>
        </div>
        {plan.current_is_best_for_goal ? (
          <span className="rounded-full bg-mint-2 px-2.5 py-1 text-xs font-bold text-primary">Best for this goal</span>
        ) : null}
        {plan.tags?.comparison_only ? (
          <span className="rounded-full bg-mint-2 px-2.5 py-1 text-xs font-bold text-deep">Shown for comparison</span>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        {typeof n.net_water_mm_yr === 'number' && (
          <div className="rounded-lg bg-mint-1 p-2"><p className="font-bold text-deep">{Math.round(n.net_water_mm_yr)} mm/yr</p><p className="text-ink-soft">Net water need</p></div>
        )}
        {typeof n.water_change_vs_current_pct === 'number' && (
          <div className="rounded-lg bg-mint-1 p-2"><p className="font-bold text-deep">{n.water_change_vs_current_pct > 0 ? '+' : ''}{n.water_change_vs_current_pct}%</p><p className="text-ink-soft">vs current water</p></div>
        )}
        {typeof n.soil_score === 'number' && (
          <div className="rounded-lg bg-mint-1 p-2"><p className="font-bold text-deep">{n.soil_score >= 0.75 ? 'High' : n.soil_score >= 0.45 ? 'Medium' : 'Low'}</p><p className="text-ink-soft">Soil health</p></div>
        )}
        {typeof n.overlap_days_yr === 'number' && (
          <div className="rounded-lg bg-mint-1 p-2"><p className="font-bold text-deep">{n.overlap_days_yr} days</p><p className="text-ink-soft">Overlap / year</p></div>
        )}
        {typeof n.bare_days_yr === 'number' && (
          <div className="rounded-lg bg-mint-1 p-2"><p className="font-bold text-deep">{n.bare_days_yr} days</p><p className="text-ink-soft">Bare / year</p></div>
        )}
        {n.income_level && (
          <div className="rounded-lg bg-mint-1 p-2"><p className="font-bold text-deep capitalize">{n.income_level}</p><p className="text-ink-soft">Income level</p></div>
        )}
      </div>

      {plan.text?.reason && <p className="mt-3 text-sm font-semibold text-ink">{plan.text.reason}</p>}

      {plan.warnings?.length ? (
        <div className="mt-3 space-y-1">
          {plan.warnings.map((w, i) => (
            <p key={i} className="rounded-lg bg-mint-2 px-2 py-1.5 text-xs font-semibold text-deep">{w.message}</p>
          ))}
        </div>
      ) : null}

      {(plan.text?.benefits?.length || plan.text?.gaps?.length || plan.text?.risks?.length) ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-bold text-primary">Details</summary>
          <div className="mt-2 space-y-2 text-xs text-ink-soft">
            {plan.text?.benefits?.length ? (
              <div><p className="font-bold text-deep">Benefits</p><ul className="mt-1 list-disc pl-4">{plan.text.benefits.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
            ) : null}
            {plan.text?.gaps?.length ? (
              <div><p className="font-bold text-deep">Information gaps</p><ul className="mt-1 list-disc pl-4">{plan.text.gaps.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
            ) : null}
            {plan.text?.risks?.length ? (
              <div><p className="font-bold text-deep">Risks to review</p><ul className="mt-1 list-disc pl-4">{plan.text.risks.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
            ) : null}
          </div>
        </details>
      ) : null}
    </div>
  );
}

export function LabView() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [options, setOptions] = useState<RotationLabOptionsResponse | null>(null);
  const [selection, setSelection] = useState<LabSelection>(emptyLabSelection());
  const [plans, setPlans] = useState<RotationLabPlansResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [f, o] = await Promise.all([fetchFarm(), fetchRotationLabOptions()]);
        if (cancelled) return;
        setFarm(f);
        setOptions(o);
        const ri = (f.rotationInput || {}) as { winter?: string | null; summer?: string | null };
        setSelection({ winter: ri.winter ?? null, summer: ri.summer ?? null });
        if (f.centerId && (ri.winter || ri.summer)) {
          try {
            const p = await lookupRotationLabPlans({
              center: f.centerId,
              winter: ri.winter ?? undefined,
              summer: ri.summer ?? undefined,
            });
            if (!cancelled) {
              if (p?.result?.plans?.current && p?.result?.plans?.water_saving && p?.result?.plans?.soil_health) {
                setPlans(p);
              } else {
                setPlans(null);
              }
            }
          } catch {
            if (!cancelled) setPlans(null);
          }
        }
        if (!cancelled) setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        const apiErr = e instanceof ApiError ? e : null;
        if (apiErr?.status === 409) {
          router.push('/explore');
          return;
        }
        setError(friendlyMessage(e));
        setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const load = useCallback(async () => {
    // retry helper
    setStatus('loading');
    setError(null);
    try {
      const [f, o] = await Promise.all([fetchFarm(), fetchRotationLabOptions()]);
      setFarm(f);
      setOptions(o);
      const ri = (f.rotationInput || {}) as { winter?: string | null; summer?: string | null };
      setSelection({ winter: ri.winter ?? null, summer: ri.summer ?? null });
      if (f.centerId && (ri.winter || ri.summer)) {
        try {
          const p = await lookupRotationLabPlans({
            center: f.centerId,
            winter: ri.winter ?? undefined,
            summer: ri.summer ?? undefined,
          });
          if (p?.result?.plans?.current && p?.result?.plans?.water_saving && p?.result?.plans?.soil_health) {
            setPlans(p);
          } else {
            setPlans(null);
          }
        } catch {
          setPlans(null);
        }
      }
      setStatus('ready');
    } catch (e) {
      const apiErr = e instanceof ApiError ? e : null;
      if (apiErr?.status === 409) {
        router.push('/explore');
        return;
      }
      setError(friendlyMessage(e));
      setStatus('error');
    }
  }, [router]);

  const centerId = farm?.centerId ?? null;
  const canSubmit = canSubmitRotation(selection) && !!centerId;

  // Fetch plans for the exact current selection whenever it changes to a valid,
  // comparable rotation. This ensures alternatives are input-dependent and never
  // displayed for a previous selection.
  useEffect(() => {
    if (status !== 'ready' || !centerId) return;
    if (!canSubmitRotation(selection)) return;

    const requestKey = `${centerId}|${selection.winter ?? ''}|${selection.summer ?? ''}`;
    let cancelled = false;
    void (async () => {
      try {
        const p = await lookupRotationLabPlans({
          center: centerId,
          winter: selection.winter ?? undefined,
          summer: selection.summer ?? undefined,
        });
        if (cancelled) return;
        // Ignore stale responses that do not match the selection this request was made for.
        if (`${centerId}|${selection.winter ?? ''}|${selection.summer ?? ''}` !== requestKey) return;
        if (p?.result?.plans?.current && p?.result?.plans?.water_saving && p?.result?.plans?.soil_health) {
          setPlans(p);
        } else {
          setPlans(null);
        }
      } catch {
        if (!cancelled) setPlans(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, centerId, selection]);

  const displayPlans =
    status === 'ready' && centerId && canSubmitRotation(selection) ? plans : null;

  const onSubmit = useCallback(async () => {
    if (!centerId) {
      setError('Pick your area in Explore Land before saving a rotation.');
      return;
    }
    if (!canSubmitRotation(selection)) {
      setError(options?.rules.invalidMessage || 'Please select at least one crop for your current rotation.');
      return;
    }
    setBusy(true);
    setError(null);
    setSaveMsg(null);
    try {
      const updatedFarm = await saveFarmRotation(rotationBody(selection));
      setFarm(updatedFarm);
      const p = await lookupRotationLabPlans({
        center: centerId,
        winter: selection.winter ?? undefined,
        summer: selection.summer ?? undefined,
      });
      if (p?.result?.plans?.current && p?.result?.plans?.water_saving && p?.result?.plans?.soil_health) {
        setPlans(p);
        setSaveMsg('Rotation saved.');
      } else {
        setPlans(null);
        setError('Rotation saved, but the plan options could not be loaded. Please try again.');
      }
      try { sessionStorage.setItem('soilmate:rotationSaved', '1'); } catch {}
    } catch (e) {
      setError(friendlyMessage(e));
    } finally {
      setBusy(false);
    }
  }, [centerId, options, selection]);

  const winterCrop = useMemo(
    () => cropForSeason('winter', selection.winter, options?.winterCrops ?? [], options?.summerCrops ?? []),
    [selection.winter, options],
  );
  const summerCrop = useMemo(
    () => cropForSeason('summer', selection.summer, options?.winterCrops ?? [], options?.summerCrops ?? []),
    [selection.summer, options],
  );

  if (status === 'loading') {
    return (
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
        <Skeleton className="h-8 w-64 rounded-card" />
        <Skeleton className="mt-3 h-4 w-96 rounded-card" />
        <div className="mt-6 space-y-4"><Skeleton className="h-56 w-full rounded-card" /><Skeleton className="h-48 w-full rounded-card" /></div>
        <p className="mt-4 text-center text-sm text-ink-soft">{en.lab.loading}</p>
      </section>
    );
  }

  if (status === 'error' || !options || !farm) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
        <Banner tone="error">{error ?? en.api.generic}</Banner>
        <Button onClick={() => void load()} className="mt-4">Retry</Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <header>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <Sprout className="size-3.5" aria-hidden="true" />
          {en.lab.tag}
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-deep sm:text-4xl">{en.lab.title}</h1>
        <p className="mt-2 max-w-2xl text-base font-semibold text-ink-soft">{en.lab.subtitle}</p>
        {options.disclaimer ? <p className="mt-2 text-xs font-semibold text-ink-soft">{options.disclaimer}</p> : null}
      </header>

      {!centerId ? (
        <div className="mt-4"><Banner tone="info">Pick your area in <Link href="/explore" className="underline">Explore Land</Link> before saving a rotation.</Banner></div>
      ) : null}

      <div className="mt-4 rounded-card bg-card px-4 py-3 shadow-card sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-extrabold text-deep">{en.lab.fieldTitle}</span>
            <span className="text-ink-soft">
              <span className="font-bold text-deep">Area:</span> {farm.centerId ?? 'Not selected'}
            </span>
            <span className="text-ink-soft">
              <span className="font-bold text-deep">Saved rotation:</span>{' '}
              {farm.rotationInput?.winter || '—'} / {farm.rotationInput?.summer || '—'}
            </span>
          </div>
          <Link href="/farm" className="shrink-0 text-xs font-extrabold text-primary underline decoration-2 underline-offset-4">{en.lab.goalsEdit}</Link>
        </div>
        {farm.priorities?.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {farm.priorities.map((p) => (
              <span key={p} className="rounded-full border border-mint-3 bg-mint-1 px-2.5 py-1 text-[11px] font-bold text-deep">{p}</span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-5 rounded-card bg-card p-4 shadow-card sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-deep sm:text-xl">{en.lab.planTitle}</h2>
            <p className="mt-1 text-xs font-semibold text-ink-soft sm:text-sm">Choose one crop per season (or leave fallow). At least one crop is required. Drag crops into the season slots or tap to select.</p>
          </div>
        </div>
        <ul className="mt-4 grid gap-4 lg:grid-cols-2 lg:gap-5">
          {LAB_SEASONS.map((season) => (
            <LabSeasonCard
              key={season}
              season={season}
              crop={season === 'winter' ? winterCrop : summerCrop}
              options={season === 'winter' ? options.winterCrops : options.summerCrops}
              disabled={busy}
              onClear={() => {
                setSelection((c) => ({ ...c, [season]: null }));
                setPlans(null);
                setSaveMsg(null);
              }}
              onSelect={(id) => {
                setSelection((c) => ({ ...c, [season]: id }));
                setPlans(null);
                setSaveMsg(null);
              }}
            />
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-mint-3 pt-4">
          <Button onClick={() => void onSubmit()} disabled={!canSubmit || busy} iconRight={<ArrowRight className="size-4" aria-hidden="true" />}>
            {busy ? 'Saving…' : en.lab.submitButton}
          </Button>
          {busy ? <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft"><Spinner size="sm" />{en.ui.loading}</span> : null}
          {saveMsg ? <span className="text-sm font-bold text-primary">{saveMsg}</span> : null}
        </div>
      </div>

      {error ? <div className="mt-4"><Banner tone="error">{error}</Banner></div> : null}

      {displayPlans?.result?.plans?.current && displayPlans?.result?.plans?.water_saving && displayPlans?.result?.plans?.soil_health ? (
        <div className="mt-6 space-y-4">
          <h2 className="text-xl font-extrabold text-deep">Rotation options for your farm</h2>
          <div className="grid gap-4 lg:grid-cols-1">
            {PLAN_ORDER.map((k) => {
              const plan = displayPlans.result.plans[k];
              return plan ? <PlanCard key={k} plan={plan} title={PLAN_TITLES[k] || k} /> : null;
            })}
          </div>
          <p className="text-xs font-semibold text-ink-soft">{options.disclaimer}</p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <Button onClick={() => router.push('/farm')} variant="secondary" iconLeft={<ArrowLeft className="size-4" aria-hidden="true" />}>{en.lab.backToFarm}</Button>
        <Button href="/compare" iconRight={<ArrowRight className="size-4" aria-hidden="true" />}>{en.lab.compare}</Button>
      </div>
    </section>
  );
}
