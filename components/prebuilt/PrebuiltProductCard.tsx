"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Package, Cpu } from "lucide-react";
import { Product } from "@/lib/api";
import { CldImage } from "next-cloudinary";
import { useCartManager } from "@/hooks/useCartManager";

interface PrebuiltProductCardProps {
  product: Product;
}

export function PrebuiltProductCard({ product }: PrebuiltProductCardProps) {
  const [imgErr, setImgErr] = useState(false);
  const { handleAddToCart, addingIds } = useCartManager();
  const adding = addingIds.has(Number(product.id));

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
      className="group bg-white rounded-[16px] border border-[#e8ecf2] hover:border-[#0058be] hover:shadow-[0_8px_32px_rgba(0,88,190,0.12)] transition-all duration-300 flex flex-col overflow-hidden relative"
    >
      <div
        className={`absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 transition-opacity ${product.stock === 0 ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />

      {}
      <div className="relative bg-[#f7f9fb] h-[192px] flex items-center justify-center overflow-hidden border-b border-[#f1f5f9]">
        {imgSrc && !imgErr ? (
          imgSrc.startsWith("http://localhost") ? (
            <img
              src={imgSrc}
              alt={product.name}
              className={`h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 ${product.stock === 0 ? "grayscale opacity-60" : ""}`}
              onError={() => setImgErr(true)}
            />
          ) : (
            <CldImage
              src={imgSrc}
              alt={product.name}
              width={240}
              height={192}
              crop="fill"
              className={`h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 ${product.stock === 0 ? "grayscale opacity-60" : ""}`}
              onError={() => setImgErr(true)}
            />
          )
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#cbd5e1]">
            <Package className="size-10" />
            <span className="text-[11px]">Chưa có ảnh</span>
          </div>
        )}
        {product.stock === 0 && (
          <span className="absolute top-2.5 left-2.5 bg-red-100 text-red-600 text-[10px] font-bold px-2.5 py-1 rounded-full z-20">
            Hết hàng
          </span>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute top-2.5 left-2.5 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full z-20">
            Còn {product.stock} SP
          </span>
        )}
      </div>

      {}
      <div className="flex flex-col flex-1 p-4 gap-2.5 z-0 justify-between">
        <div className="flex flex-col gap-2">
          {product.brand && (
            <span className="text-[10px] font-bold text-[#0058be] uppercase tracking-[0.8px]">
              {product.brand.name}
            </span>
          )}
          <h3
            className={`text-[13px] font-semibold leading-snug line-clamp-2 transition-colors ${product.stock === 0 ? "text-[#94a3b8]" : "text-[#0f172a] group-hover:text-[#0058be]"}`}
          >
            {product.name}
          </h3>

          {}
          {product.pcComponents && product.pcComponents.length > 0 && (
            <div className="flex flex-col gap-1.5 bg-[#f8fafc] rounded-[12px] p-2.5 border border-slate-100 mt-1 relative z-20 text-left">
              <p className="text-[9px] font-extrabold text-[#64748b] uppercase tracking-[0.5px] flex items-center gap-1">
                <Cpu className="size-3 text-[#0058be]" /> Linh kiện đi kèm:
              </p>
              <div className="flex flex-col gap-0.5">
                {product.pcComponents.slice(0, 3).map((comp) => (
                  <div
                    key={comp.componentProductId}
                    className="flex items-center gap-1 text-[11px] text-[#475569] font-medium truncate"
                  >
                    <span className="text-[#0058be] font-bold text-[8px]">
                      •
                    </span>
                    <span className="truncate">
                      {comp.componentProductName}
                    </span>
                  </div>
                ))}
                {product.pcComponents.length > 3 && (
                  <p className="text-[9px] font-bold text-[#0058be] mt-0.5">
                    Và {product.pcComponents.length - 3} linh kiện khác...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-[#f1f5f9] relative z-20 mt-2">
          <div>
            <p className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-[0.5px]">
              Giá bán lẻ
            </p>
            <p
              className={`text-[16px] font-bold ${product.stock === 0 ? "text-[#94a3b8]" : "text-[#0058be]"}`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {product.price.toLocaleString("vi-VN")}
              <span className="text-[11px] font-normal ml-1 opacity-70">₫</span>
            </p>
          </div>
          <button
            type="button"
            disabled={product.stock === 0 || adding}
            onClick={handleAddToCartClick}
            className="p-2 rounded-[8px] bg-[#f1f5f9] hover:bg-[#0058be] text-[#64748b] hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Thêm vào giỏ"
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

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-[16px] border border-[#e8ecf2] flex flex-col overflow-hidden animate-pulse">
      <div className="h-[192px] bg-[#f1f5f9]" />
      <div className="p-4 flex flex-col gap-2.5">
        <div className="h-3 bg-[#e2e8f0] rounded w-16" />
        <div className="h-4 bg-[#e2e8f0] rounded w-full" />
        <div className="h-4 bg-[#e2e8f0] rounded w-3/4" />
        <div className="h-[52px] bg-[#f1f5f9] rounded-[12px] w-full" />
        <div className="flex justify-between items-center pt-2.5 border-t border-[#f1f5f9] mt-auto">
          <div className="h-5 bg-[#e2e8f0] rounded w-24" />
          <div className="h-8 w-8 bg-[#e2e8f0] rounded-[8px]" />
        </div>
      </div>
    </div>
  );
}
