'use client';

import clsx from 'clsx';
import { Music, Volume2 } from 'lucide-react';
import { useSound } from '@/audio/useSound';
import { en } from '@/strings/en';

function Switch({
  label,
  icon,
  on,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex min-h-11 flex-1 items-center justify-between gap-3 rounded-2xl border-2 border-mint-3 bg-white px-3 py-2 text-left shadow-press-soft hover:bg-mint-2"
    >
      <span className="flex items-center gap-2 text-sm font-bold text-deep">
        {icon}
        {label}
      </span>
      <span
        aria-hidden="true"
        className={clsx(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          on ? 'bg-primary' : 'bg-mint-3',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]',
            on ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </span>
    </button>
  );
}

// Separate music and effects switches. The navbar button is the master mute for both.
export function SoundSwitches() {
  const { musicOn, sfxOn, setMusicOn, setSfxOn } = useSound();
  return (
    <div role="group" aria-label={en.hub.soundTitle} className="flex flex-col gap-2 sm:flex-row">
      <Switch
        label={en.hub.musicSwitch}
        icon={<Music className="size-4" aria-hidden="true" />}
        on={musicOn}
        onChange={setMusicOn}
      />
      <Switch
        label={en.hub.effectsSwitch}
        icon={<Volume2 className="size-4" aria-hidden="true" />}
        on={sfxOn}
        onChange={setSfxOn}
      />
    </div>
  );
}
