import type { Metadata } from 'next';
import { LearnHubPage } from '@/features/learn/components/LearnHubPage';
import { en } from '@/strings/en';

export const metadata: Metadata = { title: en.hubTitle };

export default function LearnPage() {
  return <LearnHubPage />;
}
