import type { Metadata } from 'next';
import { LabView } from '@/components/lab/LabView';
import { en } from '@/strings/en';

export const metadata: Metadata = { title: en.nav.lab };

export default function LabPage() {
  return <LabView />;
}
