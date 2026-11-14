import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { en } from '@/strings/en';

export function AuthFooterLinks({ mode }: { mode: 'signup' | 'login' }) {
  const copy = mode === 'signup' ? en.auth.signup : en.auth.login;
  const linkHref = mode === 'signup' ? '/login' : '/signup';

  return (
    <div className="space-y-4">
      <p>
        {copy.linkPrefix}{' '}
        <Link
          href={linkHref}
          className="font-extrabold text-primary underline-offset-2 hover:underline"
        >
          {copy.link}
        </Link>
      </p>

      <div className="border-t border-mint-3 pt-4">
        <Link
          href="/explore"
          className="inline-flex items-center gap-1 font-extrabold text-primary underline-offset-2 hover:underline"
        >
          {en.auth.guest.link}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-soft">
          {en.auth.guest.note}
        </p>
      </div>
    </div>
  );
}
