import { apiFetch } from '@/lib/soilmate/api';
import type {
  RotationLabPlansResponse,
  RotationLabSeason,
  RotationLabUiText,
} from '@/lib/lab/types';

/**
 * Compare / Plan selection (updated backend / Phase 2).
 *
 * - Plans come from GET /rotation-lab/plans?center=&winter=&summer=
 * - POST /plans/choose { planKey, startDate? } (identity) -> { activePlan }
 * - GET /plans/active (identity) -> { activePlan }
 */

export type PlanKey = 'current' | 'water_saving' | 'soil_health';

export type ActivePlanDto = {
  id: string;
  planKey: PlanKey;
  key: string | null;
  input: { center: string; winter: string; summer: string } | null;
  startDate: string | null;
  chosenAt: string | null;
  dataVersion: string | null;
  plan: import('@/lib/lab/types').RotationLabPlan | null;
  dataChangedSinceChosen?: boolean;
};

export function fetchRotationPlans(params: {
  center: string;
  winter?: RotationLabSeason;
  summer?: RotationLabSeason;
}): Promise<RotationLabPlansResponse> {
  const q = new URLSearchParams({ center: params.center });
  if (params.winter) q.set('winter', params.winter);
  if (params.summer) q.set('summer', params.summer);
  return apiFetch<RotationLabPlansResponse>(`/rotation-lab/plans?${q.toString()}`, { auth: 'none' });
}

export function fetchRotationLabUiText(): Promise<RotationLabUiText> {
  return apiFetch<RotationLabUiText>('/rotation-lab/ui-text', { auth: 'none' });
}

export function choosePlan(planKey: PlanKey, startDate?: string): Promise<{ activePlan: ActivePlanDto }> {
  const body: { planKey: PlanKey; startDate?: string } = { planKey };
  if (startDate) body.startDate = startDate;
  return apiFetch<{ activePlan: ActivePlanDto }>('/plans/choose', {
    method: 'POST',
    body,
    auth: 'identity',
  });
}

export function fetchActivePlan(): Promise<{ activePlan: ActivePlanDto | null }> {
  return apiFetch<{ activePlan: ActivePlanDto | null }>('/plans/active', { auth: 'identity' });
}
