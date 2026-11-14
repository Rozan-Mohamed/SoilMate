import Link from 'next/link';
import clsx from 'clsx';
import { ArrowRight, ClipboardList, Droplets, FlaskConical, Map, Scale } from 'lucide-react';
import { en } from '@/strings/en';
import { Eyebrow } from './Eyebrow';

const STEP_ICONS = [Map, Droplets, FlaskConical, Scale, ClipboardList];

export function HomeSteps() {
  const steps = en.home.steps.items;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="text-center">
        <Eyebrow>{en.home.steps.tag}</Eyebrow>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-deep sm:text-4xl">
          {en.home.steps.title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-ink-soft">{en.home.steps.subtitle}</p>
      </div>

      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? Map;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.step} className="h-full">
              <Link
                href={step.href}
                className={clsx(
                  'group flex h-full flex-col rounded-card p-5 shadow-card transition-transform hover:-translate-y-0.5',
                  isLast ? 'bg-deep text-white' : 'bg-card hover:shadow-lg',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={clsx(
                      'rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide',
                      isLast ? 'bg-bright text-deep' : 'bg-mint-2 text-primary',
                    )}
                  >
                    {step.step}
                  </span>
                  <Icon
                    className={clsx('size-5', isLast ? 'text-bright' : 'text-primary')}
                    aria-hidden="true"
                  />
                </div>

                <h3
                  className={clsx(
                    'mt-4 text-lg font-extrabold uppercase tracking-wide',
                    isLast ? 'text-white' : 'text-deep',
                  )}
                >
                  {step.title}
                </h3>
                <p className={clsx('mt-1 text-sm font-bold', isLast ? 'text-bright' : 'text-primary')}>
                  {step.subtitle}
                </p>
                <p
                  className={clsx(
                    'mt-3 flex-1 text-sm leading-relaxed',
                    isLast ? 'text-white/80' : 'text-ink-soft',
                  )}
                >
                  {step.body}
                </p>

                <span
                  className={clsx(
                    'mt-4 inline-flex items-center gap-1 text-sm font-extrabold',
                    isLast ? 'text-bright' : 'text-primary',
                  )}
                >
                  {step.link}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
