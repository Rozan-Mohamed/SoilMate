import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import type { AttemptState } from '@/api/types';

vi.mock('@/api/games.api', () => ({
  getCurrentAttempt: vi.fn(),
  startAttempt: vi.fn(),
}));

import { getCurrentAttempt, startAttempt } from '@/api/games.api';
import { loadAttempt } from './attemptLoader';

const attempt = (id: string): AttemptState => ({
  attemptId: id,
  gameSlug: 'match-the-word',
  status: 'active',
  hearts: 3,
  streak: 0,
  points: 0,
  total: 5,
  questions: [],
});
const notFound = () => new ApiError('NOT_FOUND', 'No active attempt', 404);

describe('loadAttempt', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resumes the round in progress when there is one', async () => {
    vi.mocked(getCurrentAttempt).mockResolvedValue(attempt('running'));
    const result = await loadAttempt('match-the-word');
    expect(result).toEqual({ attempt: attempt('running'), resumed: true });
    expect(startAttempt).not.toHaveBeenCalled();
  });

  it('starts a new round when the server says there is none (404)', async () => {
    vi.mocked(getCurrentAttempt).mockRejectedValue(notFound());
    vi.mocked(startAttempt).mockResolvedValue(attempt('fresh'));
    const result = await loadAttempt('match-the-word');
    expect(result).toEqual({ attempt: attempt('fresh'), resumed: false });
  });

  it('shares ONE request between simultaneous callers (React Strict Mode runs effects twice)', async () => {
    vi.mocked(getCurrentAttempt).mockRejectedValue(notFound());
    vi.mocked(startAttempt).mockResolvedValue(attempt('only-one'));
    const [a, b] = await Promise.all([loadAttempt('fix-the-field'), loadAttempt('fix-the-field')]);
    expect(startAttempt).toHaveBeenCalledTimes(1);
    expect(getCurrentAttempt).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it('does not share requests between different games', async () => {
    vi.mocked(getCurrentAttempt).mockRejectedValue(notFound());
    vi.mocked(startAttempt).mockResolvedValue(attempt('x'));
    await Promise.all([loadAttempt('match-the-word'), loadAttempt('crop-superpowers')]);
    expect(startAttempt).toHaveBeenCalledTimes(2);
  });

  it('forgets a finished request, so Play Again later makes a new one', async () => {
    vi.mocked(getCurrentAttempt).mockRejectedValue(notFound());
    vi.mocked(startAttempt).mockResolvedValue(attempt('x'));
    await loadAttempt('weather-and-crops');
    await loadAttempt('weather-and-crops');
    expect(startAttempt).toHaveBeenCalledTimes(2);
  });

  it('passes other errors on (server down, 500, offline)', async () => {
    vi.mocked(getCurrentAttempt).mockRejectedValue(new ApiError('NETWORK', 'offline'));
    await expect(loadAttempt('match-the-word')).rejects.toMatchObject({ code: 'NETWORK' });
    expect(startAttempt).not.toHaveBeenCalled();
  });
});
