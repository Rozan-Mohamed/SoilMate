import { apiFetch } from '@/lib/soilmate/api';
import type { ActivePlanDto } from '@/lib/compare/api';

/**
 * Dashboard & Reports (updated backend / Phase 3).
 * - GET /dashboard
 * - GET /reports/summary
 * - GET /journey
 */

export interface DashboardHeader {
  farmName: string;
  centerName: string | null;
  governorate: string | null;
  farmLocationText: string | null;
  landArea: { value: number; unit: string } | null;
  locationLabel: string | null;
  centerId?: string | null; // convenience for UI guards
}

export interface DashboardSeasonProgress {
  state: 'no_plan' | 'before_start' | 'in_season' | 'between_seasons' | 'complete';
  seasonIndex?: number | null;
  seasonLabel?: string | null;
  cropName?: string | null;
  dayInSeason?: number | null;
  daysInSeason?: number | null;
  percent?: number | null;
  isEstimate?: boolean;
  // legacy-ish fields some UI may still read
  currentSlot?: string;
  currentCropName?: string;
  dayOfSeason?: number;
  totalDays?: number;
}

export interface DashboardLand {
  areaWarning: string | null;
  dataThrough: {
    cropHealth: string | null;
    soilMoisture: string | null;
    heatWeather: string | null;
    heatSatellite: string | null;
  };
  tiles?: Array<{ id: string; label: string; value: unknown; display?: string; chip?: { id: string; label: string } }>;
  soilMoisture?: unknown;
  landRisk?: unknown;
}

export interface DashboardProtectionSeason {
  season: 'winter' | 'summer';
  label: string;
  level: string | null;
  groundCoverDays: number | null;
  bareDays: number | null;
  overlapDays: number | null;
  note?: string | null;
  value?: number;
  slot?: string;
  seasonLabel?: string;
}

export interface DashboardProtection {
  seasons: DashboardProtectionSeason[];
  overall?: { level?: string | null; fitLabel?: string | null };
  title?: string;
}

export interface DashboardWaterSeason {
  season: 'winter' | 'summer';
  label: string;
  waterMm: number | null;
  level: string | null;
  slot?: string;
  seasonLabel?: string;
  value?: number | null;
}

export interface DashboardWaterBySeason {
  seasons: DashboardWaterSeason[];
  totalMm: number | null;
  title?: string;
}

export interface DashboardResponse {
  header: DashboardHeader;
  hasActivePlan: boolean;
  seasonProgress: DashboardSeasonProgress;
  land: DashboardLand | null;
  protection: DashboardProtection;
  waterBySeason: DashboardWaterBySeason;
  plan: ActivePlanDto | null;
  reportsAvailable?: boolean;
}

export interface ReportResponse {
  generatedAt: string;
  center: { id: string; name: string; governorate?: string } | null;
  farm: unknown;
  plan: ActivePlanDto | null;
  soilMoistureReport: { observed: string; may_mean: string; to_verify: string } | null;
  landRiskReport: { observed: string[]; meaning: string[]; verify: string[]; confidence: string; summary?: string } | null;
  disclaimer: string;
  dataThrough?: Record<string, string | null>;
  limits?: string[];
  landStory?: unknown;
}

export function fetchDashboard(): Promise<DashboardResponse> {
  return apiFetch<DashboardResponse>('/dashboard', { method: 'GET', auth: 'identity' });
}

export function fetchReportSummary(): Promise<ReportResponse> {
  return apiFetch<ReportResponse>('/reports/summary', { method: 'GET', auth: 'identity' });
}

export function fetchJourney(): Promise<import('@/lib/soilmate/types').Journey> {
  return apiFetch('/journey', { method: 'GET', auth: 'identity' });
}
