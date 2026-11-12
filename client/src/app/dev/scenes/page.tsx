import { notFound } from 'next/navigation';
import { FieldScene } from '@/components/scene/FieldScene';
import { SCENES } from '@/components/scene/scenes';

// Developer-only gallery of every scene preset (404 in production). Open /dev/scenes while `npm run dev` runs.
export default function ScenesGalleryPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-extrabold text-deep">Scene gallery</h1>
      <p className="mb-6 text-ink-soft">{Object.keys(SCENES).length} presets from scenes.ts</p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.keys(SCENES).map((key) => (
          <li key={key} className="rounded-2xl bg-card p-3 shadow-card">
            <FieldScene sceneKey={key} />
            <p className="mt-2 break-all text-xs font-bold text-ink-soft">{key}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
