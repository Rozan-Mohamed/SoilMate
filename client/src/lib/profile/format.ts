import type { CenterId } from '@/lib/soilmate/types';

/** The three covered areas. The names come from the API contract. */
const CENTER_NAMES: Record<CenterId, string> = {
  desouk: 'Desouk',
  sidi_salem: 'Sidi Salem',
  baltim: 'Baltim',
};

export function centerLabel(centerId: CenterId | null | undefined): string | null {
  if (!centerId) return null;
  return CENTER_NAMES[centerId] ?? null;
}

export function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SM';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return `${first}${last}`.toUpperCase();
}

/** Whole months between two dates. */
export function monthsBetween(from: Date, to: Date): number {
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  return months >= 0 ? months : 0;
}

/** "Last updated 3 months ago" for the Account Settings card. */
export function passwordUpdatedLabel(
  iso: string | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!iso) return null;
  const changed = new Date(iso);
  if (Number.isNaN(changed.getTime())) return null;

  const months = monthsBetween(changed, now);
  if (months <= 0) return 'Last updated this month';
  if (months === 1) return 'Last updated 1 month ago';
  return `Last updated ${months} months ago`;
}

export function formatArea(value: number, unit: string): string {
  const rounded = Number.isInteger(value) ? value : Number(value.toFixed(2));
  return `${rounded} ${unit === 'hectares' ? 'hectares' : 'acres'}`;
}

/** "acres" -> "Acres" for the unit toggle. */
export function unitLabel(unit: string): string {
  return unit.charAt(0).toUpperCase() + unit.slice(1);
}
