import type { Metadata } from 'next';
import { AuthFooterLinks } from '@/components/auth/AuthFooterLinks';
import { AuthShell } from '@/components/auth/AuthShell';
import { SignupForm } from '@/components/auth/SignupForm';
import { en } from '@/strings/en';

export const metadata: Metadata = { title: en.nav.signup };

export default function SignupPage() {
  return (
    <AuthShell
      title={en.auth.signup.title}
      subtitle={en.auth.signup.subtitle}
      footer={<AuthFooterLinks mode="signup" />}
    >
      <SignupForm />
    </AuthShell>
  );
}
