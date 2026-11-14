'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Gamepad2, Lock, LogOut, Menu, UserRound, X } from 'lucide-react';
import { NAV_ITEMS, isActivePath, type NavItem } from '@/config/site';
import { playSfx } from '@/audio/store';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/providers/AuthProvider';
import { useJourney } from '@/providers/JourneyProvider';
import type { Me } from '@/lib/soilmate/types';
import { en } from '@/strings/en';

function NavLink({
  item,
  active,
  locked,
  mobile,
}: {
  item: NavItem;
  active: boolean;
  locked: boolean;
  mobile?: boolean;
}) {
  const common = 'whitespace-nowrap font-semibold transition-colors';

  if (locked) {
    return (
      <span
        title={en.nav.lockedHint}
        aria-disabled="true"
        className={clsx(
          common,
          'inline-flex cursor-not-allowed items-center gap-1.5 text-ink-soft opacity-45',
          mobile ? 'py-2 text-base' : 'px-1 py-2 text-sm',
        )}
      >
        {item.label}
        <Lock className="size-3.5" aria-hidden="true" />
        <span className="sr-only"> — {en.nav.lockedHint}</span>
      </span>
    );
  }

  if (item.highlight) {
    return (
      <Link
        href={item.href}
        onClick={() => playSfx('nav')}
        aria-current={active ? 'page' : undefined}
        className={clsx(
          common,
          'inline-flex items-center gap-2 rounded-full bg-deep px-4 py-2 text-[13px] text-white',
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
        mobile ? 'py-2 text-base' : 'relative px-1 py-2 text-[13px]',
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

function GuestActions({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center gap-1.5', className)}>
      <Button href="/login" variant="ghost" size="sm" sfx="nav">
        {en.nav.login}
      </Button>
      <Button href="/signup" size="sm" className="!rounded-full" sfx="nav">
        {en.nav.signup}
      </Button>
    </div>
  );
}

function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SM';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

function ProfileMenu({ user }: { user: Me | null }) {
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const focusFirstItem = () => {
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    };
    focusFirstItem();

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const onLogout = async () => {
    setPending(true);
    playSfx('nav');
    try {
      await logout();
    } finally {
      setOpen(false);
      setPending(false);
      router.push('/');
    }
  };

  const avatarUrl = user?.avatarUrl;
  const showAvatar = Boolean(avatarUrl) && failedAvatarUrl !== avatarUrl;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          playSfx('tap');
          setOpen((current) => !current);
        }}
        aria-label={en.nav.openProfileMenu}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className="grid size-10 place-items-center overflow-hidden rounded-full border-2 border-mint-3 bg-deep text-sm font-extrabold text-bright transition-colors hover:border-leaf"
      >
        {avatarUrl && showAvatar ? (
          // Avatar URLs can point outside the website API, so use a plain image
          // rather than configuring every possible remote host.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="size-full object-cover"
            onError={() => setFailedAvatarUrl(avatarUrl)}
          />
        ) : (
          <span aria-hidden="true">{initials(user?.fullName)}</span>
        )}
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={en.nav.accountMenu}
          className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-mint-3 bg-white p-2 shadow-card"
        >
          {user && (
            <div className="border-b border-mint-3 px-3 pb-2.5 pt-1">
              <p className="truncate text-sm font-extrabold text-deep">{user.fullName}</p>
              <p className="truncate text-xs text-ink-soft">{user.email}</p>
            </div>
          )}

          <Link
            href="/profile"
            role="menuitem"
            onClick={() => {
              playSfx('nav');
              setOpen(false);
            }}
            className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-deep hover:bg-mint-2"
          >
            <UserRound className="size-4" aria-hidden="true" />
            {en.nav.profile}
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => void onLogout()}
            disabled={pending}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-peach-ink hover:bg-peach-soft disabled:cursor-wait disabled:opacity-60"
          >
            <LogOut className="size-4" aria-hidden="true" />
            {en.nav.logout}
          </button>
        </div>
      )}
    </div>
  );
}

export function NavBar() {
  const pathname = usePathname();
  const { status, user } = useAuth();
  const { steps } = useJourney();
  // The menu is open only for the page it was opened on, so changing page closes it
  // without needing an effect.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpenOn(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Authentication pages are full-bleed split screens with no navbar.
  if (pathname === '/login' || pathname === '/signup') return null;

  const isLocked = (item: NavItem) =>
    item.journeyId
      ? steps.some((step) => step.id === item.journeyId && step.status === 'locked')
      : false;

  return (
    <header className="sticky top-0 z-40 bg-mint px-3 pt-3 sm:px-6">
      <a
        href="#main"
        className="sr-only rounded-btn bg-deep px-4 py-2 font-bold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        {en.nav.skipToContent}
      </a>

      <div className="mx-auto max-w-7xl rounded-full border border-mint-3 bg-white/90 px-3 py-1.5 shadow-card backdrop-blur sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            aria-label="SoilMate"
            onClick={() => playSfx('nav')}
            className="shrink-0 rounded-full"
          >
            <Logo />
          </Link>

          <nav
            aria-label={en.nav.mainNav}
            className="hidden shrink-0 items-center gap-4 whitespace-nowrap xl:flex"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
                locked={isLocked(item)}
              />
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <SoundToggle />

            {status === 'loading' && (
              <Skeleton className="hidden size-10 rounded-full sm:block" />
            )}
            {status === 'guest' && <GuestActions className="hidden sm:flex" />}
            {status === 'account' && <ProfileMenu user={user} />}

            <button
              type="button"
              className="grid size-11 place-items-center rounded-full text-deep hover:bg-mint-2 xl:hidden"
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
            className="flex flex-col gap-1 border-t border-mint-3 px-2 pb-3 pt-2 xl:hidden"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
                locked={isLocked(item)}
                mobile
              />
            ))}

            {status === 'loading' && <Skeleton className="mt-2 h-10 w-full sm:hidden" />}
            {status === 'guest' && <GuestActions className="mt-2 sm:hidden" />}
          </nav>
        )}
      </div>
    </header>
  );
}
