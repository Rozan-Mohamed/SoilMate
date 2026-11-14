import type { JourneyStepId } from '@/lib/soilmate/types';
import { en } from '@/strings/en';

// Single source of truth for the site-wide navigation. The whole website uses this,
// so adding or renaming a page is a one-line change here.
export type NavItem = {
  href: string;
  label: string;
  /** Shown as the dark "game" pill in the navbar. */
  highlight?: boolean;
  /** Journey step whose locked status disables this link. */
  journeyId?: JourneyStepId;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: en.nav.home },
  { href: '/explore', label: en.nav.explore, journeyId: 'explore' },
  { href: '/farm', label: en.nav.farm, journeyId: 'farm' },
  { href: '/lab', label: en.nav.lab, journeyId: 'lab' },
  { href: '/compare', label: en.nav.compare, journeyId: 'compare' },
  { href: '/dashboard', label: en.nav.myDashboard, journeyId: 'dashboard' },
  { href: '/learn', label: en.nav.learn, highlight: true },
];

export const isActivePath = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
