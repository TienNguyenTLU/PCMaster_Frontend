import type { Metadata } from 'next';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Create Account – PCMaster',
  description:
    'Join the PCMaster network. Create your account to access precision-engineered tools for the ultimate PC building experience.',
};

export default function RegisterPage() {
  return (
    <AuthPageLayout>
      <RegisterForm />
    </AuthPageLayout>
  );
}
