import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AuthProvider } from '@/providers/AuthProvider';
import { JourneyProvider } from '@/providers/JourneyProvider';
import { mockCrops, mockGetOptions } from '@/lib/profile/mock';
import { clearGuestId } from '@/lib/soilmate/guest';
import { clearToken, getToken, setToken } from '@/lib/soilmate/token';
import { en } from '@/strings/en';
import { ProfileView } from './ProfileView';

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
  usePathname: () => '/profile',
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

// jsdom does not implement the native <dialog> methods the Modal uses.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
  };
}

const ACCOUNT = {
  id: 'user-1',
  fullName: 'Alex Henderson',
  email: 'demo.farmer@example.com',
  phone: null as string | null,
  avatarUrl: null as string | null,
  emailVerified: false,
  createdAt: '2026-11-06T10:00:00.000Z',
  passwordChangedAt: '2026-08-01T00:00:00.000Z',
};

const FARM = {
  id: 'farm-1',
  setupStatus: 'none' as const,
  centerId: 'desouk' as const,
  farmName: null as string | null,
  farmLocationText: null as string | null,
  landArea: null as { value: number; unit: 'acres' | 'hectares' } | null,
  currentCrops: [] as string[],
  currentCropsDetail: [] as { id: string; name: string; image: { thumbUrl: string; alt: string } }[],
  waterSource: null as string | null,
  waterSourceOther: null as string | null,
  waterAvailability: null as string | null,
  soilType: null as string | null,
  equipment: [] as string[],
  seasonsPerYear: null as number | null,
  priorities: [] as string[],
  updatedAt: '2026-11-06T10:00:00.000Z',
};

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

const calls: { url: string; method: string; body: unknown }[] = [];

let account: typeof ACCOUNT = { ...ACCOUNT };
let farm: typeof FARM = { ...FARM };
let failProfilePatch = false;

function installFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ url, method, body });

      if (url.endsWith('/auth/logout')) return new Response(null, { status: 204 });
      if (url.endsWith('/me/password')) return new Response(null, { status: 204 });
      if (url.endsWith('/me') && method === 'DELETE') return new Response(null, { status: 204 });
      if (url.endsWith('/me') && method === 'PATCH') {
        if (failProfilePatch) {
          return json({ error: { code: 'INTERNAL', message: 'Boom' } }, { status: 500 });
        }
        account = { ...account, ...(body as Partial<typeof ACCOUNT>) };
        return json(account);
      }
      if (url.endsWith('/me')) return json(account);
      if (url.endsWith('/farm') && method === 'PATCH') {
        farm = { ...farm, ...(body as Partial<typeof FARM>) };
        return json(farm);
      }
      if (url.endsWith('/farm')) return json(farm);
      if (url.endsWith('/meta/options')) return json(mockGetOptions());
      if (url.includes('/crops')) return json({ crops: mockCrops() });
      if (url.endsWith('/journey')) return json({ steps: [], nextRoute: '/explore' });
      return json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 });
    }),
  );
}

let root: Root;
let container: HTMLElement;

async function renderProfile() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      <AuthProvider>
        <JourneyProvider>
          <ProfileView />
        </JourneyProvider>
      </AuthProvider>,
    );
  });
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

async function type(name: string, value: string) {
  const input = container.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!input) throw new Error(`Input ${name} not found`);

  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function clickButton(label: string) {
  const button = Array.from(container.querySelectorAll('button')).find((candidate) =>
    candidate.textContent?.includes(label),
  );
  if (!button) throw new Error(`Button "${label}" not found`);

  await act(async () => {
    button.click();
  });
}

async function clickText(label: string) {
  const element = Array.from(container.querySelectorAll<HTMLElement>('button, a')).find(
    (candidate) => candidate.textContent?.includes(label),
  );
  if (!element) throw new Error(`Element "${label}" not found`);

  await act(async () => {
    element.click();
  });
}

function lastCall(path: string, method: string) {
  return [...calls].reverse().find((call) => call.url.endsWith(path) && call.method === method);
}

describe('profile page', () => {
  beforeEach(async () => {
    calls.length = 0;
    account = { ...ACCOUNT };
    farm = { ...FARM };
    failProfilePatch = false;
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    clearToken();
    clearGuestId();
    installFetch();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    clearToken();
    clearGuestId();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('shows the account prompt to guests without calling /me', async () => {
    await renderProfile();

    await waitFor(() =>
      expect(container.textContent).toContain(en.profile.guest.title),
    );
    expect(calls.some((call) => call.url.endsWith('/me'))).toBe(false);
    expect(container.textContent).toContain(en.profile.guest.signup);
    expect(container.textContent).toContain(en.profile.guest.login);
  });

  it('loads the account and the farm for a signed-in farmer', async () => {
    setToken('jwt-1', false);
    await renderProfile();

    await waitFor(() => expect(container.textContent).toContain(ACCOUNT.fullName));
    expect(container.textContent).toContain(ACCOUNT.email);
    expect(container.textContent).toContain(en.profile.personal.title);
    expect(container.textContent).toContain(en.profile.farm.title);
    expect(container.textContent).toContain('Data area');
    expect(container.textContent).toContain('Desouk');
    expect(container.textContent).toContain('Last updated 3 months ago');
  });

  it('saves the profile and the farm together', async () => {
    setToken('jwt-1', false);
    await renderProfile();
    await waitFor(() => expect(container.textContent).toContain(ACCOUNT.fullName));

    await type('fullName', 'New Farmer Name');
    await type('phone', '+201000000000');
    await type('farmName', 'My Farm');
    await clickButton(en.profile.saveAll);

    await waitFor(() => expect(container.textContent).toContain(en.profile.saved));

    expect(lastCall('/me', 'PATCH')?.body).toEqual({
      fullName: 'New Farmer Name',
      phone: '+201000000000',
    });
    expect(lastCall('/farm', 'PATCH')?.body).toMatchObject({
      farmName: 'My Farm',
      farmLocationText: null,
      currentCrops: [],
      priorities: [],
    });
  });

  it('blocks the save and shows the field error when the name is empty', async () => {
    setToken('jwt-1', false);
    await renderProfile();
    await waitFor(() => expect(container.textContent).toContain(ACCOUNT.fullName));

    await type('fullName', '');
    await clickButton(en.profile.saveAll);

    await waitFor(() =>
      expect(container.textContent).toContain(en.profile.errors.fullNameRequired),
    );
    expect(lastCall('/me', 'PATCH')).toBeUndefined();
    expect(lastCall('/farm', 'PATCH')).toBeUndefined();
  });

  it('keeps the farm save when the profile save fails', async () => {
    setToken('jwt-1', false);
    await renderProfile();
    await waitFor(() => expect(container.textContent).toContain(ACCOUNT.fullName));

    failProfilePatch = true;
    await type('fullName', 'New Farmer Name');
    await clickButton(en.profile.saveAll);

    // The profile failed, the farm was still saved.
    await waitFor(() => expect(container.textContent).toContain(en.profile.errors.saveProfile));
    expect(lastCall('/farm', 'PATCH')).toBeDefined();
  });

  it('changes the password and sends the farmer back to the login page', async () => {
    setToken('jwt-1', false);
    await renderProfile();
    await waitFor(() => expect(container.textContent).toContain(ACCOUNT.fullName));

    await clickButton(en.profile.account.changePassword);
    await waitFor(() =>
      expect(container.querySelector('input[name="currentPassword"]')).not.toBeNull(),
    );

    await type('currentPassword', 'Old1Pass');
    await type('newPassword', 'Str0ngPass1');
    await type('confirmNewPassword', 'Str0ngPass1');
    await clickButton(en.profile.password.submit);

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/login'));

    expect(lastCall('/me/password', 'POST')?.body).toEqual({
      currentPassword: 'Old1Pass',
      newPassword: 'Str0ngPass1',
      confirmNewPassword: 'Str0ngPass1',
    });
    expect(getToken()).toBeNull();
    expect(window.sessionStorage.getItem('soilmate:notice')).toBe(en.profile.password.updated);
  });

  it('deletes the account only when the email matches', async () => {
    setToken('jwt-1', false);
    await renderProfile();
    await waitFor(() => expect(container.textContent).toContain(ACCOUNT.fullName));

    await clickButton(en.profile.danger.delete);
    await waitFor(() =>
      expect(container.querySelector('input[name="confirmEmail"]')).not.toBeNull(),
    );

    await type('confirmEmail', 'wrong@example.com');
    await clickButton(en.profile.delete.submit);

    await waitFor(() => expect(container.textContent).toContain(en.profile.delete.mismatch));
    expect(lastCall('/me', 'DELETE')).toBeUndefined();

    await type('confirmEmail', ACCOUNT.email);
    await clickButton(en.profile.delete.submit);

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/'));
    expect(lastCall('/me', 'DELETE')?.body).toEqual({ confirmEmail: ACCOUNT.email });
    expect(getToken()).toBeNull();
  });

  it('adds a main crop and a priority from the pickers', async () => {
    setToken('jwt-1', false);
    await renderProfile();
    await waitFor(() => expect(container.textContent).toContain(ACCOUNT.fullName));

    await clickText(en.profile.farm.addCrop);
    await waitFor(() => expect(container.textContent).toContain('Field Corn'));
    await clickText('Field Corn');
    await clickButton(en.ui.done);

    await waitFor(() => expect(container.textContent).toContain('Field Corn'));
    expect(container.textContent).toContain(en.profile.farm.cropsSelected(1));

    await clickText('Save Water');
    await clickButton(en.profile.save);

    await waitFor(() => expect(container.textContent).toContain(en.profile.saved));
    expect(lastCall('/farm', 'PATCH')?.body).toMatchObject({
      currentCrops: ['field-corn'],
      priorities: ['save_water'],
    });
  });
});
