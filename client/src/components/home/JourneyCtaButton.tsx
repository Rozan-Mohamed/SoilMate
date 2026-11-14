'use client';

import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { useJourney } from '@/providers/JourneyProvider';
import { safeNextRoute } from '@/lib/auth/redirect';

type Props = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'bright';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

/**
 * The home calls to action resume the farmer where they stopped. `GET /journey`
 * decides the destination; until it answers, the documented fallback is
 * /explore. Guests and accounts use the same button.
 */
export function JourneyCtaButton({ children, variant = 'bright', size = 'md', className }: Props) {
  const router = useRouter();
  const { nextRoute, loading } = useJourney();
  const target = loading ? '/explore' : safeNextRoute(nextRoute);

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      iconRight={<ArrowRight className="size-4" />}
      onClick={() => router.push(target)}
    >
      {children}
    </Button>
  );
}
