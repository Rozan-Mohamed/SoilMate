'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch } from '@/lib/soilmate/api';
import type { Farm, Journey, JourneyStep } from '@/lib/soilmate/types';
import { en } from '@/strings/en';
import { useAuth } from './AuthProvider';

const DEFAULT_NEXT_ROUTE = '/explore';

type JourneyContextValue = {
  steps: JourneyStep[];
  nextRoute: string;
  loading: boolean;
  refresh: () => Promise<void>;
};

type JourneyState = {
  /** Identity this data belongs to. Old data is never shown to a new identity. */
  identity: string | null;
  steps: JourneyStep[];
  nextRoute: string;
};

const JourneyContext = createContext<JourneyContextValue | null>(null);

function isAbortError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name?: unknown }).name === 'AbortError'
  );
}

/** Normalize backend journey routes to frontend app routes. */
function normalizeRoute(route: string): string {
  if (route === '/rotation-lab') return '/lab';
  if (route === '/compare-plans') return '/compare';
  return route || DEFAULT_NEXT_ROUTE;
}

function normalizeJourney(j: Journey): Journey {
  return {
    ...j,
    nextRoute: normalizeRoute(j.nextRoute),
    steps: (j.steps || []).map((s) => ({ ...s, route: normalizeRoute(s.route) })),
  };
}

/**
 * Fallback when /journey is unavailable.
 */
function deriveJourney(farm: Farm): Journey {
  const hasCenter = farm.centerId !== null;
  const complete = farm.setupStatus === 'complete';
  const hasRotation = Boolean(farm.rotationInput?.winter || farm.rotationInput?.summer);
  const hasPlan = Boolean(farm.activePlanId);

  const steps: JourneyStep[] = [
    { id: 'explore', label: en.nav.explore, route: '/explore', status: hasCenter ? 'done' : 'current' },
    { id: 'farm', label: en.nav.farm, route: '/farm', status: complete ? 'done' : hasCenter ? 'current' : 'locked' },
    { id: 'lab', label: en.nav.lab, route: '/lab', status: hasRotation ? 'done' : complete ? 'current' : 'locked' },
    { id: 'compare', label: en.nav.compare, route: '/compare', status: hasPlan ? 'done' : hasRotation ? 'current' : 'locked' },
    { id: 'dashboard', label: en.nav.myDashboard, route: '/dashboard', status: hasPlan ? 'done' : 'locked' },
  ];
  const next = steps.find((s) => s.status === 'current')?.route || '/dashboard';
  return { steps, nextRoute: next };
}

async function fetchJourney(signal?: AbortSignal): Promise<Journey> {
  try {
    const j = await apiFetch<Journey>('/journey', { auth: 'identity', signal });
    return normalizeJourney(j);
  } catch {
    const farm = await apiFetch<Farm>('/farm', { auth: 'identity', signal });
    return deriveJourney(farm);
  }
}

export function JourneyProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const [journey, setJourney] = useState<JourneyState>({
    identity: null,
    steps: [],
    nextRoute: DEFAULT_NEXT_ROUTE,
  });
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const identityKey =
    status === 'loading' ? null : `${status}:${status === 'account' ? (user?.id ?? 'unknown') : 'guest'}`;

  useEffect(() => {
    if (identityKey === null) return;

    let cancelled = false;
    const controller = new AbortController();
    const run = async () => {
      const currentRequest = ++requestId.current;
      try {
        const result = await fetchJourney(controller.signal);
        if (cancelled || currentRequest !== requestId.current) return;
        setJourney({
          identity: identityKey,
          steps: result.steps,
          nextRoute: result.nextRoute || DEFAULT_NEXT_ROUTE,
        });
      } catch (err) {
        if (cancelled || isAbortError(err) || currentRequest !== requestId.current) return;
        // The navbar stays usable, but no step data is invented.
        setJourney({ identity: identityKey, steps: [], nextRoute: DEFAULT_NEXT_ROUTE });
      } finally {
        if (!cancelled && currentRequest === requestId.current) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [identityKey]);

  const refresh = useCallback(async (): Promise<void> => {
    if (identityKey === null) return;

    const currentRequest = ++requestId.current;
    setLoading(true);
    try {
      const result = await fetchJourney();
      if (currentRequest !== requestId.current) return;
      setJourney({
        identity: identityKey,
        steps: result.steps,
        nextRoute: result.nextRoute || DEFAULT_NEXT_ROUTE,
      });
    } catch (err) {
      if (isAbortError(err) || currentRequest !== requestId.current) return;
      setJourney({ identity: identityKey, steps: [], nextRoute: DEFAULT_NEXT_ROUTE });
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [identityKey]);

  // Derive from the current identity instead of clearing state inside an effect:
  // another identity's steps are never visible, not even for one render.
  const value = useMemo<JourneyContextValue>(() => {
    const ready = journey.identity === identityKey;
    return {
      steps: ready ? journey.steps : [],
      nextRoute: ready ? journey.nextRoute : DEFAULT_NEXT_ROUTE,
      loading: loading || identityKey === null || !ready,
      refresh,
    };
  }, [journey, identityKey, loading, refresh]);

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney(): JourneyContextValue {
  const value = useContext(JourneyContext);
  if (!value) throw new Error('useJourney must be used inside <JourneyProvider>.');
  return value;
}
