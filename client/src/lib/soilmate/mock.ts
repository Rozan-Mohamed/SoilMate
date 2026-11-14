import { USE_MOCK_PLANNED } from './config';
import { ApiError } from './errors';

/**
 * Shared mock adapter for website endpoints marked [PLANNED] in the API
 * contract. Stages 6, 7 and 8 keep their fake response builders in their own
 * `lib/<stage>/mock.ts`; this helper only decides when those builders are used.
 *
 * Rules from the docs:
 * - NEXT_PUBLIC_MOCK_PLANNED=true forces the stage-local mock.
 * - Otherwise use the real endpoint, and fall back only when it answers 404 or 502.
 * - Every mock response must carry `status: "placeholder"` so the UI shows the
 *   "Sample scores" badge.
 */
export function mockEnabled(): boolean {
  return USE_MOCK_PLANNED;
}

export function shouldUsePlannedMock(err: unknown): boolean {
  return (
    USE_MOCK_PLANNED ||
    (err instanceof ApiError && (err.status === 404 || err.status === 502))
  );
}

export async function withPlannedMock<T>(
  real: () => Promise<T>,
  mock: () => T | Promise<T>,
): Promise<T> {
  if (USE_MOCK_PLANNED) return mock();

  try {
    return await real();
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 502)) {
      return mock();
    }
    throw err;
  }
}
