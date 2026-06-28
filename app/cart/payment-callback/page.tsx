"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ShoppingBag,
  CreditCard,
  Calendar,
} from "lucide-react";
import { useCartStore } from "@/lib/store";
import { orderAPI, OrderResponse } from "@/lib/api";
import HomeNavBar from "@/components/home/HomeNavBar";
import AuthFooter from "@/components/auth/AuthFooter";

import { formatPrice, formatDateOnly } from "@/utils/format";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCartStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderResponse | null>(null);

  const responseCode = searchParams.get("vnp_ResponseCode");
  const txnRef = searchParams.get("vnp_TxnRef");

  useEffect(() => {
    async function verifyAndFetch() {
      if (!txnRef) {
        setError("Không tìm thấy mã đơn hàng (TxnRef).");
        setLoading(false);
        return;
      }

      try {
        // Trigger backend IPN processing first to ensure status is updated
        const queryString = searchParams.toString();
        await orderAPI.vnpayCallback(queryString);

        const orderId = parseInt(txnRef);
        const orderData = await orderAPI.getById(orderId);
        setOrder(orderData);

        if (responseCode === "00") {
          await clearCart();
        } else {
          router.replace("/cart?error=vnpay_failed");
          return; // Stop rendering this page and redirect
        }
      } catch (err: any) {
        console.error("Error fetching order in callback:", err);
        setError("Có lỗi xảy ra khi lấy thông tin đơn hàng.");
      } finally {
        setLoading(false);
      }
    }

    verifyAndFetch();
  }, [responseCode, txnRef, searchParams, clearCart, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="size-10 animate-spin text-[#0058be]" />
        <p className="text-[15px] font-semibold text-[#64748b]">
          Đang xác nhận kết quả thanh toán...
        </p>
      </div>
    );
  }

  const isSuccess = responseCode === "00" && !error;

  return (
    <div className="max-w-[500px] w-full px-4 py-12">
      <div className="bg-white rounded-[24px] border border-[#e8ecf2] shadow-xl overflow-hidden">
        {isSuccess ? (
          <>
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-8 flex flex-col items-center text-white">
              <div className="w-16 h-16 rounded-full bg-white/25 flex items-center justify-center mb-4 animate-bounce">
                <CheckCircle2 className="size-10 text-white" />
              </div>
              <h2 className="text-[22px] font-bold mb-1">Thanh toán thành công!</h2>
              <p className="text-emerald-100 text-[14px]">
                Cảm ơn bạn đã tin tưởng và mua sắm tại PCMaster
              </p>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className="bg-[#f8fafc] rounded-[16px] p-4 flex flex-col gap-3">
                <h3 className="text-[13px] font-bold text-[#475569] uppercase tracking-wider">
                  Thông tin đơn hàng
                </h3>
                <div className="flex flex-col gap-2.5 text-[14px]">
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Mã đơn hàng</span>
                    <span className="font-bold text-[#0f172a]">#{order?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Tổng thanh toán</span>
                    <span className="font-bold text-[#0058be]">
                      {order ? formatPrice(order.totalAmount) : "---"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Phương thức thanh toán</span>
                    <span className="font-medium text-[#0f172a] flex items-center gap-1">
                      <CreditCard className="size-4 text-[#0058be]" /> VNPay QR
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Ngày đặt hàng</span>
                    <span className="font-medium text-[#0f172a] flex items-center gap-1">
                      <Calendar className="size-4 text-[#64748b]" />
                      {formatDateOnly(order?.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[13px] text-[#64748b] text-center leading-relaxed px-2">
                Trạng thái thanh toán của đơn hàng đã được cập nhật thành công. 
                PCMaster đang chuẩn bị sản phẩm để bàn giao cho bạn trong thời gian sớm nhất.
              </div>

              <div className="flex flex-col gap-2.5">
                <Link
                  href="/my-orders"
                  className="w-full py-3 rounded-[12px] bg-[#0058be] text-white text-[14px] font-bold text-center hover:bg-[#0047a3] transition-all flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="size-4" /> Xem đơn hàng của tôi
                </Link>
                <Link
                  href="/explore"
                  className="w-full py-3 rounded-[12px] border border-[#e2e8f0] text-[14px] font-semibold text-[#475569] text-center hover:bg-[#f8fafc] transition-colors"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-br from-red-400 to-red-600 p-8 flex flex-col items-center text-white">
              <div className="w-16 h-16 rounded-full bg-white/25 flex items-center justify-center mb-4">
                <XCircle className="size-10 text-white" />
              </div>
              <h2 className="text-[22px] font-bold mb-1">Thanh toán thất bại</h2>
              <p className="text-red-100 text-[14px]">
                Giao dịch của bạn không thể hoàn tất
              </p>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className="bg-red-50 border border-red-100 rounded-[16px] p-4 flex gap-3">
                <AlertTriangle className="size-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <p className="text-[14px] font-bold text-red-800">Chi tiết lỗi</p>
                  <p className="text-[13px] text-red-600 leading-relaxed">
                    {error || "Thao tác thanh toán bị gián đoạn hoặc hủy bỏ bởi người dùng."}
                  </p>
                </div>
              </div>

              {order && (
                <div className="bg-[#f8fafc] rounded-[16px] p-4 flex flex-col gap-2.5 text-[14px] border border-[#e8ecf2]">
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Mã đơn hàng</span>
                    <span className="font-bold text-[#0f172a]">#{order.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Giá trị đơn hàng</span>
                    <span className="font-bold text-[#0f172a]">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>
              )}

              <p className="text-[13px] text-[#64748b] text-center leading-relaxed">
                Đừng lo lắng, đơn hàng của bạn vẫn được lưu trữ ở trạng thái chờ thanh toán. 
                Bạn có thể thử thanh toán lại hoặc chuyển đổi sang phương thức thanh toán COD.
              </p>

              <div className="flex flex-col gap-2.5">
                <Link
                  href="/my-orders"
                  className="w-full py-3 rounded-[12px] bg-[#0058be] text-white text-[14px] font-bold text-center hover:bg-[#0047a3] transition-all flex items-center justify-center gap-1.5"
                >
                  Đi đến đơn hàng của tôi <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/cart"
                  className="w-full py-3 rounded-[12px] border border-[#e2e8f0] text-[14px] font-semibold text-[#475569] text-center hover:bg-[#f8fafc] transition-colors"
                >
                  Quay lại giỏ hàng
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "linear-gradient(180deg, #f7f9fb 0%, #f0f4fa 100%)" }}>
      <HomeNavBar />
      <main className="flex-1 pt-[72px] flex items-center justify-center">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="size-10 animate-spin text-[#0058be]" />
            <p className="text-[15px] font-semibold text-[#64748b]">Đang tải dữ liệu giao dịch...</p>
          </div>
        }>
          <PaymentCallbackContent />
        </Suspense>
      </main>
      <AuthFooter />
    </div>
  );
}
