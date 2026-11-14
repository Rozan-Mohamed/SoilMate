'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch } from '@/lib/soilmate/api';
import { ApiError } from '@/lib/soilmate/errors';
import { clearGuestId, getOrCreateGuestId, resetGuestId } from '@/lib/soilmate/guest';
import { clearToken, getToken, setToken } from '@/lib/soilmate/token';
import type { AuthResponse, GuestData, Me } from '@/lib/soilmate/types';

type AuthStatus = 'loading' | 'guest' | 'account';

type AuthContextValue = {
  status: AuthStatus;
  user: Me | null;
  applyAuthResponse: (
    resp: Pick<AuthResponse, 'token' | 'user' | 'guestData'>,
    remember: boolean,
  ) => GuestData | undefined;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: Me) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUserState] = useState<Me | null>(null);

  useEffect(() => {
    let cancelled = false;

    const becomeGuest = () => {
      clearToken();
      getOrCreateGuestId();
      if (cancelled) return;
      setUserState(null);
      setStatus('guest');
    };

    const boot = async () => {
      if (!getToken()) {
        getOrCreateGuestId();
        if (!cancelled) {
          setUserState(null);
          setStatus('guest');
        }
        return;
      }

      try {
        const me = await apiFetch<Me>('/me', { auth: 'identity' });
        if (!cancelled) {
          setUserState(me);
          setStatus('account');
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          becomeGuest();
          return;
        }
        // The API may be temporarily unreachable. Keep the token; the next
        // refresh or navigation can restore the account.
        if (getToken()) {
          setUserState(null);
          setStatus('account');
        } else {
          becomeGuest();
        }
      }
    };

    void boot();

    const onUnauthorized = () => {
      becomeGuest();
    };
    window.addEventListener('soilmate:unauthorized', onUnauthorized);

    return () => {
      cancelled = true;
      window.removeEventListener('soilmate:unauthorized', onUnauthorized);
    };
  }, []);

  const applyAuthResponse = useCallback(
    (
      resp: Pick<AuthResponse, 'token' | 'user' | 'guestData'>,
      remember: boolean,
    ): GuestData | undefined => {
      setToken(resp.token, remember);
      // The docs are explicit: remove the guest id only when the response
      // contains guestData (including "none"), never on a failed login.
      if (resp.guestData !== undefined) clearGuestId();
      setUserState(resp.user);
      setStatus('account');
      return resp.guestData;
    },
    [],
  );

  const logout = useCallback(async () => {
    if (getToken()) {
      try {
        await apiFetch<void>('/auth/logout', { method: 'POST', auth: 'identity' });
      } catch {
        // Logout is stateless; clearing the browser token is what matters.
      }
    }
    clearToken();
    // A new guest identity after logout keeps the old account data separate.
    resetGuestId();
    setUserState(null);
    setStatus('guest');
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getToken()) return;
    const me = await apiFetch<Me>('/me', { auth: 'identity' });
    setUserState(me);
    setStatus('account');
  }, []);

  const setUser = useCallback((nextUser: Me) => {
    setUserState(nextUser);
    setStatus('account');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, applyAuthResponse, logout, refreshUser, setUser }),
    [status, user, applyAuthResponse, logout, refreshUser, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>.');
  return value;
}
