import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { en } from '@/strings/en';

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
  usePathname: () => '/',
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

const auth = vi.hoisted(() => ({ status: 'guest' as 'guest' | 'account' | 'loading' }));
vi.mock('@/providers/AuthProvider', () => ({ useAuth: () => auth }));

const journey = vi.hoisted(() => ({
  nextRoute: '/farm',
  loading: false,
  steps: [] as unknown[],
  refresh: vi.fn(),
}));
vi.mock('@/providers/JourneyProvider', () => ({ useJourney: () => journey }));

import HomePage from '@/app/page';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

async function render() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<HomePage />);
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

describe('home page', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    auth.status = 'guest';
    journey.nextRoute = '/farm';
    journey.loading = false;
    await render();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders every section of the page', () => {
    const text = container.textContent ?? '';

    // Hero
    expect(text).toContain('Understand Your Land.');
    expect(text).toContain('Grow a Better Future.');
    expect(text).toContain(en.home.hero.text);
    expect(text).toContain(en.home.hero.sideLine);
    expect(text).toContain(en.home.hero.cta);

    // Steps
    expect(text).toContain(en.home.steps.title);
    expect(text).toContain(en.home.steps.subtitle);
    for (const step of en.home.steps.items) {
      expect(text).toContain(step.title);
      expect(text).toContain(step.subtitle);
      expect(text).toContain(step.body);
      expect(text).toContain(step.link);
    }

    // Why farmers trust NASA data
    expect(text).toContain(en.home.trust.title);
    for (const card of en.home.trust.cards) {
      expect(text).toContain(card.title);
      expect(text).toContain(card.body);
    }
    expect(text).toContain(en.home.trust.disclaimer);

    // CTA band and footer
    expect(text).toContain(en.home.cta.title);
    expect(text).toContain(en.home.cta.button);
    expect(text).toContain(en.home.cta.areas);
    expect(text).toContain(en.home.footer.copyright);
  });

  it('keeps every step link visible for guests', () => {
    const hrefs = Array.from(container.querySelectorAll('a')).map((link) =>
      link.getAttribute('href'),
    );

    for (const step of en.home.steps.items) {
      expect(hrefs).toContain(step.href);
    }
  });

  it('links only to pages that exist', () => {
    const allowed = new Set([
      '/',
      '/explore',
      '/farm',
      '/lab',
      '/compare',
      '/dashboard',
      '/learn',
    ]);
    const hrefs = Array.from(container.querySelectorAll('a')).map((link) =>
      link.getAttribute('href'),
    );

    for (const href of hrefs) {
      expect(allowed.has(href ?? '')).toBe(true);
    }
  });

  it('drops every unsupported claim from the mockup', () => {
    const text = container.textContent ?? '';

    const removed = [
      'Spot Issues 2 Weeks Early',
      '+14 Days Headstart',
      '24.8%',
      '92%',
      '35%',
      '+42 kg/ha',
      'Continuously verified by NASA Harvest Program',
      'Soil Regeneration API',
      'Landsat',
      'satellite telemetry',
      'higher harvest yield',
      'reduced fertilizer costs',
      'Look Beneath the Surface',
      'Zero Guesswork Rotation',
      'Enter farm address',
      'GPS coordinates',
    ];

    for (const claim of removed) {
      expect(text).not.toContain(claim);
    }
  });

  it('sends the calls to action to the journey next route', async () => {
    await clickButton(en.home.hero.cta);
    expect(router.push).toHaveBeenCalledWith('/farm');

    await clickButton(en.home.cta.button);
    expect(router.push).toHaveBeenCalledWith('/farm');

    journey.nextRoute = '/lab';
    await act(async () => {
      root.render(<HomePage />);
    });
    await clickButton(en.home.hero.cta);
    expect(router.push).toHaveBeenLastCalledWith('/lab');
  });

  it('falls back to /explore while the journey is still loading', async () => {
    journey.loading = true;
    await act(async () => {
      root.render(<HomePage />);
    });

    await clickButton(en.home.hero.cta);
    expect(router.push).toHaveBeenCalledWith('/explore');
  });

  it('shows the guest note only while nobody is signed in', async () => {
    expect(container.textContent).toContain(en.home.guestNote);

    auth.status = 'account';
    await act(async () => {
      root.render(<HomePage />);
    });

    expect(container.textContent).not.toContain(en.home.guestNote);
  });
});
