'use client';

import { notFound } from 'next/navigation';
import { FieldSceneEffect } from '@/components/scene/FieldSceneEffect';

// Developer-only preview of every Game 5 result animation (404 in production): /dev/animations
const PRESETS: [string, string][] = [
  ['heat-wilt', 'scene-g5-hot-sun'],
  ['dry-soil', 'scene-g5-dry-spell'],
  ['wash-away', 'scene-g5-heavy-rain'],
  ['frost-damage', 'scene-g5-frost'],
  ['evaporate', 'scene-g5-sunny-growth'],
  ['healthy-growth', 'scene-g5-mild-days'],
  ['recover', 'scene-g5-welcome-rain'],
  ['slow-growth', 'scene-g5-cool-nights'],
  ['disease-spread', 'scene-g5-humid-nights'],
  ['flood', 'scene-g5-soggy-soil'],
  ['spoil', 'scene-g5-rainy-harvest'],
  ['wind-damage', 'scene-g5-strong-wind'],
];

export default function AnimationsGalleryPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-deep">Result animations</h1>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRESETS.map(([anim, scene]) => (
          <li key={anim} className="rounded-2xl bg-card p-3 shadow-card">
            <FieldSceneEffect sceneKey={scene} animationKey={anim} />
            <p className="mt-2 text-xs font-bold text-ink-soft">{anim}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
