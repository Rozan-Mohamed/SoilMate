import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { en } from '@/strings/en';

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

const HERO_IMAGE = '/images/auth/hero.jpg';

/** Build-time check: a missing developer-supplied photo never reaches the browser as a 404. */
const heroBackground = [
  'linear-gradient(180deg, rgb(9 35 24 / 0.08) 0%, rgb(9 35 24 / 0.22) 42%, rgb(9 35 24 / 0.84) 100%)',
  ...(existsSync(join(process.cwd(), 'public', 'images', 'auth', 'hero.jpg')) ? [`url('${HERO_IMAGE}')`] : []),
  'linear-gradient(150deg, #184030 0%, #0f3a2a 55%, #08251a 100%)',
].join(', ');

/**
 * Shared split-screen frame for /signup and /login. The photo is layered over a
 * dark-green gradient, so a missing /images/auth/hero.jpg never breaks the page.
 */
export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="min-h-svh bg-mint lg:grid lg:grid-cols-2">
      <aside
        className="relative flex min-h-48 flex-col justify-between overflow-hidden bg-deep p-5 sm:min-h-56 lg:min-h-svh lg:p-10"
        style={{
          backgroundImage: heroBackground,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Link
          href="/"
          aria-label="SoilMate"
          className="relative z-10 w-fit rounded-full bg-white/95 px-3.5 py-1.5 shadow-card transition-transform hover:-translate-y-0.5"
        >
          <Logo />
        </Link>

        <h1 className="relative z-10 mt-8 max-w-lg text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:mt-10 lg:text-5xl lg:leading-[1.05] xl:text-6xl">
          <span className="block text-white">{en.auth.headline.line1}</span>
          <span className="mt-1 block text-bright">{en.auth.headline.line2}</span>
        </h1>
      </aside>

      <section className="flex flex-col justify-center px-4 py-6 sm:px-6 sm:py-8 lg:min-h-svh lg:px-10 lg:py-6">
        <div className="mx-auto w-full max-w-xl lg:max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-tight text-deep sm:text-3xl lg:text-4xl">
            {title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-ink-soft">{subtitle}</p>

          <div className="mt-5 rounded-card bg-card p-5 shadow-card sm:p-6">{children}</div>

          <div className="mt-5 text-center text-sm text-ink-soft">{footer}</div>
        </div>
      </section>
    </div>
  );
}
