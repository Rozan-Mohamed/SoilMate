type StorageArea = 'local' | 'session';

// These helpers are safe during server rendering and in browsers where storage
// is blocked (private mode, cookie/privacy settings). They never throw.
function getStorage(area: StorageArea): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return area === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

export function safeGet(key: string, area: StorageArea = 'local'): string | null {
  const storage = getStorage(area);
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(key: string, value: string, area: StorageArea = 'local'): void {
  const storage = getStorage(area);
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Storage can be full or blocked. The caller keeps working without persistence.
  }
}

export function safeRemove(key: string, area: StorageArea = 'local'): void {
  const storage = getStorage(area);
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Ignore blocked storage.
  }
}

/** Rotation Lab sequence storage (session only). */
export const labSequenceStorage = {
  /** Read the labSequence from sessionStorage, returns null if absent. */
  read(): { slot: string; cropId: string }[] | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.sessionStorage.getItem('soilmate:labSequence');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /** Write the labSequence to sessionStorage. */
  write(seq: { slot: string; cropId: string }[]): void {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem('soilmate:labSequence', JSON.stringify(seq));
    } catch {
      // Ignore storage failures; the UI keeps working without persistence.
    }
  },

  /** Clear the labSequence from sessionStorage. */
  clear(): void {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.removeItem('soilmate:labSequence');
    } catch {
      // Ignore.
    }
  },
};
