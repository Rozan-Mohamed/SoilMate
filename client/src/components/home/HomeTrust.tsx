import { Droplets, Leaf, LineChart } from 'lucide-react';
import { en } from '@/strings/en';
import { Eyebrow } from './Eyebrow';

const CARD_ICONS = [Droplets, LineChart, Leaf];

export function HomeTrust() {
  const cards = en.home.trust.cards;

  return (
    <section className="bg-mint-2/50 py-12 lg:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <Eyebrow>{en.home.trust.tag}</Eyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-deep sm:text-4xl">
            {en.home.trust.title}
          </h2>
          <p className="mt-3 text-ink-soft">{en.home.trust.subtitle}</p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {cards.map((card, index) => {
            const Icon = CARD_ICONS[index] ?? Leaf;

            return (
              <article
                key={card.title}
                className="flex h-full flex-col rounded-card bg-card p-6 shadow-card"
              >
                <span className="grid size-11 place-items-center rounded-full bg-mint-2 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-extrabold leading-snug text-deep">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{card.body}</p>
              </article>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm font-semibold text-ink-soft">
          {en.home.trust.disclaimer}
        </p>
      </div>
    </section>
  );
}
