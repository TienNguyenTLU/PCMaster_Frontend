"use client";

import {
  LucideIcon,
  Plus,
  Trash2,
  Package,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { Product } from "@/lib/api";
import Link from "next/link";
import { formatPrice } from "@/utils/format";

interface BuildSlotProps {
  slotKey: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  product: Product | null;
  onPick: () => void;
  onRemove: () => void;
}

export default function BuildSlot({
  label,
  description,
  Icon,
  product,
  onPick,
  onRemove,
}: BuildSlotProps) {
  const imgSrc = product?.thumbnailUrl?.startsWith("http")
    ? product.thumbnailUrl
    : product?.thumbnailUrl
      ? `http://localhost:8080${product.thumbnailUrl}`
      : null;

  const isOutOfStock = product && product.stock === 0;

  const specs = (() => {
    try {
      return product?.specsJson ? JSON.parse(product.specsJson) : {};
    } catch {
      return {};
    }
  })();

  const highlights: string[] = [];
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

  return (
    <div
      className={`group flex items-center gap-5 p-5 rounded-[20px] border transition-all duration-300 ${
        product
          ? isOutOfStock
            ? "border-red-200 bg-red-50/30"
            : "border-[#0058be]/10 bg-[#eff6ff]/20 hover:border-[#0058be]/30 hover:shadow-[0_8px_30px_rgba(0,88,190,0.08)] hover:-translate-y-0.5"
          : "border-[#cbd5e1]/50 bg-white hover:border-[#0058be]/30 hover:shadow-[0_8px_30px_rgba(0,88,190,0.04)] hover:-translate-y-0.5"
      }`}
    >
      {}
      <div
        className={`size-12 rounded-[14px] flex items-center justify-center shrink-0 border transition-all duration-300 ${
          product
            ? isOutOfStock
              ? "bg-red-100 border-red-200 text-red-500"
              : "bg-[#0058be] border-[#0058be] text-white shadow-md shadow-[0_4px_12px_rgba(0,88,190,0.25)]"
            : "bg-[#f8fafc] border-[#cbd5e1]/40 text-[#94a3b8] group-hover:bg-[#eff6ff] group-hover:border-[#0058be]/30 group-hover:text-[#0058be]"
        }`}
      >
        <Icon className="size-6" />
      </div>

      {}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[1px]">
            {label}
          </p>
          {isOutOfStock && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
              <AlertTriangle className="size-2.5" /> Hết hàng
            </span>
          )}
        </div>

        {product ? (
          <div className="flex items-center gap-3">
            {}
            {imgSrc ? (
              <div className="size-10 rounded-[8px] bg-[#f7f9fb] border border-[#cbd5e1]/40 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                <img
                  src={imgSrc}
                  alt={product.name}
                  className="size-full object-contain"
                />
              </div>
            ) : (
              <div className="size-10 rounded-[8px] bg-[#f7f9fb] border border-[#cbd5e1]/40 flex items-center justify-center shrink-0">
                <Package className="size-4 text-[#cbd5e1]" />
              </div>
            )}
            <div className="min-w-0">
              {product.brand && (
                <p className="text-[10px] font-bold text-[#0058be] uppercase tracking-[0.8px] leading-none mb-1">
                  {product.brand.name}
                </p>
              )}
              <p className="text-[14px] font-semibold text-[#0f172a] leading-snug line-clamp-1 mb-0.5">
                {product.name}
              </p>
              {highlights.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {highlights.slice(0, 3).map((h, i) => (
                    <span
                      key={i}
                      className="text-[9px] bg-white border border-[#cbd5e1]/40 text-[#64748b] px-1.5 py-0.5 rounded-[4px] font-medium leading-none"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-[14px] text-[#94a3b8]">{description}</p>
        )}
      </div>

      {}
      <div className="flex items-center gap-2 shrink-0">
        {product ? (
          <>
            <div className="text-right mr-1.5">
              <p
                className="text-[15px] font-bold text-[#0058be]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {formatPrice(product.price)}
              </p>
            </div>
            <Link
              href={`/explore/${product.id}`}
              target="_blank"
              className="p-2 rounded-[10px] bg-white border border-[#cbd5e1]/60 text-[#64748b] hover:border-[#0058be] hover:text-[#0058be] hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shrink-0"
              aria-label="Xem chi tiết"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="size-4" />
            </Link>
            <button
              type="button"
              onClick={onPick}
              className="p-2 rounded-[10px] bg-white border border-[#cbd5e1]/60 text-[#64748b] hover:border-[#0058be] hover:text-[#0058be] hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shrink-0"
              aria-label="Đổi linh kiện"
            >
              <Package className="size-4" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-2 rounded-[10px] bg-white border border-[#cbd5e1]/60 text-[#64748b] hover:border-red-200 hover:bg-red-50 hover:text-red-500 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shrink-0"
              aria-label="Xóa"
            >
              <Trash2 className="size-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onPick}
            className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-[12px] bg-white border border-[#cbd5e1] text-[#0f172a] text-[13px] font-bold shadow-sm hover:border-[#0058be] hover:text-[#0058be] hover:bg-[#eff6ff]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
          >
            <Plus className="size-4" />
            Chọn linh kiện
          </button>
        )}
      </div>
    </div>
  );
}
