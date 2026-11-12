'use client';

import { WifiOff } from 'lucide-react';
import { useOnline } from '@/hooks/useOnline';
import { en } from '@/strings/en';

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div
      role="status"
      className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full bg-peach-soft px-4 py-1.5 text-sm font-bold text-peach-ink"
    >
      <WifiOff className="size-4" aria-hidden="true" />
      {en.offlineBanner}
    </div>
  );
}
