import { safeGet, safeRemove, safeSet } from './storage';

const TOKEN_KEY = 'token';

/**
 * Auth token storage. "Remember me" uses localStorage; otherwise the token
 * lives only for the browser session. Both places are cleared on logout/401.
 */
export function getToken(): string | null {
  return safeGet(TOKEN_KEY, 'local') ?? safeGet(TOKEN_KEY, 'session');
}

export function setToken(token: string, remember: boolean): void {
  // Never leave a stale copy in the other storage area.
  safeRemove(TOKEN_KEY, 'local');
  safeRemove(TOKEN_KEY, 'session');
  safeSet(TOKEN_KEY, token, remember ? 'local' : 'session');
}

export function clearToken(): void {
  safeRemove(TOKEN_KEY, 'local');
  safeRemove(TOKEN_KEY, 'session');
}
