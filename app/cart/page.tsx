import type { Metadata } from "next";
import HomeNavBar from "@/components/home/HomeNavBar";
import AuthFooter from "@/components/auth/AuthFooter";
import CartPage from "@/components/cart/CartPage";

export const metadata: Metadata = {
  title: "Giỏ hàng – PCMaster",
  description:
    "Xem và quản lý giỏ hàng của bạn tại PCMaster. Đặt hàng linh kiện máy tính chính hãng nhanh chóng, dễ dàng.",
};

export default function CartRoute() {
  return (
    <div className="flex flex-col min-h-screen">
      <HomeNavBar />
      <main className="flex-1 pt-[72px]">
        <CartPage />
      </main>
      <AuthFooter />
    </div>
  );
}
