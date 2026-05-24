import type { Metadata } from 'next';
import HomeNavBar from '@/components/home/HomeNavBar';
import AuthFooter from '@/components/auth/AuthFooter';
import PrebuiltPage from '@/components/prebuilt/PrebuiltPage';

export const metadata: Metadata = {
  title: 'Hệ thống PC Build Sẵn – PCMaster Systems',
  description:
    'Khám phá hệ thống máy tính lắp ráp chuyên nghiệp tối ưu hiệu năng. Đa dạng cấu hình, linh kiện chính hãng, bảo hành dài hạn.',
};

export default function PrebuiltRoute() {
  return (
    <div className="flex flex-col min-h-screen">
      <HomeNavBar />
      <main className="flex-1 pt-[72px]">
        <PrebuiltPage />
      </main>
      <AuthFooter />
    </div>
  );
}
