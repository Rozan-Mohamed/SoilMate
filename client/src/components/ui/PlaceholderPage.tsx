import { Leaf } from 'lucide-react';
import { Button } from './Button';
import { en } from '@/strings/en';

// Used by every site page that is not built yet.
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center">
      <div className="w-full rounded-card bg-card p-8 shadow-card">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-mint-2 text-primary">
          <Leaf className="size-7" aria-hidden="true" />
        </span>
        <h1 className="text-3xl font-extrabold text-deep">{title}</h1>
        <p className="mt-2 text-ink-soft">{en.placeholder.comingSoon}</p>
        <Button href="/" variant="secondary" className="mt-6">
          {en.placeholder.backHome}
        </Button>
      </div>
    </section>
  );
}
