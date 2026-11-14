'use client';

import clsx from 'clsx';
import Link from 'next/link';
import {
  Building2,
  Calculator,
  Droplets,
  MapPin,
  Plus,
  RotateCcw,
  Save,
  Tractor,
} from 'lucide-react';
import { Button, Card, Chip, TextField } from '@/components/ui';
import { centerLabel, unitLabel } from '@/lib/profile/format';
import { MAX_CROPS } from '@/lib/profile/validation';
import type { ProfileErrors, ProfileForm } from '@/lib/profile/types';
import type { MetaOptions, Priority, WaterSource } from '@/lib/soilmate/types';
import { en } from '@/strings/en';

type Props = {
  form: ProfileForm;
  options: MetaOptions;
  cropNames: Record<string, string>;
  centerId: string | null;
  errors: ProfileErrors;
  saving: boolean;
  resetting: boolean;
  disabled?: boolean;
  onChange: <K extends keyof ProfileForm>(field: K, value: ProfileForm[K]) => void;
  onToggleCrop: (id: string) => void;
  onTogglePriority: (id: Priority) => void;
  onOpenCropPicker: () => void;
  onReset: () => void;
  onSave: () => void;
};

export function FarmPreferencesCard({
  form,
  options,
  cropNames,
  centerId,
  errors,
  saving,
  resetting,
  disabled = false,
  onChange,
  onToggleCrop,
  onTogglePriority,
  onOpenCropPicker,
  onReset,
  onSave,
}: Props) {
  const maxPriorities = options.limits.maxPriorities;
  const area = centerLabel(centerId as Parameters<typeof centerLabel>[0]);
  const waterHint = options.waterSource.find((option) => option.id === form.waterSource)?.hint;

  return (
    <Card className="h-full">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mint-2 text-primary">
          <Tractor className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-deep">{en.profile.farm.title}</h2>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <TextField
          label={en.profile.farm.farmName}
          name="farmName"
          value={form.farmName}
          onChange={(event) => onChange('farmName', event.target.value)}
          error={errors.farmName}
          iconLeft={<Building2 className="size-4" />}
          disabled={disabled}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <TextField
              label={en.profile.farm.location}
              name="farmLocationText"
              value={form.farmLocationText}
              onChange={(event) => onChange('farmLocationText', event.target.value)}
              error={errors.farmLocationText}
              iconLeft={<MapPin className="size-4" />}
              disabled={disabled}
            />
            <p className="mt-1.5 px-1 text-xs text-ink-soft">
              {area ? (
                <>
                  {en.profile.farm.dataArea}: <span className="font-bold text-deep">{area}</span>
                </>
              ) : (
                <Link
                  href="/explore"
                  className="font-bold text-primary underline underline-offset-2 hover:text-deep"
                >
                  {en.profile.farm.dataAreaMissing}
                </Link>
              )}
            </p>
          </div>

          <div>
            <TextField
              label={en.profile.farm.area}
              name="landArea"
              value={form.landAreaValue}
              onChange={(event) => onChange('landAreaValue', event.target.value)}
              error={errors.landArea}
              inputMode="decimal"
              iconLeft={<Calculator className="size-4" />}
              disabled={disabled}
            />
            <div className="mt-2 inline-flex rounded-full border-2 border-mint-3 bg-mint-2/70 p-0.5">
              {options.areaUnit.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => onChange('landAreaUnit', unit as ProfileForm['landAreaUnit'])}
                  disabled={disabled}
                  aria-pressed={form.landAreaUnit === unit}
                  className={clsx(
                    'rounded-full px-3 py-1 text-sm font-bold transition-colors disabled:opacity-60',
                    form.landAreaUnit === unit
                      ? 'bg-deep text-white'
                      : 'text-ink-soft hover:text-deep',
                  )}
                >
                  {unitLabel(unit)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-bold text-deep">{en.profile.farm.crops}</p>
            <p className="text-xs font-semibold text-ink-soft">
              {en.profile.farm.cropsSelected(form.currentCrops.length)}
            </p>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {form.currentCrops.length === 0 && (
              <p className="text-sm text-ink-soft">{en.profile.farm.noCrops}</p>
            )}
            {form.currentCrops.map((id) => (
              <Chip key={id} selected onRemove={() => onToggleCrop(id)}>
                {cropNames[id] ?? id}
              </Chip>
            ))}
            <button
              type="button"
              onClick={onOpenCropPicker}
              disabled={disabled || form.currentCrops.length >= MAX_CROPS}
              className="inline-flex items-center gap-1 rounded-full border-2 border-dashed border-mint-3 px-3 py-1 text-sm font-bold text-primary transition-colors hover:border-primary hover:bg-mint-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              {en.profile.farm.addCrop}
            </button>
          </div>
          {errors.currentCrops && (
            <p role="alert" className="mt-1.5 px-1 text-sm font-semibold text-peach-ink">
              {errors.currentCrops}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="water-source"
            className="mb-1.5 block text-sm font-bold text-deep"
          >
            {en.profile.farm.waterSource}
          </label>
          <div className="relative">
            <Droplets
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
              aria-hidden="true"
            />
            <select
              id="water-source"
              name="waterSource"
              value={form.waterSource ?? ''}
              disabled={disabled}
              onChange={(event) =>
                onChange('waterSource', (event.target.value || null) as WaterSource | null)
              }
              className="w-full appearance-none rounded-full border-2 border-mint-3 bg-mint-2/70 py-3 pl-11 pr-4 text-base text-ink transition-colors focus:border-primary focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{en.profile.farm.waterSourceNone}</option>
              {options.waterSource.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {waterHint && <p className="mt-1.5 px-1 text-xs text-ink-soft">{waterHint}</p>}
          {errors.waterSource && (
            <p role="alert" className="mt-1.5 px-1 text-sm font-semibold text-peach-ink">
              {errors.waterSource}
            </p>
          )}

          {form.waterSource === 'other' && (
            <div className="mt-3">
              <TextField
                label={en.profile.farm.waterSourceOther}
                name="waterSourceOther"
                value={form.waterSourceOther}
                onChange={(event) => onChange('waterSourceOther', event.target.value)}
                error={errors.waterSourceOther}
                maxLength={60}
                disabled={disabled}
              />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-bold text-deep">{en.profile.farm.priorities}</p>
            <p className="text-xs font-semibold text-ink-soft">
              {en.profile.farm.prioritiesSelected(form.priorities.length)}
            </p>
          </div>
          <p className="mt-0.5 text-xs text-ink-soft">{en.profile.farm.prioritiesHint}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {form.priorities.length === 0 && (
              <p className="text-sm text-ink-soft">{en.profile.farm.noPriorities}</p>
            )}
            {options.priority.map((option) => {
              const selected = form.priorities.includes(option.id);
              const disabledOption =
                !selected && form.priorities.length >= maxPriorities;

              return (
                <Chip
                  key={option.id}
                  selected={selected}
                  disabled={disabledOption || disabled}
                  onClick={() => onTogglePriority(option.id)}
                >
                  {option.profileLabel}
                </Chip>
              );
            })}
          </div>
          {errors.priorities && (
            <p role="alert" className="mt-1.5 px-1 text-sm font-semibold text-peach-ink">
              {errors.priorities}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 border-t border-mint-3 pt-4 sm:flex-row sm:justify-end">
        <Button
          variant="secondary"
          onClick={onReset}
          loading={resetting}
          disabled={resetting || saving}
          iconLeft={<RotateCcw className="size-4" />}
        >
          {en.profile.reset}
        </Button>
        <Button
          onClick={onSave}
          loading={saving}
          disabled={saving || resetting}
          iconLeft={<Save className="size-4" />}
        >
          {en.profile.save}
        </Button>
      </div>
    </Card>
  );
}
