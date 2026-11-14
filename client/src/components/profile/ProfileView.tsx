'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { Banner, Button, Skeleton, Spinner } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { setAuthNotice } from '@/lib/auth/notice';
import {
  fetchCurrentCrops,
  fetchFarm,
  fetchMe,
  fetchOptions,
  updateFarm,
  updateMe,
} from '@/lib/profile/api';
import { validateProfile } from '@/lib/profile/validation';
import type {
  ProfileErrors,
  ProfileFarmPayload,
  ProfileForm,
  ProfileMePayload,
} from '@/lib/profile/types';
import { fieldErrors, friendlyMessage } from '@/lib/soilmate/errors';
import type { Crop, Farm, Me, MetaOptions, Priority } from '@/lib/soilmate/types';
import { en } from '@/strings/en';
import { AccountSettingsCard } from './AccountSettingsCard';
import { ChangePasswordModal } from './ChangePasswordModal';
import { CropPickerModal } from './CropPickerModal';
import { DangerZoneCard } from './DangerZoneCard';
import { DeleteAccountModal } from './DeleteAccountModal';
import { FarmPreferencesCard } from './FarmPreferencesCard';
import { PersonalInfoCard } from './PersonalInfoCard';
import { ProfileGuestCard } from './ProfileGuestCard';
import { ProfileHeaderCard } from './ProfileHeaderCard';

function formFrom(me: Me, farm: Farm): ProfileForm {
  return {
    fullName: me.fullName ?? '',
    phone: me.phone ?? '',
    farmName: farm.farmName ?? '',
    farmLocationText: farm.farmLocationText ?? '',
    landAreaValue: farm.landArea ? String(farm.landArea.value) : '',
    landAreaUnit: farm.landArea?.unit ?? 'acres',
    currentCrops: [...farm.currentCrops],
    waterSource: farm.waterSource,
    waterSourceOther: farm.waterSourceOther ?? '',
    priorities: [...farm.priorities],
  };
}

/** Only the fields the Profile page owns are sent to PATCH /farm. */
function farmPayloadFrom(form: ProfileForm): ProfileFarmPayload {
  const payload: ProfileFarmPayload = {
    farmName: form.farmName.trim() || null,
    farmLocationText: form.farmLocationText.trim() || null,
    currentCrops: form.currentCrops,
    waterSource: form.waterSource,
    waterSourceOther:
      form.waterSource === 'other' ? form.waterSourceOther.trim() || null : null,
    priorities: form.priorities,
  };

  const area = form.landAreaValue.trim();
  if (area) payload.landArea = { value: Number(area), unit: form.landAreaUnit };

  return payload;
}

/** The four calls the Profile page makes on load. */
async function fetchProfileData() {
  const [me, farm, options, crops] = await Promise.all([
    fetchMe(),
    fetchFarm(),
    fetchOptions(),
    fetchCurrentCrops(),
  ]);
  return { me, farm, options, crops: crops.crops ?? [] };
}

export function ProfileView() {
  const router = useRouter();
  const { status, setUser, logout } = useAuth();

  const [me, setMe] = useState<Me | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [options, setOptions] = useState<MetaOptions | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [form, setForm] = useState<ProfileForm | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [cropPickerOpen, setCropPickerOpen] = useState(false);

  const applyData = useCallback(
    (data: { me: Me; farm: Farm; options: MetaOptions; crops: Crop[] }) => {
      setMe(data.me);
      setFarm(data.farm);
      setOptions(data.options);
      setCrops(data.crops);
      setForm(formFrom(data.me, data.farm));
      setUser(data.me);
    },
    [setUser],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      applyData(await fetchProfileData());
    } catch (err) {
      setLoadError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, [applyData]);

  // Guests never reach the API: the effect only runs for an account.
  useEffect(() => {
    if (status !== 'account') return;

    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchProfileData();
        if (cancelled) return;
        applyData(data);
      } catch (err) {
        if (!cancelled) setLoadError(friendlyMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, applyData]);

  const cropNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const crop of crops) map[crop.id] = crop.name;
    for (const crop of farm?.currentCropsDetail ?? []) map[crop.id] = crop.name;
    return map;
  }, [crops, farm]);

  const update = useCallback(
    <K extends keyof ProfileForm>(field: K, value: ProfileForm[K]) => {
      setForm((current) => (current ? { ...current, [field]: value } : current));
      setErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
    },
    [],
  );

  const toggleCrop = useCallback((id: string) => {
    setForm((current) => {
      if (!current) return current;
      const has = current.currentCrops.includes(id);
      if (has) {
        return { ...current, currentCrops: current.currentCrops.filter((crop) => crop !== id) };
      }
      if (current.currentCrops.length >= 8) return current;
      return { ...current, currentCrops: [...current.currentCrops, id] };
    });
  }, []);

  const togglePriority = useCallback((id: Priority) => {
    setForm((current) => {
      if (!current) return current;
      const has = current.priorities.includes(id);
      if (has) {
        return { ...current, priorities: current.priorities.filter((item) => item !== id) };
      }
      const max = options?.limits.maxPriorities ?? 3;
      if (current.priorities.length >= max) return current;
      return { ...current, priorities: [...current.priorities, id] };
    });
  }, [options]);

  const save = useCallback(async () => {
    if (!form || saving) return;

    const validation = validateProfile(form);
    setErrors(validation);
    setSaveMessage(null);
    setSaveError(null);
    if (Object.keys(validation).length > 0) return;

    setSaving(true);

    const mePayload: ProfileMePayload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim() || null,
    };
    const farmPayload = farmPayloadFrom(form);

    const [meResult, farmResult] = await Promise.allSettled([
      updateMe(mePayload),
      updateFarm(farmPayload),
    ]);

    let savedMe: Me | null = null;
    let savedFarm: Farm | null = null;

    if (meResult.status === 'fulfilled') {
      savedMe = meResult.value;
      setMe(savedMe);
      setUser(savedMe);
    } else {
      setErrors((current) => ({ ...current, ...fieldErrors(meResult.reason) }));
    }

    if (farmResult.status === 'fulfilled') {
      savedFarm = farmResult.value;
      setFarm(savedFarm);
    } else {
      setErrors((current) => ({ ...current, ...fieldErrors(farmResult.reason) }));
    }

    if (savedMe && savedFarm) {
      setForm(formFrom(savedMe, savedFarm));
      setSaveMessage(en.profile.saved);
    } else if (savedMe) {
      setSaveError(en.profile.errors.saveFarm);
    } else if (savedFarm) {
      setSaveError(en.profile.errors.saveProfile);
    } else {
      setSaveError(en.profile.errors.saveBoth);
    }

    setSaving(false);
  }, [form, saving, setUser]);

  /** Frontend only: reload the saved values from the API. */
  const reset = useCallback(async () => {
    if (resetting) return;
    setResetting(true);
    setSaveMessage(null);
    setSaveError(null);
    try {
      const [meRes, farmRes] = await Promise.all([fetchMe(), fetchFarm()]);
      setMe(meRes);
      setFarm(farmRes);
      setForm(formFrom(meRes, farmRes));
      setErrors({});
    } catch (err) {
      setSaveError(friendlyMessage(err));
    } finally {
      setResetting(false);
    }
  }, [resetting]);

  const onLogOut = useCallback(async () => {
    await logout();
    router.push('/');
  }, [logout, router]);

  const onPasswordChanged = useCallback(async () => {
    setPasswordOpen(false);
    // The old token stops working, so the farmer logs in again.
    await logout();
    setAuthNotice(en.profile.password.updated);
    router.push('/login');
  }, [logout, router]);

  const onAccountDeleted = useCallback(async () => {
    setDeleteOpen(false);
    await logout();
    router.push('/');
  }, [logout, router]);

  if (status === 'loading') {
    return (
      <div className="py-16">
        <Spinner label={en.ui.loading} />
      </div>
    );
  }

  if (status === 'guest') return <ProfileGuestCard />;

  if (loadError) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-card bg-card p-6 shadow-card">
          <Banner tone="error">{loadError}</Banner>
          <Button
            onClick={() => void load()}
            className="mt-4"
            iconLeft={<RotateCcw className="size-4" />}
          >
            {en.profile.retry}
          </Button>
        </div>
      </section>
    );
  }

  if (loading || !me || !farm || !options || !form) {
    return (
      <section className="mx-auto max-w-6xl space-y-5 px-4 py-10 sm:px-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 w-full rounded-card" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <Skeleton className="h-80 w-full rounded-card" />
          <Skeleton className="h-96 w-full rounded-card" />
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-deep">
            {en.profile.title}
          </h1>
          <p className="mt-1 text-ink-soft">{en.profile.subtitle}</p>
        </div>
        <Button
          onClick={save}
          loading={saving}
          disabled={saving}
          className="w-full shrink-0 sm:w-auto"
        >
          {en.profile.saveAll}
        </Button>
      </header>

      <div className="mt-5">
        <ProfileHeaderCard user={me} />
      </div>

      {saveMessage && (
        <Banner tone="success" className="mt-4">
          {saveMessage}
        </Banner>
      )}
      {saveError && (
        <Banner tone="error" className="mt-4">
          {saveError}
        </Banner>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="space-y-5">
          <PersonalInfoCard
            fullName={form.fullName}
            phone={form.phone}
            email={me.email}
            emailVerified={me.emailVerified}
            errors={errors}
            disabled={saving}
            onChange={(field, value) => update(field, value)}
          />

          <AccountSettingsCard
            passwordChangedAt={me.passwordChangedAt}
            busy={saving}
            onChangePassword={() => setPasswordOpen(true)}
            onLogOut={() => void onLogOut()}
          />

          <DangerZoneCard busy={saving} onDelete={() => setDeleteOpen(true)} />
        </div>

        <FarmPreferencesCard
          form={form}
          options={options}
          cropNames={cropNames}
          centerId={farm.centerId}
          errors={errors}
          saving={saving}
          resetting={resetting}
          disabled={saving}
          onChange={update}
          onToggleCrop={toggleCrop}
          onTogglePriority={togglePriority}
          onOpenCropPicker={() => setCropPickerOpen(true)}
          onReset={() => void reset()}
          onSave={() => void save()}
        />
      </div>

      {passwordOpen && (
        <ChangePasswordModal
          onClose={() => setPasswordOpen(false)}
          onSuccess={() => void onPasswordChanged()}
        />
      )}

      {deleteOpen && (
        <DeleteAccountModal
          email={me.email}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => void onAccountDeleted()}
        />
      )}

      {cropPickerOpen && (
        <CropPickerModal
          crops={crops}
          selected={form.currentCrops}
          onToggle={toggleCrop}
          onClose={() => setCropPickerOpen(false)}
        />
      )}
    </section>
  );
}
