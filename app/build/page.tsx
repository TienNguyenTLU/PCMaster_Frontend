import { Suspense } from 'react';
import type { Metadata } from 'next';
import HomeNavBar from '@/components/home/HomeNavBar';
import AuthFooter from '@/components/auth/AuthFooter';
import BuildPage from '@/components/builds/BuildPage';
import { Loader2 } from 'lucide-react';

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
        <Suspense fallback={
          <div className="flex items-center justify-center py-20 text-[#64748b]">
            <Loader2 className="size-8 animate-spin text-[#0058be] mr-2" /> Đang tải cấu hình PC...
          </div>
        }>
          <BuildPage />
        </Suspense>
      </main>
      <AuthFooter />
    </div>
  );
}
