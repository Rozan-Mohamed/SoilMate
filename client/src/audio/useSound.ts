'use client';

import { useAudioStore, playSfx } from './store';

export function useSound() {
  const musicOn = useAudioStore((s) => s.musicOn);
  const sfxOn = useAudioStore((s) => s.sfxOn);
  const setMusicOn = useAudioStore((s) => s.setMusicOn);
  const setSfxOn = useAudioStore((s) => s.setSfxOn);
  const toggleAll = useAudioStore((s) => s.toggleAll);
  return {
    play: playSfx,
    musicOn,
    sfxOn,
    setMusicOn,
    setSfxOn,
    toggleAll,
    muted: !musicOn && !sfxOn,
  };
}
