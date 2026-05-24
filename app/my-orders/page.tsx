import type { Metadata } from 'next';
import HomeNavBar from '@/components/home/HomeNavBar';
import AuthFooter from '@/components/auth/AuthFooter';
import MyOrdersPage from '@/components/orders/MyOrdersPage';

export const metadata: Metadata = {
  title: 'Đơn hàng của tôi – PCMaster Dashboard',
  description:
    'Theo dõi hành trình giao nhận, thông tin đơn hàng và xem lại các hóa đơn PDF điện tử đã thanh toán.',
};

export default function MyOrdersRoute() {
  return (
    <div className="flex flex-col min-h-screen">
      <HomeNavBar />
      <main className="flex-1 pt-[72px]">
        <MyOrdersPage />
      </main>
      <AuthFooter />
    </div>
  );
}
