import { apiRequest } from './client';
import type { AnswerResponse, CompleteResponse, SkipResponse } from './types';

export const answer = (attemptId: string, questionId: string, choiceKey: string) =>
  apiRequest<AnswerResponse>(`/attempts/${attemptId}/answer`, {
    method: 'POST',
    body: { questionId, choiceKey },
  });

export const skip = (attemptId: string, questionId: string) =>
  apiRequest<SkipResponse>(`/attempts/${attemptId}/skip`, { method: 'POST', body: { questionId } });

/** Idempotent on the server: calling it twice returns the same result. */
export const complete = (attemptId: string) =>
  apiRequest<CompleteResponse>(`/attempts/${attemptId}/complete`, { method: 'POST' });

export const abandon = (attemptId: string) =>
  apiRequest<{ status: 'abandoned' }>(`/attempts/${attemptId}/abandon`, { method: 'POST' });
