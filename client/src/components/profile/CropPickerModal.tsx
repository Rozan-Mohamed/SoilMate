'use client';

import clsx from 'clsx';
import { CheckCircle2, Circle, Leaf } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { MAX_CROPS } from '@/lib/profile/validation';
import type { Crop } from '@/lib/soilmate/types';
import { en } from '@/strings/en';

type Props = {
  crops: Crop[];
  selected: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
};

/** Mounted only while it is open. */
export function CropPickerModal({ crops, selected, onToggle, onClose }: Props) {
  const atMax = selected.length >= MAX_CROPS;

  return (
    <Modal
      open
      onClose={onClose}
      title={en.profile.farm.cropPickerTitle}
      size="md"
      footer={
        <Button onClick={onClose} className="w-full">
          {en.ui.done}
        </Button>
      }
    >
      {crops.length === 0 ? (
        <p className="text-sm text-ink-soft">{en.profile.farm.cropEmpty}</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {crops.map((crop) => {
            const isSelected = selected.includes(crop.id);
            const disabled = !isSelected && atMax;

            return (
              <li key={crop.id}>
                <button
                  type="button"
                  onClick={() => onToggle(crop.id)}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    isSelected
                      ? 'border-primary bg-mint-2'
                      : 'border-mint-3 bg-white hover:bg-mint-2',
                  )}
                >
                  {crop.image.thumbUrl ? (
                    // Crop images are absolute API URLs, so a plain image is used.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={crop.image.thumbUrl}
                      alt={crop.image.alt}
                      className="size-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mint-2 text-sm font-extrabold text-primary">
                      {crop.name.charAt(0)}
                    </span>
                  )}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-deep">{crop.name}</span>
                    {crop.subtitle && (
                      <span className="block truncate text-xs text-ink-soft">
                        {crop.subtitle}
                      </span>
                    )}
                  </span>

                  {isSelected ? (
                    <CheckCircle2 className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  ) : (
                    <Circle className="size-5 shrink-0 text-mint-3" aria-hidden="true" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {crops.length > 0 && atMax && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
          <Leaf className="size-3.5" aria-hidden="true" />
          {en.profile.errors.cropsMax}
        </p>
      )}
    </Modal>
  );
}
