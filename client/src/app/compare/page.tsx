'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Droplets, Info, Leaf } from 'lucide-react';
import { Banner, Button, Skeleton } from '@/components/ui';
import { ApiError, friendlyMessage } from '@/lib/soilmate/errors';
import { apiFetch } from '@/lib/soilmate/api';
import { choosePlan, fetchRotationPlans, type PlanKey } from '@/lib/compare/api';
import type { Farm, RotationLabPlansResponse } from '@/lib/lab/types';
import { en } from '@/strings/en';

const PLAN_ORDER: PlanKey[] = ['current', 'water_saving', 'soil_health'];
const TITLES: Record<PlanKey, string> = {
  current: 'Your current rotation',
  water_saving: 'Water-saving option',
  soil_health: 'Soil-health option',
};

export default function ComparePage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [plans, setPlans] = useState<RotationLabPlansResponse | null>(null);
  const [choosing, setChoosing] = useState<PlanKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const f = await apiFetch<Farm>('/farm', { auth: 'identity' });
        if (cancelled) return;
        setFarm(f);
        if (!f.centerId) {
          setError('Pick your area in Explore Land and save a rotation before comparing plans.');
          setStatus('ready');
          return;
        }
        const w = f.rotationInput?.winter ?? undefined;
        const s = f.rotationInput?.summer ?? undefined;
        if (!w && !s) {
          setError('Save a rotation in Rotation Lab before comparing plans.');
          setStatus('ready');
          return;
        }
        const p = await fetchRotationPlans({ center: f.centerId, winter: w || undefined, summer: s || undefined });
        if (cancelled) return;
        if (!p?.result?.plans?.current || !p?.result?.plans?.water_saving || !p?.result?.plans?.soil_health) {
          setError('Plan options could not be loaded for the saved rotation. Please try again.');
          setStatus('error');
          return;
        }
        setPlans(p);
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        setError(friendlyMessage(e));
        setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const load = useCallback(async () => {
    // retry helper
    setStatus('loading');
    setError(null);
    try {
      const f = await apiFetch<Farm>('/farm', { auth: 'identity' });
      setFarm(f);
      if (!f.centerId) {
        setError('Pick your area in Explore Land and save a rotation before comparing plans.');
        setStatus('ready');
        return;
      }
      const w = f.rotationInput?.winter ?? undefined;
      const s = f.rotationInput?.summer ?? undefined;
      if (!w && !s) {
        setError('Save a rotation in Rotation Lab before comparing plans.');
        setStatus('ready');
        return;
      }
      const p = await fetchRotationPlans({ center: f.centerId, winter: w || undefined, summer: s || undefined });
      if (!p?.result?.plans?.current || !p?.result?.plans?.water_saving || !p?.result?.plans?.soil_health) {
        setError('Plan options could not be loaded for the saved rotation. Please try again.');
        setStatus('error');
        return;
      }
      setPlans(p);
      setStatus('ready');
    } catch (e) {
      setError(friendlyMessage(e));
      setStatus('error');
    }
  }, []);

  const onChoose = useCallback(async (planKey: PlanKey) => {
    setChoosing(planKey);
    setError(null);
    try {
      await choosePlan(planKey);
      router.push('/dashboard');
    } catch (e) {
      const apiErr = e instanceof ApiError ? e : null;
      if (apiErr?.status === 409) {
        setError(apiErr.message || 'Save a valid rotation before choosing a plan.');
      } else {
        setError(friendlyMessage(e));
      }
    } finally {
      setChoosing(null);
    }
  }, [router]);

  if (status === 'loading') {
    return (
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
        <Skeleton className="h-8 w-64 rounded-card" />
        <Skeleton className="mt-3 h-4 w-96 rounded-card" />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
        <p className="mt-4 text-center text-sm text-ink-soft">{en.ui.loading}</p>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
        <Banner tone="error">{error ?? en.api.generic}</Banner>
        <Button onClick={() => void load()} className="mt-4">Retry</Button>
      </section>
    );
  }

  const canCompare = !!(
    farm?.centerId &&
    (farm.rotationInput?.winter || farm.rotationInput?.summer) &&
    plans?.result?.plans?.current &&
    plans?.result?.plans?.water_saving &&
    plans?.result?.plans?.soil_health
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-deep sm:text-3xl">{en.compare.title}</h1>
        <p className="mt-1 text-base font-medium text-ink-soft">{en.compare.subtitle}</p>
        <p className="mt-2 text-sm font-semibold text-ink-soft">{en.compare.tag}</p>
      </header>

      {error ? <div className="mb-4"><Banner tone="error">{error}</Banner></div> : null}

      {!canCompare ? (
        <div className="space-y-3">
          <Banner tone="info">{error || 'Save your rotation in Rotation Lab to compare plans.'}</Banner>
          <div className="flex flex-wrap gap-2">
            <Button href="/lab">Go to Rotation Lab</Button>
            <Button href="/explore" variant="secondary">Explore Land</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-card bg-mint-1 p-3 text-sm font-semibold text-deep">
            Rotation: <span className="font-extrabold">{plans?.input?.winter ?? '—'}</span> (winter) + <span className="font-extrabold">{plans?.input?.summer ?? '—'}</span> (summer)
            {' · '}Area: {plans?.input?.center ?? farm?.centerId ?? '—'}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {PLAN_ORDER.map((key) => {
              const plan = plans?.result?.plans?.[key];
              if (!plan) return null;
              const n = plan.numbers || {};
              return (
                <div key={key} className="flex h-full flex-col rounded-2xl border-2 border-mint-3 bg-white p-4 shadow-card">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-mint-2 px-2.5 py-1 text-xs font-bold text-deep">{key.replace('_', ' ')}</span>
                    {plan.current_is_best_for_goal ? <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">Best for this goal</span> : null}
                  </div>
                  <h3 className="mt-2 text-xl font-extrabold text-deep">{TITLES[key]}</h3>
                  <p className="mt-1 text-sm font-semibold text-ink-soft">{plan.rotation?.label}</p>
                  {plan.text?.reason ? <p className="mt-2 text-sm text-ink">{plan.text.reason}</p> : null}

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {typeof n.net_water_mm_yr === 'number' && (
                      <div className="rounded-lg bg-mint-1 p-2"><p className="font-bold text-deep">{Math.round(n.net_water_mm_yr)} mm/yr</p><p className="text-ink-soft">Net water need</p></div>
                    )}
                    {typeof n.water_change_vs_current_pct === 'number' && (
                      <div className="rounded-lg bg-mint-1 p-2"><p className="font-bold text-deep">{n.water_change_vs_current_pct > 0 ? '+' : ''}{n.water_change_vs_current_pct}%</p><p className="text-ink-soft">Water vs current</p></div>
                    )}
                    {typeof n.soil_score === 'number' && (
                      <div className="rounded-lg bg-mint-1 p-2"><p className="font-bold text-deep">{n.soil_score >= 0.75 ? 'High' : n.soil_score >= 0.45 ? 'Medium' : 'Low'}</p><p className="text-ink-soft">Soil health</p></div>
                    )}
                    {n.income_level && (
                      <div className="rounded-lg bg-mint-1 p-2"><p className="font-bold capitalize text-deep">{n.income_level}</p><p className="text-ink-soft">Income level</p></div>
                    )}
                    {typeof n.bare_days_yr === 'number' && (
                      <div className="rounded-lg bg-mint-1 p-2"><p className="font-bold text-deep">{n.bare_days_yr} days</p><p className="text-ink-soft">Bare days / yr</p></div>
                    )}
                    {typeof n.overlap_days_yr === 'number' && (
                      <div className="rounded-lg bg-mint-1 p-2"><p className="font-bold text-deep">{n.overlap_days_yr} days</p><p className="text-ink-soft">Overlap / yr</p></div>
                    )}
                  </div>

                  {plan.warnings?.length ? (
                    <div className="mt-3 space-y-1">
                      {plan.warnings.slice(0, 2).map((w, i) => (
                        <p key={i} className="rounded bg-mint-2 px-2 py-1 text-xs font-semibold text-deep">{w.message}</p>
                      ))}
                    </div>
                  ) : null}

                  <details className="mt-3 group">
                    <summary className="cursor-pointer text-sm font-extrabold text-primary">Why this plan?</summary>
                    <div className="mt-3 space-y-3 text-xs">
                      {plan.text?.evidence?.length ? (
                        <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <h4 className="flex items-center gap-2 text-sm font-extrabold text-deep">
                            <span className="grid size-6 place-items-center rounded-full bg-slate-200 text-slate-700" aria-hidden="true"><Info className="size-3.5" /></span>
                            Evidence
                          </h4>
                          <ul className="mt-2 space-y-1.5 pl-1">
                            {plan.text.evidence.map((x, i) => (
                              <li key={i} className="flex gap-2 text-ink">
                                <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate-400" />
                                <span className="font-semibold">{x}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ) : null}
                      {plan.text?.benefits?.length ? (
                        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                          <h4 className="flex items-center gap-2 text-sm font-extrabold text-deep">
                            <span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-700" aria-hidden="true"><Leaf className="size-3.5" /></span>
                            Benefits
                          </h4>
                          <ul className="mt-2 space-y-1.5 pl-1">
                            {plan.text.benefits.map((x, i) => {
                              const water = /\bwater\b|\birrigat|\bmm\b|evap|moisture/i.test(x);
                              const soil = /\bsoil\b|nitrogen|organic|cover|erosion|health|fertil/i.test(x);
                              const tone = water
                                ? 'border-blue-200 bg-blue-50 text-blue-900'
                                : soil
                                  ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                                  : 'border-emerald-100 bg-white/70 text-ink';
                              const Icon = water ? Droplets : Leaf;
                              const iconTone = water ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700';
                              return (
                                <li key={i} className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 ${tone}`}>
                                  <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${iconTone}`} aria-hidden="true"><Icon className="size-3" /></span>
                                  <span className="font-semibold leading-relaxed">{x}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </section>
                      ) : null}
                      {plan.text?.gaps?.length ? (
                        <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <h4 className="flex items-center gap-2 text-sm font-extrabold text-deep">
                            <span className="grid size-6 place-items-center rounded-full bg-slate-200 text-slate-700" aria-hidden="true"><Info className="size-3.5" /></span>
                            Gaps
                          </h4>
                          <ul className="mt-2 space-y-1.5 pl-1">
                            {plan.text.gaps.map((x, i) => (
                              <li key={i} className="flex gap-2 text-ink">
                                <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate-400" />
                                <span className="font-semibold">{x}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ) : null}
                      {plan.text?.risks?.length ? (
                        <section className="rounded-xl border border-red-200 bg-red-50 p-3">
                          <h4 className="flex items-center gap-2 text-sm font-extrabold text-deep">
                            <span className="grid size-6 place-items-center rounded-full bg-red-100 text-red-700" aria-hidden="true"><AlertTriangle className="size-3.5" /></span>
                            Risks
                          </h4>
                          <ul className="mt-2 space-y-1.5 pl-1">
                            {plan.text.risks.map((x, i) => (
                              <li key={i} className="flex items-start gap-2 rounded-lg border border-red-200/70 bg-white/70 px-2.5 py-2 text-red-900">
                                <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-400" />
                                <span className="font-semibold leading-relaxed">{x}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ) : null}
                    </div>
                  </details>

                  <div className="mt-auto pt-4">
                    <Button onClick={() => void onChoose(key)} disabled={!!choosing} className="w-full">
                      {choosing === key ? 'Choosing…' : en.compare.chooseThisPlan}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-xs font-semibold text-ink-soft">Plans are provided by the Rotation Lab data for your saved rotation. Choosing a plan will make it your active plan on the Dashboard.</p>
          <div className="mt-2"><Link href="/lab" className="text-sm font-bold text-primary underline">Back to Rotation Lab</Link></div>
        </>
      )}
    </section>
  );
}
