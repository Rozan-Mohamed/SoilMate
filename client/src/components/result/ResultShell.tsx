'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Mascot } from '@/components/game/Mascot';
import { playSfx } from '@/audio/store';
import type { MascotMood, MascotOutfit } from '@/api/types';

type Props = {
  outfit: MascotOutfit;
  mood: MascotMood;
  /** Replaces the mascot (for example the Game 2 satellite and farmer art). */
  hero?: React.ReactNode;
  title: string;
  bigMessage?: string;
  subtitle?: string;
  /** Changes when a new result is shown, so the celebration plays once per result. */
  celebrateKey: string;
  /** leaves = a shower of leaves and stars (Game 3). */
  confettiStyle?: 'default' | 'leaves';
  /** A larger two-sided burst (the Learn & Play finale). */
  big?: boolean;
  children: React.ReactNode;
};

const COLORS = ['#48b080', '#90f4c0', '#f5b50a', '#006c4a', '#ffe7d2'];

export function ResultShell({
  outfit,
  mood,
  hero,
  title,
  bigMessage,
  subtitle,
  celebrateKey,
  confettiStyle = 'default',
  big = false,
  children,
}: Props) {
  const reduce = useReducedMotion();
  // Our own canvas (hidden from assistive tech) instead of the one the library would add to <body>.
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    playSfx('complete');
    const bigSound = big ? setTimeout(() => playSfx('powerUp'), 700) : undefined;
    let cancelled = false;
    let confettiRef: { reset: () => void } | null = null;
    const canvas = canvasRef.current;
    if (!reduce && canvas) {
      // Loaded on demand so the first page stays small.
      import('canvas-confetti').then(({ default: confetti }) => {
        if (cancelled) return;
        const fire = confetti.create(canvas, { resize: true, useWorker: false });
        confettiRef = fire;
        const shapes =
          confettiStyle === 'leaves'
            ? [
                confetti.shapeFromPath({ path: 'M0 12C0 2 10-6 22-6 22 6 12 14 0 12Z' }),
                'star' as const,
              ]
            : undefined;
        const burst = (origin: { x: number; y: number }, angle?: number) =>
          fire({
            ...(shapes ? { shapes, scalar: 2 } : {}),
            ...(angle !== undefined ? { angle } : {}),
            particleCount: big ? 140 : 90,
            spread: big ? 70 : 75,
            origin,
            colors: COLORS,
            disableForReducedMotion: true,
          });
        if (big) {
          burst({ x: 0.1, y: 0.5 }, 60);
          burst({ x: 0.9, y: 0.5 }, 120);
          setTimeout(() => !cancelled && burst({ x: 0.5, y: 0.3 }), 450);
        } else {
          burst({ x: 0.5, y: 0.35 });
        }
      });
    }
    return () => {
      cancelled = true;
      if (bigSound) clearTimeout(bigSound);
      // Leaving the score screen also removes any confetti still in the air.
      confettiRef?.reset();
    };
  }, [celebrateKey, reduce, confettiStyle, big]);

  return (
    <div className="rounded-[28px] border border-mint-3 bg-card px-4 pb-6 pt-5 shadow-card sm:px-6">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[100] size-full"
      />
      <div className="flex flex-col items-center gap-1 text-center">
        {hero ?? (
          <Mascot outfit={outfit} mood={mood} bag={outfit === 'doctorCap'} className="size-32" />
        )}
        <h1 className="text-3xl font-extrabold text-deep">{title}</h1>
        {bigMessage && <p className="text-lg font-extrabold text-primary">{bigMessage}</p>}
        {subtitle && <p className="text-base text-ink-soft">{subtitle}</p>}
      </div>
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </div>
  );
}
