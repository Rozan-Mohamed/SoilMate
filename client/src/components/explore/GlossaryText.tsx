'use client';

import { useEffect, useMemo, useState } from 'react';
import { DottedTerm } from '@/components/ui/DottedTerm';
import { loadGlossary } from '@/components/ui/glossary';

type Props = {
  text: string;
  className?: string;
};

/**
 * Underlines the glossary terms that appear in a piece of API text, so the
 * farmer can tap them for the plain-language definition. The glossary itself
 * is public and cached by the shared loader.
 */
export function GlossaryText({ text, className }: Props) {
  const [terms, setTerms] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    void loadGlossary()
      .then((list) => {
        if (cancelled) return;
        setTerms(list.map((entry) => entry.term).filter(Boolean));
      })
      .catch(() => {
        // The glossary is optional: the text stays readable without it.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const parts = useMemo(() => splitByTerms(text, terms), [text, terms]);

  if (!terms.length) return <span className={className}>{text}</span>;

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.term ? (
          <DottedTerm key={`${part.value}-${index}`} term={part.value}>
            {part.value}
          </DottedTerm>
        ) : (
          <span key={`${part.value}-${index}`}>{part.value}</span>
        ),
      )}
    </span>
  );
}

type Part = { value: string; term: boolean };

function splitByTerms(text: string, terms: string[]): Part[] {
  const usable = terms
    .filter((term) => term.trim().length > 2)
    .sort((a, b) => b.length - a.length);

  if (!usable.length) return [{ value: text, term: false }];

  const escaped = usable.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');

  return text
    .split(pattern)
    .filter((part) => part !== '')
    .map((part) => ({
      value: part,
      term: usable.some((term) => term.toLowerCase() === part.toLowerCase()),
    }));
}
