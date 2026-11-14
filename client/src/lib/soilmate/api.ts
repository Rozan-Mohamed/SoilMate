import { en } from '@/strings/en';
import { apiUrl, resolveApiAssetUrls } from './config';
import { ApiError } from './errors';
import { getOrCreateGuestId, resetGuestId } from './guest';
import { clearToken, getToken } from './token';

export type AuthMode = 'none' | 'identity';

export type ApiFetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** `identity` sends the token or guest id. Public endpoints use `none`. */
  auth?: AuthMode;
  /** Extra headers, e.g. X-Guest-Id on signup/login even though no token is sent. */
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

function isAbortError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name?: unknown }).name === 'AbortError'
  );
}

function internalError(status: number): ApiError {
  return new ApiError(status, 'INTERNAL', en.api.internal);
}

async function parseErrorResponse(response: Response): Promise<ApiError> {
  let text: string;
  try {
    text = await response.text();
  } catch {
    return internalError(response.status);
  }

  if (!text) return internalError(response.status);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return internalError(response.status);
  }

  const error =
    typeof body === 'object' && body !== null ? (body as { error?: unknown }).error : undefined;
  if (!error || typeof error !== 'object') return internalError(response.status);

  const code = (error as { code?: unknown }).code;
  const message = (error as { message?: unknown }).message;
  if (typeof code !== 'string' || !code) return internalError(response.status);

  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return new ApiError(
    response.status,
    code,
    typeof message === 'string' && message ? message : en.api.generic,
    (error as { details?: unknown }).details,
    headers,
  );
}

function notifyUnauthorized(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('soilmate:unauthorized'));
  }
}

function headersRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

async function request<T>(
  path: string,
  opts: ApiFetchOptions,
  allowGuestRetry: boolean,
): Promise<T> {
  const token = getToken();
  const usesIdentity = (opts.auth ?? 'identity') === 'identity';
  const headers = new Headers(opts.headers);

  // Never send both identities. A token always wins.
  if (token) headers.delete('X-Guest-Id');

  let usedToken = false;
  if (usesIdentity) {
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      usedToken = true;
    } else if (!headers.has('X-Guest-Id')) {
      const guestId = getOrCreateGuestId();
      if (guestId) headers.set('X-Guest-Id', guestId);
    }
  }

  const hasBody = opts.body !== undefined;
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const init: RequestInit = {
    method: opts.method ?? 'GET',
    headers,
    signal: opts.signal,
  };
  if (hasBody) init.body = JSON.stringify(opts.body);
  // Account/guest data must never be cached; public data may use the browser cache.
  if (usesIdentity) init.cache = 'no-store';

  let response: Response;
  try {
    response = await fetch(apiUrl(path), init);
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new ApiError(0, 'NETWORK', en.api.network);
  }

  if (!response.ok) {
    const error = await parseErrorResponse(response);

    if (error.status === 401 && usedToken) {
      clearToken();
      notifyUnauthorized();
    }

    // A malformed guest id is recoverable: create a new id and retry exactly once.
    if (
      !token &&
      allowGuestRetry &&
      error.status === 400 &&
      error.code === 'INVALID_GUEST_ID' &&
      headers.has('X-Guest-Id')
    ) {
      const replacement = resetGuestId();
      if (replacement) {
        const retryHeaders = new Headers(opts.headers);
        retryHeaders.set('X-Guest-Id', replacement);
        return request<T>(path, { ...opts, headers: headersRecord(retryHeaders) }, false);
      }
    }

    throw error;
  }

  if (response.status === 204) return undefined as T;

  let text: string;
  try {
    text = await response.text();
  } catch {
    throw internalError(response.status);
  }
  if (!text) return undefined as T;

  try {
    return resolveApiAssetUrls(JSON.parse(text) as T);
  } catch {
    throw internalError(response.status);
  }
}

/**
 * Call a website API endpoint. This helper is used only by the website data
 * layer; the game keeps its own client and X-Player-Id identity.
 */
export function apiFetch<T = unknown>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  return request<T>(path, opts, true);
}
