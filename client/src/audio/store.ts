'use client';

import { create } from 'zustand';
import { getAudio, type SfxName } from './engine';

const STORAGE_KEY = 'soilmate.audio';

type Persisted = { musicOn: boolean; sfxOn: boolean };

type AudioState = Persisted & {
  /** True once the saved choice was read from localStorage (after hydration). */
  ready: boolean;
  hydrate: () => void;
  setMusicOn: (on: boolean) => void;
  setSfxOn: (on: boolean) => void;
  /** Master switch used by the navbar button. */
  toggleAll: () => void;
};

function save(value: Persisted) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export const useAudioStore = create<AudioState>((set, get) => ({
  musicOn: true,
  sfxOn: true,
  ready: false,

  hydrate: () => {
    let saved: Partial<Persisted> = {};
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw) as Partial<Persisted>;
    } catch {
      /* ignore */
    }
    const musicOn = saved.musicOn ?? true;
    const sfxOn = saved.sfxOn ?? true;
    getAudio().setMusicOn(musicOn);
    getAudio().setSfxOn(sfxOn);
    set({ musicOn, sfxOn, ready: true });
  },

  setMusicOn: (on) => {
    getAudio().setMusicOn(on);
    set({ musicOn: on });
    save({ musicOn: on, sfxOn: get().sfxOn });
  },

  setSfxOn: (on) => {
    getAudio().setSfxOn(on);
    set({ sfxOn: on });
    save({ musicOn: get().musicOn, sfxOn: on });
  },

  toggleAll: () => {
    const { musicOn, sfxOn } = get();
    const next = !(musicOn || sfxOn);
    getAudio().setMusicOn(next);
    getAudio().setSfxOn(next);
    set({ musicOn: next, sfxOn: next });
    save({ musicOn: next, sfxOn: next });
    // Confirmation blip only when turning sound back on.
    if (next) getAudio().play('toggle');
  },
}));

/** Stable play function for components and hooks. */
export const playSfx = (name: SfxName) => getAudio().play(name);
