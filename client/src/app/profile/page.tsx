import type { Metadata } from 'next';
import { ProfileView } from '@/components/profile/ProfileView';
import { en } from '@/strings/en';

export const metadata: Metadata = {
  title: en.profile.title,
  description: en.profile.subtitle,
};

export default function ProfilePage() {
  return <ProfileView />;
}
