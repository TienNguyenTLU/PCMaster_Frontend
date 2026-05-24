import type { Metadata } from 'next';
import HomeNavBar from '@/components/home/HomeNavBar';
import AuthFooter from '@/components/auth/AuthFooter';
import BuildPage from '@/components/builds/BuildPage';

export const metadata: Metadata = {
  title: 'Xây dựng cấu hình PC – PCMaster Builder',
  description:
    'Tự tay chọn từng linh kiện để lắp ráp bộ máy tính theo ý muốn. So sánh giá, kiểm tra tồn kho và thêm toàn bộ vào giỏ hàng chỉ với một bước.',
};

export default function BuildRoute() {
  return (
    <div className="flex flex-col min-h-screen">
      <HomeNavBar />
      <main className="flex-1 pt-[72px]">
        <BuildPage />
      </main>
      <AuthFooter />
    </div>
  );
}
