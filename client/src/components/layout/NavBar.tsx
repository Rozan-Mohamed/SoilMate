'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Gamepad2, Menu, X } from 'lucide-react';
import { NAV_ITEMS, START_HREF, isActivePath, type NavItem } from '@/config/site';
import { playSfx } from '@/audio/store';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { en } from '@/strings/en';

function NavLink({ item, active, mobile }: { item: NavItem; active: boolean; mobile?: boolean }) {
  const common = 'font-semibold transition-colors';

  if (item.highlight) {
    return (
      <Link
        href={item.href}
        onClick={() => playSfx('nav')}
        aria-current={active ? 'page' : undefined}
        className={clsx(
          common,
          'inline-flex items-center gap-2 rounded-full bg-deep px-4 py-2 text-sm text-white',
          mobile && 'w-fit text-base',
          active ? 'ring-2 ring-bright ring-offset-2' : 'hover:bg-[#1f5040]',
        )}
      >
        <Gamepad2 className="size-4" aria-hidden="true" />
        {item.label}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={() => playSfx('nav')}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        common,
        mobile ? 'py-2 text-base' : 'relative px-1 py-2 text-sm',
        active ? 'text-primary' : 'text-ink-soft hover:text-deep',
        !mobile &&
          active &&
          "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:content-['']",
      )}
    >
      {item.label}
    </Link>
  );
}

export function NavBar() {
  const pathname = usePathname();
  // The menu is open only for the page it was opened on, so changing page closes it
  // without needing an effect.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenOn(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <a
        href="#main"
        className="sr-only rounded-btn bg-deep px-4 py-2 font-bold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        {en.nav.skipToContent}
      </a>

      <div className="mx-auto max-w-6xl rounded-full border border-mint-3 bg-white/90 px-3 py-1.5 shadow-card backdrop-blur sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            aria-label="SoilMate"
            onClick={() => playSfx('nav')}
            className="rounded-full"
          >
            <Logo />
          </Link>

          <nav aria-label={en.nav.mainNav} className="hidden items-center gap-5 lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} active={isActivePath(pathname, item.href)} />
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <SoundToggle />
            <Button
              href={START_HREF}
              className="hidden !min-h-10 !px-5 !text-sm sm:inline-flex"
              sfx="nav"
            >
              {en.nav.start}
            </Button>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full text-deep hover:bg-mint-2 lg:hidden"
              aria-label={open ? en.nav.closeMenu : en.nav.openMenu}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => {
                playSfx('tap');
                setOpenOn(open ? null : pathname);
              }}
            >
              {open ? (
                <X className="size-5" aria-hidden="true" />
              ) : (
                <Menu className="size-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {open && (
          <nav
            id="mobile-menu"
            aria-label={en.nav.mainNav}
            className="flex flex-col gap-1 border-t border-mint-3 px-2 pb-3 pt-2 lg:hidden"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
                mobile
              />
            ))}
            <Button href={START_HREF} className="mt-2 sm:hidden" sfx="nav">
              {en.nav.start}
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
