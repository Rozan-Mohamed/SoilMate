import type { Metadata } from 'next';
import { AuthFooterLinks } from '@/components/auth/AuthFooterLinks';
import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from '@/components/auth/LoginForm';
import { en } from '@/strings/en';

export const metadata: Metadata = { title: en.nav.login };

export default function LoginPage() {
  return (
    <AuthShell
      title={en.auth.login.title}
      subtitle={en.auth.login.subtitle}
      footer={<AuthFooterLinks mode="login" />}
    >
      <LoginForm />
    </AuthShell>
  );
}
