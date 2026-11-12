'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import type { CollectionItem } from '@/api/types';

// Tiny row under the progress bar (Games 3, 4, 5). A tile pops in for each first-try win.
export function CollectionRow({ items, total }: { items: CollectionItem[]; total: number }) {
  const empty = Math.max(0, total - items.length);
  return (
    <ul className="flex items-center justify-center gap-1.5 px-4 pt-2" aria-hidden="true">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.li
            key={item.key}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 16 }}
            className="grid size-8 place-items-center rounded-full bg-bright/60 ring-1 ring-primary/30"
            title={item.label}
          >
            <Icon name={item.iconKey} className="size-5" />
          </motion.li>
        ))}
      </AnimatePresence>
      {Array.from({ length: empty }, (_, i) => (
        <li
          key={`empty-${i}`}
          className="size-8 rounded-full border-2 border-dashed border-mint-3"
        />
      ))}
    </ul>
  );
}
