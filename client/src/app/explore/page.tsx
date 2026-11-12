import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/ui/PlaceholderPage';
import { en } from '@/strings/en';

export const metadata: Metadata = { title: en.nav.explore };

export default function Page() {
  return <PlaceholderPage title={en.nav.explore} />;
}
