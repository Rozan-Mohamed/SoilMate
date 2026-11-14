import { en } from '@/strings/en';

type Issue = { path: string; message: string };

function readIssues(details: unknown): Issue[] {
  if (!details || typeof details !== 'object') return [];
  const issues = (details as { issues?: unknown }).issues;
  if (!Array.isArray(issues)) return [];

  return issues.flatMap((item): Issue[] => {
    if (!item || typeof item !== 'object') return [];
    const path = (item as { path?: unknown }).path;
    const message = (item as { message?: unknown }).message;
    if (typeof path !== 'string' || typeof message !== 'string') return [];
    return [{ path, message }];
  });
}

/** Typed error for every failed website API call. */
export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  issues: Issue[];
  /** The response headers, so a caller can read "RateLimit-Reset" on a 429. */
  headers?: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
    headers?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.issues = readIssues(details);
    this.headers = headers;
  }
}

/** Turn VALIDATION_ERROR issues into a field -> message map for forms. */
export function fieldErrors(err: unknown): Record<string, string> {
  if (!(err instanceof ApiError)) return {};

  const result: Record<string, string> = {};
  for (const issue of err.issues) {
    const field = issue.path.replace(/^(body|query|params)\./, '');
    if (field) result[field] = issue.message;
  }
  return result;
}

/** A safe sentence for banners. Raw API codes are never shown to the farmer. */
export function friendlyMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return en.api.generic;

  switch (err.code) {
    case 'NETWORK':
      return en.api.network;
    case 'INTERNAL':
      return en.api.internal;
    case 'RATE_LIMITED':
      return en.api.rateLimited;
    case 'UNAUTHENTICATED':
      return en.api.unauthenticated;
    case 'INVALID_CREDENTIALS':
      return en.api.invalidCredentials;
    default:
      return err.status >= 500 ? en.api.internal : err.message || en.api.generic;
  }
}
