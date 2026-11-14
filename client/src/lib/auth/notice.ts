import { safeGet, safeRemove, safeSet } from '@/lib/soilmate/storage';

/** The one-time notice is deliberately session-only and read by Stage 1 only. */
const NOTICE_KEY = 'soilmate:notice';

let currentNotice: string | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function setAuthNotice(message: string): void {
  if (!message) return;
  safeSet(NOTICE_KEY, message, 'session');
  currentNotice = message;
  emit();
}

/** Take and clear the persisted notice. */
export function takeAuthNotice(): string | null {
  const message = safeGet(NOTICE_KEY, 'session');
  if (!message) return null;
  safeRemove(NOTICE_KEY, 'session');
  return message;
}

export function subscribeAuthNotice(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAuthNoticeSnapshot(): string | null {
  if (!initialized && typeof window !== 'undefined') {
    initialized = true;
    currentNotice = takeAuthNotice();
  }
  return currentNotice;
}

export function getAuthNoticeServerSnapshot(): string | null {
  return null;
}

export function dismissAuthNotice(): void {
  currentNotice = null;
  safeRemove(NOTICE_KEY, 'session');
  emit();
}
