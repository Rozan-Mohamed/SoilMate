// Website API configuration. This is deliberately separate from the game's
// NEXT_PUBLIC_API_URL helper (and from its X-Player-Id identity).
//
// NEXT_PUBLIC_API_BASE is the API host only, for example:
//   https://soilmate-backend-pskfv.sevalla.app
// apiUrl() appends the shared /api prefix used by every website endpoint.
const rawBase = process.env.NEXT_PUBLIC_API_BASE ?? '';

/** API host without a trailing slash. Empty when the env var was not set. */
export const API_BASE = rawBase.trim().replace(/\/+$/, '');

/** Stage-local mocks for [PLANNED] endpoints. Set NEXT_PUBLIC_MOCK_PLANNED=true to force them. */
export const USE_MOCK_PLANNED = process.env.NEXT_PUBLIC_MOCK_PLANNED === 'true';

function apiBaseOrigin(): string | null {
  if (!API_BASE) return null;
  try {
    return new URL(API_BASE).origin;
  } catch {
    return null;
  }
}

const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Resolve backend-served absolute URLs that may be embedded in API responses
 * (e.g. crop images: http://localhost:4000/static/crops/wheat.webp) against the
 * configured API base origin. This keeps local development working while making
 * production deployments use the configured backend URL, without changing API
 * response contracts.
 */
export function resolveApiAssetUrl(value: string): string {
  const origin = apiBaseOrigin();
  if (!origin) return value;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return value;
  }

  if (!LOCALHOST_HOSTS.has(url.hostname)) return value;
  if (!url.pathname.startsWith('/static/')) return value;

  return `${origin}${url.pathname}${url.search}${url.hash}`;
}

export function resolveApiAssetUrls<T>(data: T): T {
  if (typeof data === 'string') {
    return resolveApiAssetUrl(data) as T;
  }
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i += 1) {
      data[i] = resolveApiAssetUrls(data[i]);
    }
    return data;
  }
  if (data && typeof data === 'object') {
    for (const key of Object.keys(data as Record<string, unknown>)) {
      const obj = data as Record<string, unknown>;
      obj[key] = resolveApiAssetUrls(obj[key]);
    }
    return data;
  }
  return data;
}

/** Build an absolute website API URL. `path` starts with `/`. */
export function apiUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}/api${suffix}`;
}
