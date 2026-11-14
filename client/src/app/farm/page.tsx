import type { Metadata } from 'next';
import { FarmView } from '@/components/farm/FarmView';
import { en } from '@/strings/en';

export const metadata: Metadata = { title: en.nav.farm };

export default function Page() {
  return <FarmView />;
}
