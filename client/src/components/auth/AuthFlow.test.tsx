import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { AuthResponse, Me } from '@/lib/soilmate/types';
import { clearGuestId, getOrCreateGuestId } from '@/lib/soilmate/guest';
import { clearToken, getToken, setToken } from '@/lib/soilmate/token';
import { AuthProvider } from '@/providers/AuthProvider';
import { JourneyProvider } from '@/providers/JourneyProvider';
import { en } from '@/strings/en';
import { LoginForm } from './LoginForm';
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
  usePathname: () => '/login',
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

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const user: Me = {
  id: 'user-1',
  fullName: 'Alex Henderson',
  email: 'alex@example.com',
  phone: null,
  avatarUrl: null,
  emailVerified: false,
  createdAt: '2026-11-12T10:00:00.000Z',
};

const authResponse = (guestData?: AuthResponse['guestData']): AuthResponse => ({
  token: 'jwt-1',
  expiresAt: '2026-12-12T10:00:00.000Z',
  user,
  ...(guestData ? { guestData } : {}),
});

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

const notFound = () => json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 });

type Mounted = { root: Root; container: HTMLElement };
const mounted: Mounted[] = [];

async function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  mounted.push({ root, container });

  await act(async () => {
    root.render(node);
  });

  return container;
}

async function waitFor(check: () => void, timeout = 3000) {
  const start = Date.now();
  for (;;) {
    try {
      check();
      return;
    } catch (error) {
      if (Date.now() - start > timeout) throw error;
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
    }
  }
}

async function type(container: HTMLElement, name: string, value: string) {
  const input = container.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!input) throw new Error(`Input ${name} not found`);

  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function clickCheckbox(container: HTMLElement, name: string) {
  const input = container.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!input) throw new Error(`Checkbox ${name} not found`);

  await act(async () => {
    input.click();
  });
}

async function submit(container: HTMLElement) {
  const form = container.querySelector('form');
  if (!form) throw new Error('Form not found');

  await act(async () => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function renderLogin() {
  return render(
    <AuthProvider>
      <JourneyProvider>
        <LoginForm />
      </JourneyProvider>
    </AuthProvider>,
  );
}

function renderSignup() {
  return render(
    <AuthProvider>
      <JourneyProvider>
        <SignupForm />
      </JourneyProvider>
    </AuthProvider>,
  );
}

describe('auth screens with the real providers', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    clearToken();
    clearGuestId();
    vi.clearAllMocks();
  });

  afterEach(() => {
    for (const { root, container } of mounted.splice(0)) {
      act(() => root.unmount());
      container.remove();
    }
    vi.unstubAllGlobals();
    clearToken();
    clearGuestId();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('logs in, sends the guest id, clears it after a discarded merge, and redirects to nextRoute', async () => {
    let loginInit: RequestInit | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input, init) => {
        const url = String(input);
        if (url.endsWith('/auth/login')) {
          loginInit = init;
          return json(authResponse('discarded'));
        }
        if (url.endsWith('/journey')) return json({ steps: [], nextRoute: '/farm' });
        return notFound();
      }),
    );

    const container = await renderLogin();
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull());
    const guestId = getOrCreateGuestId();

    await type(container, 'email', 'alex@example.com');
    await type(container, 'password', 'Str0ngPass1');
    await submit(container);

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/farm'));

    const headers = new Headers(loginInit?.headers);
    expect(headers.get('X-Guest-Id')).toBe(guestId);
    expect(JSON.parse(String(loginInit?.body))).toEqual({
      email: 'alex@example.com',
      password: 'Str0ngPass1',
      rememberMe: true,
    });
    expect(getToken()).toBe('jwt-1');
    expect(window.localStorage.getItem('guestId')).toBeNull();
    expect(window.sessionStorage.getItem('soilmate:notice')).toBe(en.auth.notice);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('shows the single INVALID_CREDENTIALS banner and leaves the guest id alone', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) => {
        const url = String(input);
        if (url.endsWith('/auth/login')) {
          return json(
            { error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } },
            { status: 401 },
          );
        }
        if (url.endsWith('/journey')) return json({ steps: [], nextRoute: '/farm' });
        return notFound();
      }),
    );

    const container = await renderLogin();
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull());
    const guestId = getOrCreateGuestId();

    await type(container, 'email', 'alex@example.com');
    await type(container, 'password', 'WrongPass1');
    await submit(container);

    await waitFor(() =>
      expect(container.textContent).toContain('Email or password is incorrect.'),
    );
    expect(getOrCreateGuestId()).toBe(guestId);
    expect(router.push).not.toHaveBeenCalled();
  });

  it('redirects an already signed-in visitor to /profile', async () => {
    setToken('existing-jwt', false);
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) => {
        const url = String(input);
        if (url.endsWith('/me')) return json(user);
        if (url.endsWith('/journey')) return json({ steps: [], nextRoute: '/farm' });
        return notFound();
      }),
    );

    const container = await renderLogin();

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/profile'));
    expect(container.querySelector('form')).toBeNull();
  });

  it('creates an account with remember-me, an adopted guest farm and a journey redirect', async () => {
    let signupInit: RequestInit | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input, init) => {
        const url = String(input);
        if (url.endsWith('/auth/signup')) {
          signupInit = init;
          return json(authResponse('adopted'), { status: 201 });
        }
        if (url.endsWith('/journey')) return json({ steps: [], nextRoute: '/farm' });
        return notFound();
      }),
    );

    const container = await renderSignup();
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull());
    const guestId = getOrCreateGuestId();

    const submitButton = container.querySelector<HTMLButtonElement>('button[type="submit"]');
    expect(submitButton?.disabled).toBe(true);

    await type(container, 'fullName', 'Alex Henderson');
    await type(container, 'email', 'alex@example.com');
    await type(container, 'password', 'Str0ngPass1');
    await type(container, 'confirmPassword', 'Str0ngPass1');
    await clickCheckbox(container, 'acceptedTerms');

    await waitFor(() => expect(submitButton?.disabled).toBe(false));
    await submit(container);

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/farm'));

    const headers = new Headers(signupInit?.headers);
    expect(headers.get('X-Guest-Id')).toBe(guestId);
    expect(JSON.parse(String(signupInit?.body))).toEqual({
      fullName: 'Alex Henderson',
      email: 'alex@example.com',
      password: 'Str0ngPass1',
      confirmPassword: 'Str0ngPass1',
      acceptedTerms: true,
    });
    expect(window.localStorage.getItem('token')).toBe('jwt-1');
    expect(window.localStorage.getItem('guestId')).toBeNull();
    expect(window.sessionStorage.getItem('soilmate:notice')).toBeNull();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('shows client-side field errors and does not call the API for an empty signup', async () => {
    let authCalls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) => {
        const url = String(input);
        if (url.endsWith('/auth/signup')) authCalls += 1;
        if (url.endsWith('/journey')) return json({ steps: [], nextRoute: '/farm' });
        return notFound();
      }),
    );

    const container = await renderSignup();
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull());

    await submit(container);

    await waitFor(() => {
      expect(container.textContent).toContain('Enter your full name.');
      expect(container.textContent).toContain('Enter your email address.');
      expect(container.textContent).toContain('Enter your password.');
      expect(container.textContent).toContain('Re-enter your password.');
      expect(container.textContent).toContain(
        'Please accept the Terms of Service and Privacy Policy.',
      );
    });
    expect(authCalls).toBe(0);
  });

  it('falls back to /explore when GET /journey fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) => {
        const url = String(input);
        if (url.endsWith('/auth/login')) return json(authResponse());
        if (url.endsWith('/journey')) {
          return json({ error: { code: 'INTERNAL', message: 'Journey unavailable' } }, { status: 500 });
        }
        return notFound();
      }),
    );

    const container = await renderLogin();
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull());

    await type(container, 'email', 'alex@example.com');
    await type(container, 'password', 'Str0ngPass1');
    await submit(container);

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/explore'));
  });

  it('shows the already-registered message and a login link after a 409', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) => {
        const url = String(input);
        if (url.endsWith('/auth/signup')) {
          return json(
            { error: { code: 'EMAIL_ALREADY_REGISTERED', message: 'Email already registered' } },
            { status: 409 },
          );
        }
        if (url.endsWith('/journey')) return json({ steps: [], nextRoute: '/farm' });
        return notFound();
      }),
    );

    const container = await renderSignup();
    await waitFor(() => expect(container.querySelector('form')).not.toBeNull());
    const guestId = getOrCreateGuestId();

    await type(container, 'fullName', 'Alex Henderson');
    await type(container, 'email', 'alex@example.com');
    await type(container, 'password', 'Str0ngPass1');
    await type(container, 'confirmPassword', 'Str0ngPass1');
    await clickCheckbox(container, 'acceptedTerms');
    await submit(container);

    await waitFor(() => {
      expect(container.textContent).toContain(en.auth.errors.emailTaken);
      const link = Array.from(container.querySelectorAll('a')).find(
        (candidate) => candidate.textContent === en.auth.errors.loginInstead,
      );
      expect(link?.getAttribute('href')).toBe('/login');
    });
    expect(getOrCreateGuestId()).toBe(guestId);
    expect(router.push).not.toHaveBeenCalled();
  });
});
