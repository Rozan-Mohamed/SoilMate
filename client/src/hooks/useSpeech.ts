'use client';

import { useCallback, useSyncExternalStore } from 'react';

const noop = () => () => {};

// Reads aloud with the browser's own voice (en-US, a little slower). Hidden when unsupported.
export function useSpeech() {
  const supported = useSyncExternalStore(
    noop,
    () => typeof window !== 'undefined' && 'speechSynthesis' in window,
    () => false,
  );

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  }, []);

  return { supported, speak };
}
