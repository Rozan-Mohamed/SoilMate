import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { en } from '@/strings/en';
import { SignupForm } from './SignupForm';

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/signup',
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const auth = vi.hoisted(() => ({
  status: 'guest' as 'guest' | 'account' | 'loading',
  user: null,
  applyAuthResponse: vi.fn(() => undefined),
  logout: vi.fn(),
  refreshUser: vi.fn(),
  setUser: vi.fn(),
}));
vi.mock('@/providers/AuthProvider', () => ({ useAuth: () => auth }));

const journey = vi.hoisted(() => ({
  steps: [] as unknown[],
  nextRoute: '/explore',
  loading: false,
  refresh: vi.fn(),
}));
vi.mock('@/providers/JourneyProvider', () => ({ useJourney: () => journey }));

const signup = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/api', () => ({ signup }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

async function renderForm() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<SignupForm />);
  });
}

async function type(name: string, value: string) {
  const input = container.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!input) throw new Error(`Input ${name} not found`);

  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function checkTerms() {
  const input = container.querySelector<HTMLInputElement>('input[name="acceptedTerms"]');
  if (!input) throw new Error('Terms checkbox not found');
  await act(async () => {
    input.click();
  });
}

async function submit() {
  const form = container.querySelector('form');
  if (!form) throw new Error('Form not found');
  await act(async () => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function confirmErrorText(): string | null {
  const input = container.querySelector<HTMLInputElement>('input[name="confirmPassword"]');
  const id = input?.getAttribute('aria-describedby');
  const error = id ? container.querySelector(`#${CSS.escape(id)}`) : null;
  return error?.textContent ?? null;
}

async function fillValidForm() {
  await type('fullName', 'Alex Henderson');
  await type('email', 'alex@example.com');
  await type('password', 'Str0ngPass1');
  await type('confirmPassword', 'Str0ngPass1');
  await checkTerms();
}

describe('sign up confirm password', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    auth.status = 'guest';
    signup.mockResolvedValue({
      token: 'jwt-1',
      expiresAt: '2026-12-12T10:00:00.000Z',
      user: {
        id: 'user-1',
        fullName: 'Alex Henderson',
        email: 'alex@example.com',
        phone: null,
        avatarUrl: null,
        emailVerified: false,
        createdAt: '2026-11-12T10:00:00.000Z',
      },
    });
    await renderForm();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('accepts matching passwords', async () => {
    await fillValidForm();
    await submit();

    expect(signup).toHaveBeenCalledTimes(1);
    expect(confirmErrorText()).toBeNull();
  });

  it('rejects different passwords and shows the message under the field', async () => {
    await type('fullName', 'Alex Henderson');
    await type('email', 'alex@example.com');
    await type('password', 'Str0ngPass1');
    await type('confirmPassword', 'Str0ngPass2');
    await checkTerms();
    await submit();

    expect(signup).not.toHaveBeenCalled();
    expect(confirmErrorText()).toBe(en.auth.errors.confirmMismatch);
  });

  it('revalidates when the password changes after the confirm field was filled', async () => {
    await type('fullName', 'Alex Henderson');
    await type('email', 'alex@example.com');
    await type('password', 'Str0ngPass1');
    await type('confirmPassword', 'Str0ngPass2');
    await checkTerms();
    await submit();

    expect(confirmErrorText()).toBe(en.auth.errors.confirmMismatch);

    // Changing the password keeps the two fields apart: the error stays.
    await type('password', 'Str0ngPass3');
    expect(confirmErrorText()).toBe(en.auth.errors.confirmMismatch);

    // Matching the confirm field clears the error.
    await type('confirmPassword', 'Str0ngPass3');
    expect(confirmErrorText()).toBeNull();
  });

  it('does not call the signup API while the passwords differ', async () => {
    await type('fullName', 'Alex Henderson');
    await type('email', 'alex@example.com');
    await type('password', 'Str0ngPass1');
    await type('confirmPassword', 'Str0ngPass2');
    await checkTerms();
    await submit();

    expect(signup).not.toHaveBeenCalled();
  });

  it('calls the signup API once every field is valid', async () => {
    await fillValidForm();
    await submit();

    expect(signup).toHaveBeenCalledTimes(1);
    expect(signup).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'Str0ngPass1',
        confirmPassword: 'Str0ngPass1',
        acceptedTerms: true,
      }),
    );
  });
});
