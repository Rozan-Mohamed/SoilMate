import { en } from '@/strings/en';

// Single source of truth for the site-wide navigation. The whole website uses this,
// so adding or renaming a page is a one-line change here.
export type NavItem = {
  href: string;
  label: string;
  /** Shown as the dark "game" pill in the navbar. */
  highlight?: boolean;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: en.nav.home },
  { href: '/explore', label: en.nav.explore },
  { href: '/farm', label: en.nav.farm },
  { href: '/lab', label: en.nav.lab },
  { href: '/future', label: en.nav.future },
  { href: '/dashboard', label: en.nav.dashboard },
  { href: '/learn', label: en.nav.learn, highlight: true },
];

/** Where the "Start" button in the navbar goes. */
export const START_HREF = '/explore';

export const isActivePath = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
