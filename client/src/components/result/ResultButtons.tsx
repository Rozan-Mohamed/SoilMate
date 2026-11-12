'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { en } from '@/strings/en';
import Link from 'next/link';
import { playSfx } from '@/audio/store';

type Props = {
  next: { slug: string; title: string; iconKey: string } | null;
  playingAgain: boolean;
  onPlayAgain: () => void;
};

export function ResultButtons({ next, playingAgain, onPlayAgain }: Props) {
  return (
    <div className="flex flex-col items-stretch gap-2.5">
      {next && (
        <Button href={`/learn/${next.slug}`} sfx="nav">
          <Icon name={next.iconKey} className="size-6" />
          {`Next Game: ${next.title}`}
        </Button>
      )}
      <Button variant="secondary" onClick={onPlayAgain} disabled={playingAgain}>
        <RotateCcw className={playingAgain ? 'size-5 animate-spin' : 'size-5'} aria-hidden="true" />
        {en.playAgainButton}
      </Button>
      <Link
        href="/learn"
        onClick={() => playSfx('nav')}
        className="mx-auto min-h-10 px-3 py-2 text-base font-bold text-ink-soft hover:text-deep"
      >
        {en.backToGamesButton}
      </Link>
      <p className="text-center text-xs font-semibold text-ink-soft">{en.newQuestionsLine}</p>
    </div>
  );
}
