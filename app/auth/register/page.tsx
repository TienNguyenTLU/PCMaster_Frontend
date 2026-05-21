import type { Metadata } from 'next';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Đăng Ký Tài Khoản – PCMaster',
  description:
    'Tham gia hệ thống PCMaster. Tạo tài khoản của bạn để sử dụng các công cụ tự lắp ráp PC hiệu năng cao chuyên nghiệp.',
};

export default function RegisterPage() {
  return (
    <AuthPageLayout>
      <RegisterForm />
    </AuthPageLayout>
  );
}
