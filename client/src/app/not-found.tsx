'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { en } from '@/strings/en';

// Unknown URLs send people home (as the build steps ask), with a link in case it is slow.
export default function NotFound() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <section className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-2xl font-extrabold text-deep">{en.notFound.title}</h1>
      <p className="mt-2 text-ink-soft">{en.notFound.text}</p>
      <Button href="/" variant="secondary" className="mt-6">
        {en.notFound.link}
      </Button>
    </section>
  );
}
