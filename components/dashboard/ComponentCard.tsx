"use client";

import React from "react";
import { X } from "lucide-react";
import { Product } from "@/lib/api";

interface ComponentCardProps {
  label: string;
  icon: React.ComponentType<any>;
  selectedId: number;
  selectedProd?: Product;
  options: Product[];
  qty: number;
  compatTag?: string;
  onComponentChange: (productId: number) => void;
  onQuantityChange: (qty: number) => void;
}

export default function ComponentCard({
  label,
  icon: Icon,
  selectedId,
  selectedProd,
  options,
  qty,
  compatTag,
  onComponentChange,
  onQuantityChange,
}: ComponentCardProps) {
  return (
    <div
      className={`flex flex-col gap-2 p-3 rounded-[12px] border transition-all ${
        selectedId > 0
          ? "bg-blue-50/20 border-blue-200"
          : "bg-[#f8fafc] border-[#e2e8f0]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon
            className={`size-4 ${selectedId > 0 ? "text-[#0058be]" : "text-slate-400"}`}
          />
          <span
            className="text-[12px] font-bold text-[#475569] truncate max-w-[170px]"
            title={label}
          >
            {label}
          </span>
        </div>
        {compatTag && (
          <span className="text-[9px] bg-amber-50 text-amber-700 font-bold border border-amber-100 px-1.5 py-0.5 rounded-[4px] shrink-0">
            {compatTag}
          </span>
        )}
      </div>

      {/* Select Product */}
      <div className="flex items-center gap-1.5 w-full min-w-0">
        <select
          value={selectedId}
          onChange={(e) => onComponentChange(Number(e.target.value))}
          className="flex-1 w-full max-w-full min-w-0 bg-white border border-[#e2e8f0] rounded-[8px] px-2 py-1.5 text-[12px] focus:outline-none focus:border-[#0058be] transition-all"
        >
          <option value={0}>
            -- Chọn{" "}
            {label
              .replace(/(\(|\))/g, "")
              .replace("Bộ vi xử lý", "")
              .replace("Bo mạch chủ", "")
              .replace("Card màn hình", "")
              .trim()}{" "}
            --
          </option>
          {options.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (Tồn: {p.stock} | Giá:{" "}
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(p.price)}
              )
            </option>
          ))}
        </select>

        {selectedId > 0 && (
          <button
            type="button"
            onClick={() => onComponentChange(0)}
            className="p-1 hover:text-red-600 hover:bg-red-50 rounded-[4px] text-[#94a3b8] transition-colors shrink-0 cursor-pointer"
            title="Hủy chọn"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Details and Quantities if selected */}
      {selectedProd && (
        <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-100 pt-1.5 animate-fade-in">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#64748b] truncate max-w-[120px]">
              Kho:{" "}
              <strong
                className={
                  selectedProd.stock === 0 ? "text-red-500" : "text-[#374151]"
                }
              >
                {selectedProd.stock} cái
              </strong>
            </span>
            <span className="font-semibold text-[#0f172a]">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(selectedProd.price)}
            </span>
          </div>

          {/* Quantity controls */}
          <div className="flex items-center justify-between mt-1 bg-white p-1 rounded-[6px] border border-[#e2e8f0]">
            <span className="text-[10px] text-[#64748b] pl-1">
              Số lượng / PC:
            </span>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => onQuantityChange(qty - 1)}
                className="px-2 py-0.5 hover:bg-slate-50 text-[11px] font-bold text-slate-500 cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => onQuantityChange(Number(e.target.value))}
                className="w-10 text-center text-[11px] focus:outline-none font-bold text-[#0f172a]"
              />
              <button
                type="button"
                onClick={() => onQuantityChange(qty + 1)}
                className="px-2 py-0.5 hover:bg-slate-50 text-[11px] font-bold text-slate-500 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
