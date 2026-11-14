'use client';

import clsx from 'clsx';
import { MapPin, Search } from 'lucide-react';
import type { CenterId } from '@/lib/soilmate/types';
import type { Center } from '@/lib/explore/types';
import { en } from '@/strings/en';

type Props = {
  centers: Center[];
  selectedId: CenterId | null;
  query: string;
  searchResults: Center[] | null;
  coverageNote: string;
  searching: boolean;
  onQueryChange: (value: string) => void;
  onSelect: (centerId: CenterId) => void;
};

export function ExploreHeader({
  centers,
  selectedId,
  query,
  searchResults,
  coverageNote,
  searching,
  onQueryChange,
  onSelect,
}: Props) {
  const results = searchResults ?? [];

  return (
    <header>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <MapPin className="size-3.5" aria-hidden="true" />
          {en.explore.tag}
        </span>
        <span className="rounded-full bg-deep px-3 py-1.5 text-xs font-bold text-white">
          {en.explore.step}
        </span>
      </div>

      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-deep sm:text-4xl">
        {en.explore.title}
      </h1>

      <div className="mt-4 max-w-md">
        <label htmlFor="explore-search" className="sr-only">
          {en.explore.search.label}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
            aria-hidden="true"
          />
          <input
            id="explore-search"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={en.explore.search.placeholder}
            className="w-full rounded-full border-2 border-mint-3 bg-white py-3 pl-11 pr-4 text-base text-ink placeholder:text-ink-soft/70 focus:border-primary"
          />
        </div>

        {query.trim() !== '' && (
          <div className="mt-2 rounded-2xl border border-mint-3 bg-card p-2 shadow-card">
            {searching ? (
              <p className="px-2 py-1 text-sm text-ink-soft">{en.ui.loading}</p>
            ) : results.length === 0 ? (
              <p className="px-2 py-1 text-sm text-ink-soft">{coverageNote}</p>
            ) : (
              <ul className="space-y-1">
                {results.map((center) => (
                  <li key={center.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(center.id)}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm font-bold text-deep transition-colors hover:bg-mint-2"
                    >
                      <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
                      {center.name}
                      <span className="text-xs font-semibold text-ink-soft">
                        {center.governorate}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-sm font-bold text-deep">{en.explore.areas.label}</p>
        <ul className="mt-2 grid gap-3 sm:grid-cols-3">
          {centers.map((center) => {
            const selected = center.id === selectedId;
            return (
              <li key={center.id}>
                <button
                  type="button"
                  onClick={() => onSelect(center.id)}
                  aria-pressed={selected}
                  className={clsx(
                    'flex w-full flex-col items-start gap-1 rounded-card border-2 p-4 text-left transition-colors',
                    selected
                      ? 'border-primary bg-mint-2 shadow-card'
                      : 'border-mint-3 bg-card hover:border-leaf/60',
                  )}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="text-base font-extrabold text-deep">{center.name}</span>
                    {selected && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                        {en.explore.areas.selected}
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-semibold text-ink-soft">
                    {center.governorate}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
}
