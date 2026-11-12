'use client';

import { notFound } from 'next/navigation';
import { ICON_MAP } from '@/assets/icon-map';
import { Icon } from '@/components/ui/Icon';
import iconKeys from '@/shared/icon-keys.json';

// Developer-only overview of every icon asset (404 in production): /dev/icons while `npm run dev` runs.
export default function IconsGalleryPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  const all: string[] = iconKeys.keys;
  const have = all.filter((k) => k in ICON_MAP);
  const missing = all.filter((k) => !(k in ICON_MAP));
  const groups = new Map<string, string[]>();
  for (const key of have)
    groups.set(key.split('-')[0], [...(groups.get(key.split('-')[0]) ?? []), key]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-deep">Icon gallery</h1>
      <p className="mb-6 text-ink-soft">
        {have.length} of {all.length} keys have an asset. {missing.length} still use the fallback
        icon.
      </p>
      {[...groups].map(([group, keys]) => (
        <div key={group} className="mb-6">
          <h2 className="mb-2 text-sm font-extrabold uppercase text-primary">
            {group} ({keys.length})
          </h2>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
            {keys.map((key) => (
              <li
                key={key}
                className="flex flex-col items-center gap-1 rounded-2xl bg-card p-3 shadow-card"
              >
                <Icon name={key} className="size-14" />
                <span className="break-all text-center text-[10px] font-bold text-ink-soft">
                  {key}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <details className="rounded-2xl bg-card p-4 shadow-card">
        <summary className="cursor-pointer font-extrabold text-deep">
          Missing ({missing.length})
        </summary>
        <p className="mt-2 break-all text-xs text-ink-soft">{missing.join(', ')}</p>
      </details>
    </section>
  );
}
