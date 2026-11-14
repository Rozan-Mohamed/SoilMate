export const DEFAULT_AUTH_REDIRECT = '/explore';

const SITE_ORIGIN = 'https://soilmate.local';

/**
 * `GET /journey` is trusted API data, but a client-side redirect must still be
 * same-site. Reject absolute URLs, protocol-relative URLs and schemes such as
 * `javascript:`. Only a same-origin path is returned.
 */
export function safeNextRoute(route: string | null | undefined): string {
  if (typeof route !== 'string') return DEFAULT_AUTH_REDIRECT;

  const candidate = route.trim();
  if (!candidate.startsWith('/') || candidate.startsWith('//')) {
    return DEFAULT_AUTH_REDIRECT;
  }

  try {
    const url = new URL(candidate, SITE_ORIGIN);
    if (url.origin !== SITE_ORIGIN) return DEFAULT_AUTH_REDIRECT;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_AUTH_REDIRECT;
  }
}
