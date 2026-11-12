'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useSound } from '@/audio/useSound';
import { useAudioStore } from '@/audio/store';
import { en } from '@/strings/en';

// One master button: music and effects on, or both off. (The Hub page gets separate switches.)
export function SoundToggle({ className = '' }: { className?: string }) {
  const { muted, toggleAll } = useSound();
  const ready = useAudioStore((s) => s.ready);
  const label = muted ? en.sound.unmute : en.sound.mute;

  return (
    <button
      type="button"
      onClick={toggleAll}
      aria-label={label}
      aria-pressed={muted}
      title={label}
      className={`grid size-11 place-items-center rounded-full text-deep transition-colors hover:bg-mint-2 ${className}`}
    >
      {/* Until the saved choice is read, show the default icon to avoid a hydration mismatch. */}
      {ready && muted ? (
        <VolumeX className="size-5" aria-hidden="true" />
      ) : (
        <Volume2 className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}
