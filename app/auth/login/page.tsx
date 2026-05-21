import type { Metadata } from 'next';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Đăng Nhập – PCMaster',
  description:
    'Đăng nhập tài khoản PCMaster của bạn để tiếp cận kho thông số kỹ thuật chi tiết cùng các công cụ tự lắp ráp PC hàng đầu.',
};

export default function LoginPage() {
  return (
    <AuthPageLayout>
      <LoginForm />
    </AuthPageLayout>
  );
}
