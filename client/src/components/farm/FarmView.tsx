'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, MapPin, Save } from 'lucide-react';
import { Banner, Button, Skeleton } from '@/components/ui';
import { useJourney } from '@/providers/JourneyProvider';
import { ApiError, friendlyMessage } from '@/lib/soilmate/errors';
import type {
  Crop,
  Equipment,
  Farm,
  MetaOptions,
  Priority,
  SoilType,
  WaterAvailability,
  WaterSource,
} from '@/lib/soilmate/types';
import {
  fetchCurrentCrops,
  fetchFarm,
  fetchOptions,
  saveFarm,
} from '@/lib/farm/api';
import {
  emptyFarmForm,
  errorsFromIssues,
  farmFormFrom,
  isFarmFormComplete,
  toFarmPayload,
  toggleValue,
  validateFarmForm,
  MAX_CROPS,
} from '@/lib/farm/validation';
import type { FarmErrors, FarmForm } from '@/lib/farm/types';
import { en } from '@/strings/en';
import { FarmCropsSection } from './FarmCropsSection';
import { FarmEquipmentSection } from './FarmEquipmentSection';
import { FarmPrioritiesSection } from './FarmPrioritiesSection';
import { FarmSeasonsSection } from './FarmSeasonsSection';
import { FarmSoilSection } from './FarmSoilSection';
import { FarmWaterSection } from './FarmWaterSection';

type Status = 'loading' | 'ready' | 'error';

type Loaded = {
  farm: Farm;
  options: MetaOptions;
  crops: Crop[];
};

/**
 * My Farm — "Tell Us About Your Farm" (Stage 5).
 *
 * Every label of the form comes from GET /meta/options and GET /crops, and
 * the saved answers come from GET /farm. Nothing is preselected unless the
 * API sent it.
 */
export function FarmView() {
  const router = useRouter();
  const { refresh } = useJourney();

  const [status, setStatus] = useState<Status>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const [form, setForm] = useState<FarmForm>(emptyFarmForm());
  const [errors, setErrors] = useState<FarmErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [unknownCrops, setUnknownCrops] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [needsArea, setNeedsArea] = useState(false);

  const fetchFarmData = useCallback(async () => {
    const [farm, options, cropResponse] = await Promise.all([
      fetchFarm(),
      fetchOptions(),
      fetchCurrentCrops(),
    ]);

    return { farm, options, crops: cropResponse.crops };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchFarmData();
        if (cancelled) return;

        setLoaded({
          farm: data.farm,
          options: data.options,
          crops: data.crops,
        });
        setForm(farmFormFrom(data.farm));
        setNeedsArea(data.farm.centerId === null);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setLoadError(friendlyMessage(err));
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchFarmData]);

  const change = useCallback(
    <K extends keyof FarmForm>(field: K, value: FarmForm[K]) => {
      setForm((current) => ({ ...current, [field]: value }));
      setErrors((current) => {
        if (!(field in current)) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
    },
    [],
  );

  const onToggleCrop = useCallback(
    (cropId: string) => {
      setForm((current) => ({
        ...current,
        currentCrops:
          current.currentCrops.length >= MAX_CROPS && !current.currentCrops.includes(cropId)
            ? current.currentCrops
            : toggleValue(current.currentCrops, cropId),
      }));
    },
    [],
  );

  const onToggleEquipment = useCallback((value: Equipment) => {
    setForm((current) => ({ ...current, equipment: toggleValue(current.equipment, value) }));
  }, []);

  const onTogglePriority = useCallback((value: Priority) => {
    setForm((current) => {
      const max = loaded?.options.limits.maxPriorities ?? 3;
      if (current.priorities.length >= max && !current.priorities.includes(value)) {
        return current;
      }
      return { ...current, priorities: toggleValue(current.priorities, value) };
    });
  }, [loaded]);

  const complete = useMemo(() => isFarmFormComplete(form), [form]);

  const onSubmit = useCallback(async () => {
    if (!loaded) return;

    const validation = validateFarmForm(form, loaded.options);
    setErrors(validation);
    setSaveError(null);
    setUnknownCrops([]);

    if (Object.keys(validation).length > 0) return;

    const payload = toFarmPayload(form);
    if (!payload) return;

    setSaving(true);

    try {
      const farm = await saveFarm(payload);
      setSaved(true);
      await refresh();

      if (farm.setupStatus === 'complete') {
        router.push('/lab');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        // 400: the message of the API belongs under its section.
        const fieldErrors = errorsFromIssues(err.issues);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          setSaveError(en.farm.saveFailed);
          setSaving(false);
          return;
        }

        // 422: a crop is gone. Nothing was saved.
        if (err.code === 'UNKNOWN_CROP') {
          const ids = readUnknownIds(err.details);
          setUnknownCrops(ids);
          setForm((current) => ({
            ...current,
            currentCrops: current.currentCrops.filter((id) => !ids.includes(id)),
          }));
          setSaveError(en.farm.unknownCrop);
          setSaving(false);
          return;
        }

        // 409: no area has been chosen yet.
        if (err.status === 409 || err.code === 'FARM_SETUP_INCOMPLETE') {
          setNeedsArea(true);
          setSaveError(en.farm.pickArea.hint);
          setSaving(false);
          return;
        }
      }

      setSaveError(friendlyMessage(err));
    } finally {
      setSaving(false);
    }
  }, [form, loaded, refresh, router]);

  if (status === 'loading') {
    return (
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
        <Skeleton className="h-8 w-64 rounded-card" />
        <Skeleton className="mt-3 h-4 w-96 rounded-card" />
        <div className="mt-6 space-y-4">
          <Skeleton className="h-56 w-full rounded-card" />
          <Skeleton className="h-48 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
        <p className="mt-4 text-center text-sm text-ink-soft">{en.farm.loading}</p>
      </section>
    );
  }

  if (status === 'error' || !loaded) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
        <Banner tone="error">{loadError ?? en.api.generic}</Banner>
        <Button
          onClick={() => {
            setStatus('loading');
            setLoadError(null);

            void (async () => {
              try {
                const data = await fetchFarmData();
                setLoaded({
                  farm: data.farm,
                  options: data.options,
                  crops: data.crops,
                });
                setForm(farmFormFrom(data.farm));
                setNeedsArea(data.farm.centerId === null);
                setStatus('ready');
              } catch (err) {
                setLoadError(friendlyMessage(err));
                setStatus('error');
              }
            })();
          }}
          className="mt-4"
        >
          {en.explore.errors.retry}
        </Button>
      </section>
    );
  }

  const { options, crops } = loaded;

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
      <header>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <MapPin className="size-3.5" aria-hidden="true" />
          {en.farm.tag}
        </span>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-deep sm:text-4xl">
          {en.farm.title}
        </h1>
        <p className="mt-2 max-w-2xl text-base font-semibold text-ink-soft">
          {en.farm.description}
        </p>
      </header>

      {needsArea && (
        <div className="mt-6 rounded-card border-2 border-mint-3 bg-card p-5 shadow-card">
          <h2 className="text-base font-extrabold text-deep">{en.farm.pickArea.title}</h2>
          <p className="mt-1.5 text-sm font-semibold text-ink-soft">{en.farm.pickArea.text}</p>
          <Link
            href="/explore"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-deep px-4 py-2 text-sm font-extrabold text-white transition-colors hover:bg-primary"
          >
            {en.farm.pickArea.link}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <FarmCropsSection
          crops={crops}
          selected={form.currentCrops}
          error={errors.currentCrops}
          disabled={saving}
          onToggle={onToggleCrop}
        />

        <FarmWaterSection
          options={options}
          waterSource={form.waterSource}
          waterSourceOther={form.waterSourceOther}
          waterAvailability={form.waterAvailability}
          waterSourceError={errors.waterSource}
          waterSourceOtherError={errors.waterSourceOther}
          waterAvailabilityError={errors.waterAvailability}
          disabled={saving}
          onSelectWaterSource={(value: WaterSource) => change('waterSource', value)}
          onChangeWaterSourceOther={(value) => change('waterSourceOther', value)}
          onSelectWaterAvailability={(value: WaterAvailability) =>
            change('waterAvailability', value)
          }
        />

        <FarmSoilSection
          options={options}
          soilType={form.soilType}
          error={errors.soilType}
          disabled={saving}
          onSelect={(value: SoilType) => change('soilType', value)}
        />

        <FarmEquipmentSection
          options={options}
          equipment={form.equipment}
          error={errors.equipment}
          disabled={saving}
          onToggle={onToggleEquipment}
        />

        <FarmSeasonsSection
          options={options}
          seasonsPerYear={form.seasonsPerYear}
          error={errors.seasonsPerYear}
          disabled={saving}
          onSelect={(value) => change('seasonsPerYear', value)}
        />

        <FarmPrioritiesSection
          options={options}
          priorities={form.priorities}
          error={errors.priorities}
          disabled={saving}
          onToggle={onTogglePriority}
        />
      </div>

      {unknownCrops.length > 0 && (
        <p className="mt-3 text-xs font-semibold text-ink-soft">
          {unknownCrops.join(', ')}
        </p>
      )}

      {saveError && (
        <div className="mt-4">
          <Banner tone="error">{saveError}</Banner>
        </div>
      )}

      {saved && (
        <div className="mt-4">
          <Banner tone="success">{en.farm.saved}</Banner>
        </div>
      )}

      <div className="mt-6 flex flex-col items-center gap-2">
        <Button
          onClick={() => void onSubmit()}
          loading={saving}
          disabled={saving || !complete || needsArea}
          iconLeft={<Save className="size-4" aria-hidden="true" />}
          iconRight={<ArrowRight className="size-4" aria-hidden="true" />}
          className="w-full sm:w-auto"
        >
          {saving ? en.farm.saving : en.farm.save}
        </Button>

        {!complete && (
          <p className="text-xs font-semibold text-ink-soft">{en.farm.pickArea.hint}</p>
        )}
      </div>
    </section>
  );
}

/** The crop ids the API did not know. */
function readUnknownIds(details: unknown): string[] {
  if (!details || typeof details !== 'object') return [];

  const ids = (details as { unknownIds?: unknown }).unknownIds;
  if (!Array.isArray(ids)) return [];

  return ids.filter((id): id is string => typeof id === 'string');
}
