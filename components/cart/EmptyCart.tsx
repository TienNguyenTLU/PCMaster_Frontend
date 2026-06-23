"use client";

import Link from "next/link";
import { ShoppingCart, ShoppingBag } from "lucide-react";

export default function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-[#eff6ff] flex items-center justify-center">
          <ShoppingCart className="size-10 text-[#0058be]/50" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#f1f5f9] border-2 border-white flex items-center justify-center">
          <span className="text-[12px] font-bold text-[#94a3b8]">0</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[18px] font-bold text-[#0f172a] mb-1.5">
          Giỏ hàng trống
        </p>
        <p className="text-[14px] text-[#94a3b8] max-w-[280px]">
          Bạn chưa thêm sản phẩm nào. Hãy khám phá và chọn linh kiện phù hợp.
        </p>
      </div>
      <Link
        href="/explore"
        className="flex items-center gap-2 px-6 py-3 bg-[#0058be] text-white text-[14px] font-semibold rounded-[14px] shadow-[0_4px_16px_rgba(0,88,190,0.30)] hover:bg-[#0047a3] hover:shadow-[0_4px_20px_rgba(0,88,190,0.40)] transition-all duration-200"
      >
        <ShoppingBag className="size-4" />
        Khám phá ngay
      </Link>
    </div>
  );
}
