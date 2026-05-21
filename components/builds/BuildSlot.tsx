'use client';

import { LucideIcon, Plus, Trash2, Package, ExternalLink, AlertTriangle } from 'lucide-react';
import { Product } from '@/lib/api';
import Link from 'next/link';

interface BuildSlotProps {
  slotKey: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  product: Product | null;
  onPick: () => void;
  onRemove: () => void;
}

export default function BuildSlot({ label, description, Icon, product, onPick, onRemove }: BuildSlotProps) {
  const imgSrc = product?.thumbnailUrl?.startsWith('http')
    ? product.thumbnailUrl
    : product?.thumbnailUrl
      ? `http://localhost:8080${product.thumbnailUrl}`
      : null;

  const isOutOfStock = product && product.stock === 0;

  return (
    <div
      className={`group flex items-center gap-5 p-5 rounded-[20px] border transition-all duration-300 ${
        product
          ? isOutOfStock
            ? 'border-red-200 bg-red-50/30'
            : 'border-[#0058be]/20 bg-[#eff6ff]/40 hover:border-[#0058be]/40 hover:shadow-[0_4px_20px_rgba(0,88,190,0.06)]'
          : 'border-[#e8ecf2] bg-white hover:border-[#0058be]/30 hover:shadow-sm'
      }`}
    >
      {/* Slot Icon */}
      <div className={`size-12 rounded-[14px] flex items-center justify-center shrink-0 transition-all duration-300 ${
        product
          ? isOutOfStock
            ? 'bg-red-100 text-red-500'
            : 'bg-[#0058be] text-white shadow-md shadow-blue-200'
          : 'bg-[#f1f5f9] text-[#94a3b8] group-hover:bg-[#eff6ff] group-hover:text-[#0058be]'
      }`}>
        <Icon className="size-6" />
      </div>

      {/* Label + product info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[1px]">{label}</p>
          {isOutOfStock && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
              <AlertTriangle className="size-2.5" /> Hết hàng
            </span>
          )}
        </div>

        {product ? (
          <div className="flex items-center gap-3">
            {/* Thumbnail */}
            {imgSrc ? (
              <div className="size-10 rounded-[8px] bg-[#f7f9fb] border border-[#e8ecf2] overflow-hidden shrink-0">
                <img src={imgSrc} alt={product.name} className="size-full object-contain p-0.5" />
              </div>
            ) : (
              <div className="size-10 rounded-[8px] bg-[#f7f9fb] border border-[#e8ecf2] flex items-center justify-center shrink-0">
                <Package className="size-4 text-[#cbd5e1]" />
              </div>
            )}
            <div className="min-w-0">
              {product.brand && (
                <p className="text-[10px] font-bold text-[#0058be] uppercase tracking-[0.8px] leading-none mb-0.5">
                  {product.brand.name}
                </p>
              )}
              <p className="text-[14px] font-semibold text-[#0f172a] leading-snug line-clamp-1">
                {product.name}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[14px] text-[#94a3b8]">{description}</p>
        )}
      </div>

      {/* Right side: price + actions */}
      <div className="flex items-center gap-3 shrink-0">
        {product ? (
          <>
            <div className="text-right">
              <p className="text-[15px] font-bold text-[#0058be]">
                {product.price.toLocaleString('vi-VN')}
                <span className="text-[11px] font-normal ml-0.5 opacity-70">₫</span>
              </p>
            </div>
            <Link
              href={`/explore/${product.id}`}
              target="_blank"
              className="p-2 rounded-[10px] bg-white border border-[#e8ecf2] text-[#64748b] hover:border-[#0058be] hover:text-[#0058be] transition-all cursor-pointer"
              aria-label="Xem chi tiết"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="size-4" />
            </Link>
            <button
              type="button"
              onClick={onPick}
              className="p-2 rounded-[10px] bg-white border border-[#e8ecf2] text-[#64748b] hover:border-[#0058be] hover:text-[#0058be] transition-all cursor-pointer"
              aria-label="Đổi linh kiện"
            >
              <Package className="size-4" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-2 rounded-[10px] bg-white border border-[#e8ecf2] text-[#64748b] hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
              aria-label="Xóa"
            >
              <Trash2 className="size-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onPick}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#f8fafc] border border-[#e8ecf2] text-[#475569] text-[13px] font-semibold hover:border-[#0058be] hover:bg-[#eff6ff] hover:text-[#0058be] transition-all cursor-pointer"
          >
            <Plus className="size-4" />
            Chọn
          </button>
        )}
      </div>
    </div>
  );
}
