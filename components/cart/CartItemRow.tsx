"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Minus, Plus, X, AlertCircle, Loader2 } from "lucide-react";
import { formatPrice, getImageSrc } from "@/utils/format";

interface CartItemRowProps {
  item: {
    id: number;
    productId: number;
    productName: string;
    productThumbnailUrl: string | null;
    productPrice: number;
    productDiscountPrice?: number | null;
    productStock: number;
    quantity: number;
  };
  onRemove: (id: number) => void;
  onUpdateQty: (id: number, qty: number) => void;
  removing: boolean;
  updating: boolean;
}

export default function CartItemRow({
  item,
  onRemove,
  onUpdateQty,
  removing,
  updating,
}: CartItemRowProps) {
  const [imgErr, setImgErr] = useState(false);
  const imgSrc = getImageSrc(item.productThumbnailUrl);
  const hasDiscount =
    item.productDiscountPrice !== null &&
    item.productDiscountPrice !== undefined;
  const currentPrice =
    hasDiscount && item.productDiscountPrice
      ? item.productDiscountPrice
      : item.productPrice;
  const lineTotal = currentPrice * item.quantity;
  const isOutOfStock = item.productStock === 0;

  return (
    <div
      className={`flex gap-4 p-4 bg-white rounded-[16px] border transition-all duration-200 ${
        removing
          ? "opacity-50 scale-95 border-red-200"
          : "border-[#e8ecf2] hover:border-[#0058be]/30 hover:shadow-sm"
      }`}
    >
      <Link
        href={`/explore/${item.productId}`}
        className="shrink-0 w-[88px] h-[88px] bg-[#f7f9fb] rounded-[12px] flex items-center justify-center overflow-hidden border border-[#f1f5f9] hover:border-[#0058be]/40 transition-colors"
      >
        {imgSrc && !imgErr ? (
          <img
            src={imgSrc}
            alt={item.productName}
            className="w-full h-full object-contain p-2"
            onError={() => setImgErr(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <Package className="size-8 text-[#cbd5e1]" />
        )}
      </Link>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <Link
          href={`/explore/${item.productId}`}
          className="text-[14px] font-semibold text-[#0f172a] hover:text-[#0058be] transition-colors line-clamp-2 leading-snug"
        >
          {item.productName}
        </Link>

        {isOutOfStock && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-500">
            <AlertCircle className="size-3.5 shrink-0" />
            Sản phẩm đã hết hàng
          </div>
        )}
        {!isOutOfStock && item.productStock <= 5 && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600">
            <AlertCircle className="size-3.5 shrink-0" />
            Chỉ còn {item.productStock} sản phẩm
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mt-auto pt-1.5 flex-wrap">
          <div className="flex items-center gap-0 bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] overflow-hidden">
            <button
              type="button"
              disabled={updating || item.quantity <= 1 || isOutOfStock}
              onClick={() => onUpdateQty(item.id, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center text-[#475569] hover:bg-[#e2e8f0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Giảm"
            >
              <Minus className="size-3" />
            </button>
            <span className="w-9 h-8 flex items-center justify-center text-[13px] font-bold text-[#0f172a] border-x border-[#e2e8f0]">
              {updating ? (
                <Loader2 className="size-3 animate-spin text-[#0058be]" />
              ) : (
                item.quantity
              )}
            </span>
            <button
              type="button"
              disabled={
                updating || item.quantity >= item.productStock || isOutOfStock
              }
              onClick={() => onUpdateQty(item.id, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-[#475569] hover:bg-[#e2e8f0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Tăng"
            >
              <Plus className="size-3" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {hasDiscount ? (
              <div className="flex flex-col items-end">
                <span className="text-[15px] font-bold text-red-500">
                  {formatPrice(lineTotal)}
                </span>
                <span className="text-[11px] text-[#94a3b8] line-through font-medium">
                  {formatPrice(item.productPrice * item.quantity)}
                </span>
              </div>
            ) : (
              <span className="text-[15px] font-bold text-[#0058be]">
                {formatPrice(lineTotal)}
              </span>
            )}
            <button
              type="button"
              disabled={removing}
              onClick={() => onRemove(item.id)}
              className="p-1.5 rounded-[8px] text-[#94a3b8] hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Xóa sản phẩm"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
