import type { Metadata } from 'next';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In – PCMaster',
  description:
    'Sign in to your PCMaster account to access high-fidelity PC building tools and laboratory-grade specifications.',
};

export default function LoginPage() {
  return (
    <AuthPageLayout>
      <LoginForm />
    </AuthPageLayout>
  );
}
