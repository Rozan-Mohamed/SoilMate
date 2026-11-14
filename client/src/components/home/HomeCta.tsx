import { CheckCircle2 } from 'lucide-react';
import { en } from '@/strings/en';
import { Eyebrow } from './Eyebrow';
import { JourneyCtaButton } from './JourneyCtaButton';

export function HomeCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 lg:py-16">
      <div className="rounded-card bg-deep px-6 py-10 text-center shadow-card sm:px-10 lg:py-14">
        <Eyebrow tone="dark">
          <span aria-hidden="true" className="size-2 rounded-full bg-bright" />
          {en.home.cta.tag}
        </Eyebrow>

        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {en.home.cta.title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/80">{en.home.cta.text}</p>

        <div className="mt-7 flex flex-col items-center gap-3">
          <JourneyCtaButton size="lg">{en.home.cta.button}</JourneyCtaButton>
          <p className="text-sm font-semibold text-white/75">{en.home.cta.areas}</p>
        </div>

        <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-white/70">
          {en.home.cta.chips.map((chip) => (
            <li key={chip} className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-4 shrink-0 text-bright" aria-hidden="true" />
              {chip}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
