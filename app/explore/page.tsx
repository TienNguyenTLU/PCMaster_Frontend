import { Suspense } from 'react';
import type { Metadata } from 'next';
import HomeNavBar from '@/components/home/HomeNavBar';
import AuthFooter from '@/components/auth/AuthFooter';
import ExplorePage from '@/components/explore/ExplorePage';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Khám phá linh kiện – PCMaster',
  description:
    'Tìm kiếm và so sánh hàng nghìn linh kiện máy tính: CPU, GPU, RAM, Mainboard, SSD, PSU, Case và nhiều hơn nữa. Lọc theo thông số kỹ thuật chuyên sâu.',
};

export default function ExploreRoute() {
  return (
    <div className="flex flex-col min-h-screen">
      <HomeNavBar />
      <main className="flex-1 pt-[72px]">
        <Suspense fallback={
          <div className="flex items-center justify-center py-20 text-[#64748b]">
            <Loader2 className="size-8 animate-spin text-[#0058be] mr-2" /> Đang tải bộ lọc linh kiện...
          </div>
        }>
          <ExplorePage />
        </Suspense>
      </main>
      <AuthFooter />
    </div>
  );
}
