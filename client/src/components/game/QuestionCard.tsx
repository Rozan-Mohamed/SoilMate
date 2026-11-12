'use client';

import { Volume2 } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { en } from '@/strings/en';

type Props = {
  /** Illustration slot: a big icon, FieldScene or CropHero. */
  illustration?: React.ReactNode;
  prompt: string;
  subtitle?: string;
  /** icon = small square (Game 1). scene = wide picture across the card (Games 2, 4, 5). */
  illustrationVariant?: 'icon' | 'scene' | 'hero';
  /** Game 1 only: show the speaker button that reads the prompt aloud. */
  speakable?: boolean;
};

export function QuestionCard({
  illustration,
  illustrationVariant = 'icon',
  prompt,
  subtitle,
  speakable,
}: Props) {
  const { supported, speak } = useSpeech();
  const scene = illustrationVariant === 'scene';
  const hero = illustrationVariant === 'hero';
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-3xl border-2 border-mint-3 bg-mint-2/60 text-center ${
        scene ? 'p-3 pb-5' : hero ? 'px-4 pb-6 pt-4' : 'px-4 py-6'
      }`}
    >
      {illustration &&
        (scene ? (
          <div className="w-full">{illustration}</div>
        ) : hero ? (
          <div>{illustration}</div>
        ) : (
          <div className="grid size-20 place-items-center rounded-2xl bg-white shadow-press-soft">
            {illustration}
          </div>
        ))}
      <h1
        className={`text-balance font-extrabold leading-tight text-deep ${
          scene ? 'px-2 text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'
        }`}
      >
        {prompt}
      </h1>
      {subtitle && <p className="text-base text-ink-soft">{subtitle}</p>}
      {speakable && supported && (
        <button
          type="button"
          onClick={() => speak(prompt)}
          aria-label={en.game.listenAria(prompt)}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border-2 border-mint-3 bg-white px-4 text-sm font-bold text-deep shadow-press-soft hover:bg-mint-2"
        >
          <Volume2 className="size-4" aria-hidden="true" />
          {en.game.listen}
        </button>
      )}
    </div>
  );
}
