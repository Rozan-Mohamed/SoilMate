import type { ApiErrorBody, ErrorCode } from './types';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(
  /\/$/,
  '',
);
export const PLAYER_ID_KEY = 'soilmate.playerId';

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, status = 0, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

// localStorage can throw (private mode, blocked cookies). The game must keep working.
function readPlayerId(): string | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(PLAYER_ID_KEY);
  } catch {
    return null;
  }
}

function savePlayerId(id: string) {
  try {
    window.localStorage.setItem(PLAYER_ID_KEY, id);
  } catch {
    /* ignore */
  }
}

export function getPlayerId(): string | null {
  return readPlayerId();
}

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  signal?: AbortSignal;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;

  const headers: Record<string, string> = {};
  const playerId = readPlayerId();
  if (playerId) headers['X-Player-Id'] = playerId;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      cache: 'no-store',
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError('NETWORK', 'Could not reach the server');
  }

  // The server tells us who we are. Keep it for every later request.
  const returnedId = response.headers.get('X-Player-Id');
  if (returnedId) savePlayerId(returnedId);

  if (!response.ok) {
    let parsed: ApiErrorBody | null = null;
    try {
      parsed = (await response.json()) as ApiErrorBody;
    } catch {
      /* body was not JSON */
    }
    throw new ApiError(
      parsed?.error?.code ?? 'INTERNAL',
      parsed?.error?.message ?? 'Something went wrong',
      response.status,
      parsed?.error?.details,
    );
  }

  return (await response.json()) as T;
}
