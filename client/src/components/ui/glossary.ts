import { apiFetch } from '@/lib/soilmate/api';

export type GlossaryTerm = {
  term: string;
  short: string;
  gameSection?: string;
};

// GET /glossary is public. The promise is shared so the endpoint is called
// once per page session, no matter how many DottedTerm instances are on screen.
let glossaryPromise: Promise<GlossaryTerm[]> | null = null;

export function loadGlossary(): Promise<GlossaryTerm[]> {
  if (!glossaryPromise) {
    glossaryPromise = apiFetch<{ terms: GlossaryTerm[] }>('/glossary', { auth: 'none' })
      .then((response) => (Array.isArray(response.terms) ? response.terms : []))
      .catch((err: unknown) => {
        // Let a later tap retry if the network was down.
        glossaryPromise = null;
        throw err;
      });
  }
  return glossaryPromise;
}
