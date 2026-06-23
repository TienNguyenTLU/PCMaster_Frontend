"use client";

import Link from "next/link";
import { CheckCircle2, Home, Store } from "lucide-react";
import { DeliveryType } from "@/lib/api";
import { formatPrice } from "@/utils/format";

interface OrderSuccessModalProps {
  orderId: number;
  total: number;
  deliveryType: DeliveryType;
  onClose: () => void;
}

export default function OrderSuccessModal({
  orderId,
  total,
  deliveryType,
  onClose,
}: OrderSuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[420px] overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
            <CheckCircle2 className="size-9 text-white" />
          </div>
          <h2 className="text-[22px] font-bold text-white mb-1">
            Đặt hàng thành công!
          </h2>
          <p className="text-emerald-100 text-[14px]">
            Đơn hàng #{orderId} đang chờ xác nhận
          </p>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="bg-[#f8fafc] rounded-[12px] p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#475569] font-medium">
                Tổng thanh toán
              </span>
              <span className="text-[18px] font-bold text-[#0058be]">
                {formatPrice(total)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-[#64748b] font-medium">
              {deliveryType === "HOME_DELIVERY" ? (
                <>
                  <Home className="size-3.5" /> Giao hàng tận nhà
                </>
              ) : (
                <>
                  <Store className="size-3.5" /> Nhận tại showroom – 123 Đường
                  Láng, Hà Nội
                </>
              )}
            </div>
          </div>
          <p className="text-[13px] text-[#64748b] text-center leading-relaxed">
            Đơn hàng đang ở trạng thái <strong>chờ xác nhận</strong>. PCMaster
            sẽ liên hệ sớm nhất để xác nhận và giao hàng.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-[12px] border border-[#e2e8f0] text-[14px] font-semibold text-[#475569] hover:bg-[#f8fafc] transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <Link
              href="/explore"
              className="flex-1 py-2.5 rounded-[12px] bg-[#0058be] text-white text-[14px] font-semibold text-center hover:bg-[#0047a3] transition-colors"
              onClick={onClose}
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
