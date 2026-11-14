import { safeGet, safeRemove, safeSet } from './storage';

/** The guest id is the only key to a guest's farm. Never put it in a URL or log it. */
const GUEST_ID_KEY = 'guestId';

function uuidV4(): string | null {
  if (typeof crypto === 'undefined') return null;

  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback for browsers without crypto.randomUUID. Still a UUID v4.
  if (typeof crypto.getRandomValues !== 'function') return null;
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Return the stored guest id, creating one on first use. The id is created once
 * and never regenerated while it exists.
 */
export function getOrCreateGuestId(): string | null {
  if (typeof window === 'undefined') return null;

  const existing = safeGet(GUEST_ID_KEY);
  if (existing) return existing;

  const created = uuidV4();
  if (!created) return null;
  safeSet(GUEST_ID_KEY, created);
  return created;
}

export function clearGuestId(): void {
  safeRemove(GUEST_ID_KEY);
}

/** Used after logout: remove the old id and create a brand-new guest identity. */
export function resetGuestId(): string | null {
  clearGuestId();
  return getOrCreateGuestId();
}
