'use client';

import Link from 'next/link';
import { FlaskConical, Sprout } from 'lucide-react';
import { en } from '@/strings/en';

type Props = {
  /** The Rotation Lab is locked until the farm form is complete. */
  labEnabled: boolean;
};

export function ExploreCtaBand({ labEnabled }: Props) {
  return (
    <section className="rounded-card bg-deep px-5 py-8 shadow-card sm:px-8 sm:py-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
            <Sprout className="size-3.5" aria-hidden="true" />
            {en.explore.cta.tag}
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {en.explore.cta.title}
          </h2>
          <p className="mt-2 text-sm text-white/80">{en.explore.cta.text}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
          <Link
            href="/farm"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-white/70 px-5 text-sm font-extrabold text-white transition-colors hover:bg-white/10"
          >
            <Sprout className="size-4" aria-hidden="true" />
            {en.explore.cta.farm}
          </Link>

          {labEnabled ? (
            <Link
              href="/lab"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-bright px-5 text-sm font-extrabold text-deep transition-[filter] hover:brightness-95"
            >
              <FlaskConical className="size-4" aria-hidden="true" />
              {en.explore.cta.lab}
            </Link>
          ) : (
            <span className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-white/15 px-5 text-sm font-extrabold text-white/70">
              <FlaskConical className="size-4" aria-hidden="true" />
              {en.explore.cta.lab}
              <span className="text-xs font-bold">{en.explore.cta.labLocked}</span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
