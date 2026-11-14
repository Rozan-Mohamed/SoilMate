import { apiFetch } from '@/lib/soilmate/api';
import { getOrCreateGuestId } from '@/lib/soilmate/guest';
import { mockEnabled } from '@/lib/soilmate/mock';
import type { AuthResponse } from '@/lib/soilmate/types';
import { mockForgotPassword, mockLogin, mockSignup } from './mock';
import {
  toLoginRequest,
  toSignupRequest,
  type LoginValues,
  type SignupValues,
} from './validation';

/**
 * The guest header is sent on signup and login only when a guest identity
 * exists. `getOrCreateGuestId` reuses the Stage 0A id; it is never duplicated
 * here. A failed request never clears it — AuthProvider does that after a
 * successful response that contains `guestData`.
 */
function guestIdentity(): {
  guestId: string | undefined;
  headers: Record<string, string> | undefined;
} {
  const guestId = getOrCreateGuestId() ?? undefined;
  return {
    guestId,
    headers: guestId ? { 'X-Guest-Id': guestId } : undefined,
  };
}

export async function signup(values: SignupValues): Promise<AuthResponse> {
  const request = toSignupRequest(values);
  const guest = guestIdentity();

  if (mockEnabled()) return mockSignup(request, guest.guestId);

  return apiFetch<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: request,
    auth: 'none',
    headers: guest.headers,
  });
}

export async function login(values: LoginValues): Promise<AuthResponse> {
  const request = toLoginRequest(values);
  const guest = guestIdentity();

  if (mockEnabled()) return mockLogin(request, guest.guestId);

  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: request,
    auth: 'none',
    headers: guest.headers,
  });
}

/** The contract's stub always returns the same generic 200 response. */
export async function forgotPassword(email: string): Promise<void> {
  if (mockEnabled()) {
    mockForgotPassword();
    return;
  }

  await apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: { email: email.trim() },
    auth: 'none',
  });
}
