'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Check, Star } from 'lucide-react';
import { useGamesQuery } from '@/api/queries';
import { playSfx } from '@/audio/store';
import { GAMES, isGameSlug } from '../gameConfig';
import { en } from '@/strings/en';

type StepState = 'completed' | 'active' | 'next' | 'upcoming';

// Which game are we on, and are we looking at its score screen?
function parsePath(pathname: string) {
  const [, section, slug, tail] = pathname.split('/');
  const current = section === 'learn' && slug && isGameSlug(slug) ? slug : null;
  return { current, isResult: current !== null && tail === 'result' };
}

export function GamesPipeline() {
  const pathname = usePathname();
  const { data: games } = useGamesQuery();
  const { current, isResult } = parsePath(pathname);
  const activeRef = useRef<HTMLAnchorElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  const completedFromApi = new Set(games?.filter((g) => g.best.completed).map((g) => g.slug));
  const currentIndex = GAMES.findIndex((g) => g.slug === current);
  const nextSlug = isResult && currentIndex >= 0 ? (GAMES[currentIndex + 1]?.slug ?? null) : null;
  const isFinaleResult = isResult && currentIndex === GAMES.length - 1;

  const stateOf = (slug: string): StepState => {
    if (isResult && slug === current) return 'completed';
    if (completedFromApi.has(slug as never)) return 'completed';
    if (slug === current) return 'active';
    if (slug === nextSlug) return 'next';
    return 'upcoming';
  };

  const states = GAMES.map((g) => stateOf(g.slug));
  // Keep the interesting circle visible when the row scrolls sideways on phones.
  const focusKey = `${current ?? ''}-${isResult}`;
  useEffect(() => {
    // Scroll the row ourselves. scrollIntoView() would also move the browser's Tab starting point,
    // and the first Tab press would skip the skip-link and the navbar.
    const nav = navRef.current;
    const el = activeRef.current;
    if (!nav || !el) return;
    const navBox = nav.getBoundingClientRect();
    const elBox = el.getBoundingClientRect();
    const left =
      nav.scrollLeft + (elBox.left - navBox.left) - nav.clientWidth / 2 + elBox.width / 2;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    nav.scrollTo({ left, behavior: calm ? 'auto' : 'smooth' });
  }, [focusKey]);

  return (
    <nav
      ref={navRef}
      aria-label={en.pipeline.label}
      className="mx-auto mt-4 max-w-3xl overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:px-6"
    >
      <ol className="mx-auto flex min-w-max items-start justify-center gap-0 pt-5">
        {GAMES.map((game, i) => {
          const state = states[i];
          const showTitle = state === 'active' || state === 'next';
          const lineDone = states[i] === 'completed';
          const isFocus = state === 'active' || state === 'next';

          return (
            <li key={game.slug} className="flex items-start">
              <Link
                href={`/learn/${game.slug}`}
                ref={isFocus ? activeRef : undefined}
                onClick={() => playSfx('nav')}
                aria-current={state === 'active' ? 'step' : undefined}
                className="relative flex w-20 flex-col items-center gap-1.5 sm:w-28"
              >
                {state === 'active' && (
                  <span className="absolute -top-5 rounded-full bg-bright px-2 py-0.5 text-[10px] font-bold text-deep">
                    {en.pipeline.playing}
                  </span>
                )}
                <span
                  className={clsx(
                    'grid place-items-center rounded-full border-2 font-bold transition-all',
                    state === 'completed' && 'size-8 border-primary bg-primary text-white',
                    state === 'active' && 'size-11 border-deep bg-deep text-white shadow-card',
                    state === 'next' &&
                      'size-10 border-bright bg-white text-deep shadow-[0_0_0_5px_rgb(144_244_192/0.45)]',
                    state === 'upcoming' && 'size-8 border-mint-3 bg-white text-ink-soft',
                  )}
                >
                  {state === 'completed' ? (
                    <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                  ) : (
                    <span className="text-sm">{game.position}</span>
                  )}
                </span>
                <span
                  className={clsx(
                    'text-center text-[11px] leading-tight font-semibold sm:text-xs',
                    showTitle ? 'text-deep' : 'text-ink-soft max-sm:sr-only',
                  )}
                >
                  {game.title}
                </span>
                {state === 'completed' && <span className="sr-only">({en.pipeline.done})</span>}
              </Link>

              {i < GAMES.length - 1 && (
                <span
                  aria-hidden="true"
                  className={clsx(
                    'mt-[15px] -mx-[34px] h-1 w-[68px] shrink-0 rounded-full sm:-mx-[50px] sm:w-[100px]',
                    lineDone ? 'bg-primary' : 'bg-mint-3',
                  )}
                />
              )}
            </li>
          );
        })}
        {isFinaleResult && (
          <li aria-hidden="true" className="ml-1 mt-1 text-gold">
            <Star className="size-6 fill-current" />
          </li>
        )}
      </ol>
    </nav>
  );
}
