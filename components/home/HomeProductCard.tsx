"use client";

import { useState } from "react";
import { ShoppingCart, Package } from "lucide-react";
import Link from "next/link";
import { Product } from "@/lib/api";
import { useCartStore } from "@/lib/store";
import toast from "react-hot-toast";

interface HomeProductCardProps {
  product: Product;
  badgeType?: "new" | "sale";
}

export default function HomeProductCard({
  product,
  badgeType,
}: HomeProductCardProps) {
  const [adding, setAdding] = useState(false);
  const { addItem } = useCartStore();

  const imgSrc = product.thumbnailUrl?.startsWith("http")
    ? product.thumbnailUrl
    : product.thumbnailUrl
      ? `http://localhost:8080${product.thumbnailUrl}`
      : null;

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (product.stock === 0) return;
    setAdding(true);
    try {
      await addItem(Number(product.id), 1);
      toast.success("Đã thêm vào giỏ hàng!");
    } catch {
      toast.error("Không thể thêm. Vui lòng đăng nhập trước.");
    } finally {
      setAdding(false);
    }
  }

  // Calculate simulated discount original price if badgeType is 'sale'
  const originalPrice =
    badgeType === "sale"
      ? Math.round((product.price * 1.15) / 10000) * 10000
      : null;

  return (
    <Link
      href={`/explore/${product.id}`}
      className="group bg-white rounded-[20px] border border-[#e8ecf2] hover:border-[#0058be] hover:shadow-[0_12px_32px_rgba(0,88,190,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden relative w-full"
    >
      {/* Grey overlay if out of stock */}
      {product.stock === 0 && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 pointer-events-none transition-opacity" />
      )}

      {/* Image Area */}
      <div className="relative bg-[#f7f9fb] h-[200px] flex items-center justify-center overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            className={`h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 ${
              product.stock === 0 ? "grayscale opacity-60" : ""
            }`}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#cbd5e1]">
            <Package className="size-10" />
            <span className="text-[11px]">Chưa có ảnh</span>
          </div>
        )}

        {/* Badges */}
        {product.stock === 0 ? (
          <span className="absolute top-3.5 left-3.5 bg-red-100 text-red-600 text-[10px] font-bold px-2.5 py-1 rounded-full z-20">
            Hết hàng
          </span>
        ) : badgeType === "new" ? (
          <span className="absolute top-3.5 left-3.5 bg-[#eff6ff] text-[#0058be] border border-blue-100 text-[10px] font-bold px-2.5 py-1 rounded-full z-20 tracking-wider">
            MỚI NIÊM YẾT
          </span>
        ) : badgeType === "sale" ? (
          <span className="absolute top-3.5 left-3.5 bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold px-2.5 py-1 rounded-full z-20 tracking-wider">
            GIẢM 15%
          </span>
        ) : null}

        {/* Stock warning */}
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute top-3.5 right-3.5 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full z-20">
            Chỉ còn {product.stock}
          </span>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {product.brand && (
          <span className="text-[10px] font-bold text-[#0058be] uppercase tracking-[1px] leading-none">
            {product.brand.name}
          </span>
        )}

        <h3
          className={`text-[14px] font-semibold leading-snug line-clamp-2 transition-colors min-h-[40px] ${
            product.stock === 0
              ? "text-[#94a3b8]"
              : "text-[#0f172a] group-hover:text-[#0058be]"
          }`}
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {product.name}
        </h3>

        {/* Price Area */}
        <div className="flex items-baseline justify-between mt-2 pt-3 border-t border-[#f1f5f9] relative z-20">
          <div className="flex flex-col gap-0.5">
            {originalPrice && (
              <span className="text-slate-400 text-[11px] line-through leading-none">
                {originalPrice.toLocaleString("vi-VN")} ₫
              </span>
            )}
            <p
              className={`text-[16px] font-bold leading-none ${product.stock === 0 ? "text-[#94a3b8]" : "text-[#0058be]"}`}
            >
              {product.price.toLocaleString("vi-VN")}
              <span className="text-[11px] font-normal ml-0.5 opacity-70">
                ₫
              </span>
            </p>
          </div>

          <button
            type="button"
            disabled={product.stock === 0 || adding}
            onClick={handleAddToCart}
            className="p-2.5 rounded-[12px] bg-[#f1f5f9] hover:bg-[#0058be] text-[#64748b] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Thêm vào giỏ hàng"
          >
            {adding ? (
              <div className="size-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : (
              <ShoppingCart className="size-4" />
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
