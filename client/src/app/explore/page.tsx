import type { Metadata } from 'next';
import { ExploreView } from '@/components/explore/ExploreView';
import { en } from '@/strings/en';

export const metadata: Metadata = {
  title: en.nav.explore,
  description: en.explore.description,
};

export default function ExplorePage() {
  return <ExploreView />;
}
