import React, { useState } from "react";
import { ShoppingCart, Package } from "lucide-react";
import Link from "next/link";
import { Product } from "@/lib/api";
import { useCartManager } from "@/hooks/useCartManager";
import { CldImage } from "next-cloudinary";

interface ProductCardProps {
  product: Product;
  isMini?: boolean;
}

export default function ProductCard({ product, isMini = false }: ProductCardProps) {
  const [imgErr, setImgErr] = useState(false);
  const { handleAddToCart, addingIds } = useCartManager();
  const adding = addingIds.has(Number(product.id));
  const specs = (() => {
    try {
      return product.specsJson ? JSON.parse(product.specsJson) : {};
    } catch {
      return {};
    }
  })();

  const highlights: string[] = [];
  if (!isMini) {
    if (specs.cores) highlights.push(`${specs.cores} nhân`);
    if (specs.threads) highlights.push(`${specs.threads} luồng`);
    if (specs.socket) highlights.push(specs.socket);
    if (specs.vram) highlights.push(`${specs.vram}GB VRAM`);
    if (specs.capacity_gb && !specs.vram)
      highlights.push(`${specs.capacity_gb}GB`);
    if (specs.wattage) highlights.push(`${specs.wattage}W`);
    if (specs.refresh_rate_hz) highlights.push(`${specs.refresh_rate_hz}Hz`);
    if (specs.panel_type) highlights.push(specs.panel_type);
    if (specs.ram_type && !specs.vram && !specs.cores)
      highlights.push(specs.ram_type);
  }

  const imgSrc = product.thumbnailUrl?.startsWith("http")
    ? product.thumbnailUrl
    : product.thumbnailUrl
      ? `http://localhost:8080${product.thumbnailUrl}`
      : null;

  async function handleAddToCartClick(e: React.MouseEvent) {
    e.preventDefault();
    if (product.stock === 0) return;
    await handleAddToCart(Number(product.id), 1);
  }

  return (
    <Link
      href={`/explore/${product.id}`}
      className={`group bg-white ${isMini ? "rounded-[12px]" : "rounded-[16px]"} border border-[#e8ecf2] hover:border-[#0058be] hover:shadow-[0_8px_32px_rgba(0,88,190,0.12)] transition-all duration-300 flex flex-col overflow-hidden relative`}
    >
      <div
        className={`absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 transition-opacity ${product.stock === 0 ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />

      <div className={`relative bg-[#f7f9fb] ${isMini ? "h-[105px]" : "h-[192px]"} flex items-center justify-center overflow-hidden`}>
        {imgSrc && !imgErr ? (
          imgSrc.startsWith("http://localhost") ? (
            <img
              src={imgSrc}
              alt={product.name}
              className={`h-full w-full object-contain ${isMini ? "p-2" : "p-4"} group-hover:scale-105 transition-transform duration-300 ${product.stock === 0 ? "grayscale opacity-60" : ""}`}
              onError={() => setImgErr(true)}
            />
          ) : (
            <CldImage
              src={imgSrc}
              alt={product.name}
              width={240}
              height={isMini ? 105 : 192}
              crop="fill"
              className={`h-full w-full object-contain ${isMini ? "p-2" : "p-4"} group-hover:scale-105 transition-transform duration-300 ${product.stock === 0 ? "grayscale opacity-60" : ""}`}
              onError={() => setImgErr(true)}
            />
          )
        ) : (
          <div className={`flex flex-col items-center ${isMini ? "gap-1 text-[#cbd5e1]" : "gap-2 text-[#cbd5e1]"}`}>
            <Package className={isMini ? "size-6" : "size-10"} />
            <span className={isMini ? "text-[9px]" : "text-[11px]"}>Chưa có ảnh</span>
          </div>
        )}
        {product.stock === 0 && (
          <span className={`absolute ${isMini ? "top-1.5 left-1.5 text-[8px] px-1.5 py-0.5" : "top-2.5 left-2.5 text-[10px] px-2.5 py-1"} bg-red-100 text-red-600 font-bold rounded-full z-20`}>
            Hết hàng
          </span>
        )}
        {product.stock > 0 &&
        product.discountPercent &&
        product.discountPercent > 0 ? (
          <span className={`absolute ${isMini ? "top-1.5 right-1.5 text-[8px] px-1.5 py-0.5 rounded-[4px]" : "top-2.5 right-2.5 text-[10px] px-2 py-0.5 rounded-[6px]"} bg-red-500 text-white font-bold shadow-sm z-20 animate-pulse`}>
            SALE -{product.discountPercent}%
          </span>
        ) : null}
        {product.stock > 0 && product.stock <= 5 && (
          <span className={`absolute ${isMini ? "top-1.5 left-1.5 text-[8px] px-1.5 py-0.5" : "top-2.5 left-2.5 text-[10px] px-2 py-0.5"} bg-amber-100 text-amber-700 font-bold rounded-full z-20`}>
            Còn {product.stock} SP
          </span>
        )}
      </div>

      <div className={`flex flex-col flex-1 ${isMini ? "p-2.5 gap-1.5" : "p-4 gap-2.5"} z-0`}>
        {product.brand && (
          <span className={`${isMini ? "text-[8px] tracking-[0.5px]" : "text-[10px] tracking-[0.8px]"} font-bold text-[#0058be] uppercase`}>
            {product.brand.name}
          </span>
        )}
        <h3
          className={`${isMini ? "text-[11px] min-h-[32px]" : "text-[13px]"} font-semibold leading-snug line-clamp-2 transition-colors ${product.stock === 0 ? "text-[#94a3b8]" : "text-[#0f172a] group-hover:text-[#0058be]"}`}
          title={product.name}
        >
          {product.name}
        </h3>
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-1 relative z-20">
            {highlights.slice(0, 3).map((h, i) => (
              <span
                key={i}
                className="text-[10px] bg-[#f1f5f9] text-[#64748b] px-2 py-0.5 rounded-full font-medium"
              >
                {h}
              </span>
            ))}
          </div>
        )}
        <div className="flex-1" />
        <div className={`flex items-center justify-between ${isMini ? "pt-2" : "pt-2.5"} border-t border-[#f1f5f9] relative z-20`}>
          {product.discountPrice ? (
            <div className="flex flex-col gap-0.5">
              <p
                className={`${isMini ? "text-[12px]" : "text-[16px]"} font-bold ${product.stock === 0 ? "text-[#94a3b8]" : "text-red-500"}`}
              >
                {product.discountPrice.toLocaleString("vi-VN")}
                <span className={`${isMini ? "text-[9px]" : "text-[11px]"} font-normal ml-0.5 opacity-70`}>
                  ₫
                </span>
              </p>
              <p className={`${isMini ? "text-[9px]" : "text-[11px]"} text-[#94a3b8] line-through font-medium leading-none`}>
                {product.price.toLocaleString("vi-VN")}₫
              </p>
            </div>
          ) : (
            <p
              className={`${isMini ? "text-[12px]" : "text-[16px]"} font-bold ${product.stock === 0 ? "text-[#94a3b8]" : "text-[#0058be]"}`}
            >
              {product.price.toLocaleString("vi-VN")}
              <span className={`${isMini ? "text-[9px]" : "text-[11px]"} font-normal ml-1 opacity-70`}>₫</span>
            </p>
          )}
          <button
            type="button"
            disabled={product.stock === 0 || adding}
            onClick={handleAddToCartClick}
            className={`${isMini ? "p-1.5 rounded-md" : "p-2 rounded-[8px]"} bg-[#f1f5f9] hover:bg-[#0058be] text-[#64748b] hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label="Thêm vào giỏ"
          >
            {adding ? (
              <div className={`${isMini ? "size-3.5" : "size-4"} border-2 border-current/30 border-t-current rounded-full animate-spin`} />
            ) : (
              <ShoppingCart className={isMini ? "size-3.5" : "size-4"} />
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
