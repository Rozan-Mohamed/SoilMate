'use client';

import { useEffect } from 'react';
import { getAudio } from './engine';
import { useAudioStore } from './store';

// Mounted once in the root layout so music keeps playing while the user moves between
// pages of the whole website.
export function AudioProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useAudioStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();

    // Browsers only allow sound after a user gesture: unlock on the first one.
    const unlock = () => {
      getAudio().unlock();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);

    const onVisibility = () => getAudio().setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [hydrate]);

  return <>{children}</>;
}
