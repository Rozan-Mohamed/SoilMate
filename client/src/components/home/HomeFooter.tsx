import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { NAV_ITEMS } from '@/config/site';
import { en } from '@/strings/en';

export function HomeFooter() {
  return (
    <footer className="border-t border-mint-3 bg-mint-2/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <p className="mt-2 text-xs text-ink-soft">{en.home.footer.copyright}</p>
        </div>

        <nav aria-label={en.nav.footerNav} className="flex flex-wrap gap-x-5 gap-y-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-ink-soft transition-colors hover:text-deep"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
