import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { en } from '@/strings/en';
import { Eyebrow } from './Eyebrow';
import { GuestNote } from './GuestNote';
import { JourneyCtaButton } from './JourneyCtaButton';

const HERO_IMAGE = '/images/home/hero.jpg';

/** Build-time check: without the photo the hero falls back to the dark green gradient. */
const heroBackground = [
  'linear-gradient(100deg, rgb(9 35 24 / 0.92) 0%, rgb(9 35 24 / 0.74) 45%, rgb(9 35 24 / 0.38) 100%)',
  ...(existsSync(join(process.cwd(), 'public', 'images', 'home', 'hero.jpg'))
    ? [`url('${HERO_IMAGE}')`]
    : []),
  'linear-gradient(150deg, #184030 0%, #0f3a2a 55%, #08251a 100%)',
].join(', ');

export function HomeHero() {
  return (
    <section className="px-3 pt-3 sm:px-6 sm:pt-4">
      <div
        className="relative mx-auto max-w-6xl overflow-hidden rounded-card shadow-card"
        style={{
          backgroundImage: heroBackground,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative flex min-h-[420px] flex-col justify-between gap-8 p-6 sm:min-h-[460px] sm:p-10 lg:min-h-[500px] lg:p-14">
          <div className="max-w-2xl">
            <Eyebrow tone="dark">
              <span aria-hidden="true" className="size-2 rounded-full bg-bright" />
              {en.home.hero.tag}
            </Eyebrow>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {en.home.hero.headlineTop}
              <span className="mt-1 block text-bright">{en.home.hero.headlineBottom}</span>
            </h1>

            <p className="mt-4 max-w-xl text-base text-white/85">{en.home.hero.text}</p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-sm">
              <p className="text-sm leading-relaxed text-white/80">{en.home.hero.sideLine}</p>
              <GuestNote className="mt-2 text-white/75" />
            </div>

            <JourneyCtaButton size="lg" className="shrink-0">
              {en.home.hero.cta}
            </JourneyCtaButton>
          </div>
        </div>
      </div>
    </section>
  );
}
