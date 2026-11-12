import clsx from 'clsx';
import { Lock } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { en } from '@/strings/en';
import type { CollectionItem } from '@/api/types';

type Props = {
  items: CollectionItem[];
  title?: string;
  /** Badges and stickers show a small lock when missed. Terms and tiles show a soft orange dot. */
  missedMark: 'lock' | 'dot';
};

// Renders exactly what the API returned in collection[]. Nothing is hard-coded here.
export function CollectionGrid({ items, title = en.result.collectionTitle, missedMark }: Props) {
  if (items.length === 0) return null;
  const earnedCount = items.filter((i) => i.earned).length;
  return (
    <section className="rounded-2xl bg-mint-2/70 p-3">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="text-sm font-extrabold text-deep">{title}</h2>
        <span className="text-xs font-bold text-primary">
          {earnedCount} / {items.length}
        </span>
      </div>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {items.map((item) => (
          <li key={item.key} className="flex flex-col items-center gap-1 text-center">
            <span
              className={clsx(
                'relative grid size-12 place-items-center rounded-full border-2',
                item.earned ? 'border-primary/40 bg-white' : 'border-mint-3 bg-white/60',
              )}
            >
              <span
                className={clsx('grid place-items-center', !item.earned && 'opacity-40 grayscale')}
              >
                <Icon name={item.iconKey} className="size-7" />
              </span>
              <span
                className={clsx(
                  'absolute -right-1 -top-1 grid size-5 place-items-center rounded-full text-white',
                  item.earned ? 'bg-primary' : missedMark === 'lock' ? 'bg-ink-soft' : 'bg-peach',
                )}
              >
                {item.earned ? (
                  <CheckMark />
                ) : missedMark === 'lock' ? (
                  <Lock className="size-3" aria-hidden="true" />
                ) : (
                  <span className="size-1.5 rounded-full bg-white" aria-hidden="true" />
                )}
              </span>
            </span>
            <span
              className={clsx(
                'text-xs font-bold leading-tight',
                item.earned ? 'text-deep' : 'text-ink-soft',
              )}
            >
              {item.label}
            </span>
            <span className="sr-only">
              {item.earned ? en.result.collectionEarned : en.result.collectionMissed}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CheckMark() {
  return (
    <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true">
      <path
        d="M2.500 6.500 5 9l4.500-5.500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
