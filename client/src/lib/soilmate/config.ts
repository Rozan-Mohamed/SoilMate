// Website API configuration. This is deliberately separate from the game's
// NEXT_PUBLIC_API_URL helper (and from its X-Player-Id identity).
//
// NEXT_PUBLIC_API_BASE is the API host only, for example:
//   http://localhost:5000
// apiUrl() appends the shared /api prefix used by every website endpoint.
const rawBase = process.env.NEXT_PUBLIC_API_BASE ?? '';

/** API host without a trailing slash. Empty when the env var was not set. */
export const API_BASE = rawBase.trim().replace(/\/+$/, '');

/** Stage-local mocks for [PLANNED] endpoints. Set NEXT_PUBLIC_MOCK_PLANNED=true to force them. */
export const USE_MOCK_PLANNED = process.env.NEXT_PUBLIC_MOCK_PLANNED === 'true';

/** Build an absolute website API URL. `path` starts with `/`. */
export function apiUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}/api${suffix}`;
}
