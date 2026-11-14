'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { friendlyMessage } from '@/lib/soilmate/errors';
import { en } from '@/strings/en';
import { Banner } from './Banner';
import { Button } from './Button';
import { Modal } from './Modal';
import { loadGlossary, type GlossaryTerm } from './glossary';

type LoadState = {
  status: 'idle' | 'loading' | 'ready';
  term: GlossaryTerm | null;
  error: string | null;
};

/**
 * A dotted-underlined glossary term. The glossary is loaded lazily on the
 * first tap and then reused for the rest of the session.
 *
 * The contract stores `gameSection`, but no route/deep-link format for it is
 * documented, so "Play to learn more" opens the existing game hub at /learn.
 */
export function DottedTerm({ term, children }: { term: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>({ status: 'idle', term: null, error: null });

  const openDefinition = async () => {
    setOpen(true);
    if (state.status === 'ready' && !state.error) return;

    setState({ status: 'loading', term: null, error: null });
    try {
      const terms = await loadGlossary();
      const normalized = term.trim().toLowerCase();
      const found =
        terms.find((entry) => entry.term.trim().toLowerCase() === normalized) ?? null;
      setState({ status: 'ready', term: found, error: null });
    } catch (err) {
      setState({ status: 'ready', term: null, error: friendlyMessage(err) });
    }
  };

  const dialog =
    open && typeof document !== 'undefined'
      ? createPortal(
          <Modal open={open} onClose={() => setOpen(false)} title={term} size="sm">
            {state.status === 'loading' && (
              <p className="text-sm font-semibold text-ink-soft">{en.ui.loading}</p>
            )}

            {state.status !== 'loading' && state.error && <Banner tone="error">{state.error}</Banner>}

            {state.status === 'ready' && !state.error && (
              <>
                <p className="text-sm text-ink-soft">{state.term?.short ?? en.ui.glossaryEmpty}</p>
                <Button href="/learn" size="sm" className="mt-4 w-full">
                  {en.ui.playToLearn}
                </Button>
              </>
            )}
          </Modal>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => void openDefinition()}
        aria-haspopup="dialog"
        aria-label={`${term} — ${en.ui.glossaryHint}`}
        className="inline rounded-sm font-semibold text-primary underline decoration-primary/50 decoration-dotted decoration-2 underline-offset-4 transition-colors hover:decoration-primary"
      >
        {children ?? term}
      </button>
      {dialog}
    </>
  );
}
