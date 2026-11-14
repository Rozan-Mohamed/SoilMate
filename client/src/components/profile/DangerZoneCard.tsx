'use client';

import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui';
import { en } from '@/strings/en';

type Props = {
  busy?: boolean;
  onDelete: () => void;
};

export function DangerZoneCard({ busy = false, onDelete }: Props) {
  return (
    <section className="rounded-card border border-peach/50 bg-peach-soft/70 p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/70 text-peach-ink">
          <TriangleAlert className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-peach-ink">{en.profile.danger.title}</h2>
          <p className="text-sm text-peach-ink/90">{en.profile.danger.description}</p>
        </div>
      </div>

      <Button
        variant="danger"
        onClick={onDelete}
        disabled={busy}
        className="mt-4 w-full"
      >
        {en.profile.danger.delete}
      </Button>
    </section>
  );
}
