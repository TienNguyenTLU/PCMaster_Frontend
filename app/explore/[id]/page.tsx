import type { Metadata } from 'next';
import HomeNavBar from '@/components/home/HomeNavBar';
import AuthFooter from '@/components/auth/AuthFooter';
import ProductDetailPage from '@/components/explore/ProductDetailPage';

export const metadata: Metadata = {
  title: 'Chi tiết sản phẩm – PCMaster',
  description: 'Xem thông tin chi tiết, thông số kỹ thuật và giá sản phẩm linh kiện máy tính tại PCMaster.',
};

export default function ProductDetailRoute() {
  return (
    <div className="flex flex-col min-h-screen">
      <HomeNavBar />
      <main className="flex-1 pt-[72px]">
        <ProductDetailPage />
      </main>
      <AuthFooter />
    </div>
  );
}
