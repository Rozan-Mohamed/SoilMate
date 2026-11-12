import { apiRequest } from './client';
import type { ProgressResponse } from './types';

export const getProgress = () => apiRequest<ProgressResponse>('/players/me/progress');

export const resetProgress = () =>
  apiRequest<{ reset: true }>('/players/me/reset', { method: 'POST' });
