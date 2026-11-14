// Development-only auth mock. It is used only when
// NEXT_PUBLIC_MOCK_PLANNED=true and must never replace the real API in
// production. Accounts live in localStorage so signup -> logout -> login can be
// tried while the website backend is still being built.
//
// A guest id in the request means "a farm may be waiting". To make the
// documented adopted/discarded notice testable without the farm endpoints, the
// mock treats the first merge into an account as adopted and later merges as
// discarded (the account already owns a farm).
import type {
  AuthResponse,
  GuestData,
  LoginRequest,
  Me,
  SignupRequest,
} from '@/lib/soilmate/types';
import { ApiError } from '@/lib/soilmate/errors';
import { safeGet, safeSet } from '@/lib/soilmate/storage';
import { en } from '@/strings/en';

const ACCOUNTS_KEY = 'soilmate:mock-auth-accounts';

type MockAccount = {
  id: string;
  fullName: string;
  email: string;
  password: string;
  hasFarm: boolean;
  createdAt: string;
};

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isAccount(value: unknown): value is MockAccount {
  if (typeof value !== 'object' || value === null) return false;
  const account = value as Partial<MockAccount>;
  return (
    typeof account.id === 'string' &&
    typeof account.fullName === 'string' &&
    typeof account.email === 'string' &&
    typeof account.password === 'string' &&
    typeof account.hasFarm === 'boolean' &&
    typeof account.createdAt === 'string'
  );
}

function readAccounts(): MockAccount[] {
  const raw = safeGet(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isAccount) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: MockAccount[]): void {
  safeSet(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function userOf(account: MockAccount): Me {
  return {
    id: account.id,
    fullName: account.fullName,
    email: account.email,
    phone: null,
    avatarUrl: null,
    emailVerified: false,
    createdAt: account.createdAt,
  };
}

function expiry(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function mockSignup(request: SignupRequest, guestId?: string): AuthResponse {
  const email = normalizeEmail(request.email);
  const accounts = readAccounts();

  if (accounts.some((account) => account.email === email)) {
    throw new ApiError(409, 'EMAIL_ALREADY_REGISTERED', 'Email already registered');
  }

  const account: MockAccount = {
    id: randomId(),
    fullName: request.fullName.trim(),
    email,
    password: request.password,
    hasFarm: Boolean(guestId),
    createdAt: new Date().toISOString(),
  };
  writeAccounts([...accounts, account]);

  return {
    token: `mock-token-${account.id}-${Date.now()}`,
    expiresAt: expiry(30),
    user: userOf(account),
    guestData: guestId ? 'adopted' : undefined,
  };
}

export function mockLogin(request: LoginRequest, guestId?: string): AuthResponse {
  const email = normalizeEmail(request.email);
  const accounts = readAccounts();
  const account = accounts.find((candidate) => candidate.email === email);

  // Validate the credentials before touching any guest or account data.
  if (!account || account.password !== request.password) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', en.api.invalidCredentials);
  }

  let guestData: GuestData | undefined;
  if (guestId) {
    guestData = account.hasFarm ? 'discarded' : 'adopted';
    if (!account.hasFarm) {
      account.hasFarm = true;
      writeAccounts(accounts);
    }
  }

  return {
    token: `mock-token-${account.id}-${Date.now()}`,
    expiresAt: expiry(request.rememberMe ? 30 : 1),
    user: userOf(account),
    guestData,
  };
}

export function mockForgotPassword(): { message: string } {
  return { message: en.auth.forgot.success };
}
