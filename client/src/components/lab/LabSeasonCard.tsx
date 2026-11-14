'use client';

import { useState } from 'react';
import { GripVertical, X } from 'lucide-react';
import type { RotationLabCrop, RotationLabSeasonName } from '@/lib/lab/types';
import { LAB_SEASON_LABELS } from '@/lib/lab/validation';
import { en } from '@/strings/en';

type Props = {
  season: RotationLabSeasonName;
  crop: RotationLabCrop | null;
  disabled?: boolean;
  onClear: () => void;
  onSelect: (cropId: string) => void;
  options: RotationLabCrop[];
};

export function LabSeasonCard({ season, crop, disabled, onClear, onSelect, options }: Props) {
  const [dragOver, setDragOver] = useState(false);

  const label = LAB_SEASON_LABELS[season];

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const id = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/x-soilmate-crop');
    if (!id) return;
    if (!options.some((o) => o.id === id)) return;
    onSelect(id);
  }

  function handleDragOver(e: React.DragEvent) {
    if (disabled) return;
    const types = Array.from(e.dataTransfer.types || []);
    if (!types.includes('text/plain') && !types.includes('application/x-soilmate-crop')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    // only clear when leaving the slot container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOver(false);
  }

  return (
    <li className="rounded-2xl border-2 border-mint-3 bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-deep">{label}</h3>
          <p className="mt-0.5 text-xs font-semibold text-ink-soft">
            Drag a crop here, or tap a crop below.
          </p>
        </div>
        {crop ? (
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-mint-3 bg-mint-2 px-3 py-1.5 text-xs font-extrabold text-deep transition-colors hover:bg-mint-3 disabled:opacity-50"
            aria-label={`${en.lab.remove} ${crop.name} from ${label}`}
          >
            <X className="size-3.5" aria-hidden="true" />
            {en.lab.remove}
          </button>
        ) : null}
      </div>

      <div
        role="group"
        aria-label={`${label} slot`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        className={[
          'mt-3 rounded-xl border-2 border-dashed p-3 transition-all sm:p-4',
          dragOver ? 'border-primary bg-mint-1 ring-2 ring-primary/20' : 'border-mint-3 bg-mint-1/40',
          disabled ? 'opacity-70' : '',
        ].join(' ')}
      >
        {crop ? (
          <div className="flex items-center gap-3">
            <span className="relative block size-16 shrink-0 overflow-hidden rounded-xl bg-mint-2 sm:size-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={crop.image.thumbUrl} alt={crop.image.alt} className="size-full object-cover" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-deep sm:text-base">{crop.name}</p>
              <p className="mt-0.5 line-clamp-3 text-[11px] font-semibold text-ink-soft sm:text-xs">{crop.description}</p>
              {crop.roleTags?.length ? (
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                  {crop.roleTags.join(' · ')}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex min-h-[5rem] items-center justify-center rounded-lg px-3 py-5 text-center sm:min-h-[5.5rem]">
            <p className="text-sm font-semibold text-ink-soft">
              {dragOver ? `Drop crop for ${label}` : en.lab.slotEmpty}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-bold text-ink-soft">Available crops for {label.toLowerCase()}</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2" role="listbox" aria-label={`${label} crop options`}>
          {options.map((o) => {
            const selected = crop?.id === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={selected}
                draggable={!disabled}
                disabled={disabled}
                onClick={() => {
                  if (selected) onClear();
                  else onSelect(o.id);
                }}
                onDragStart={(e) => {
                  if (disabled) return;
                  e.dataTransfer.setData('text/plain', o.id);
                  e.dataTransfer.setData('application/x-soilmate-crop', o.id);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (selected) onClear();
                    else onSelect(o.id);
                  }
                }}
                className={[
                  'group flex w-full items-center gap-2 rounded-xl border-2 p-2 text-left transition-all',
                  selected
                    ? 'border-primary bg-mint-2 ring-1 ring-primary/20'
                    : 'border-mint-3 bg-white hover:border-primary/50 hover:bg-mint-1',
                  disabled ? 'cursor-not-allowed opacity-60' : 'cursor-grab active:cursor-grabbing',
                ].join(' ')}
                title={selected ? `Selected for ${label}. Click to remove.` : `Drag or click to assign ${o.name} to ${label}`}
              >
                <span className="hidden shrink-0 text-ink-soft/70 sm:inline-flex" aria-hidden="true">
                  <GripVertical className="size-4" />
                </span>
                <span className="relative block size-10 shrink-0 overflow-hidden rounded-lg bg-mint-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={o.image.thumbUrl} alt="" className="size-full object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-extrabold text-deep">{o.name}</span>
                  {o.id === 'fallow' ? (
                    <span className="block text-[10px] font-semibold text-ink-soft">Leave season fallow</span>
                  ) : o.roleTags?.length ? (
                    <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-primary">{o.roleTags.join(' · ')}</span>
                  ) : null}
                </span>
                {selected ? (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary">Selected</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </li>
  );
}
