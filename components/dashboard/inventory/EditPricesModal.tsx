"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, X } from "lucide-react";
import { InventoryBatchResponse } from "@/lib/api";

const formatVND = (value: number | string) => {
  if (value === undefined || value === null || value === "") return "";
  const clean = String(value).replace(/\D/g, "");
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

interface EditPricesModalProps {
  batch: InventoryBatchResponse;
  onClose: () => void;
  onSave: (
    batchId: number,
    importPrice: number,
    sellingPrice: number,
  ) => Promise<void>;
  saving: boolean;
}

export default function EditPricesModal({
  batch,
  onClose,
  onSave,
  saving,
}: EditPricesModalProps) {
  const [newSellingPrice, setNewSellingPrice] = useState<number>(
    batch.sellingPrice,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setNewSellingPrice(batch.sellingPrice);
      setErrors({});
    }, 0);
    return () => clearTimeout(timer);
  }, [batch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSellingPrice) {
      setErrors({ sellingPrice: "Vui lòng nhập giá bán." });
      return;
    }

    if (newSellingPrice <= batch.importPrice) {
      setErrors({
        sellingPrice: `Giá bán mới phải cao hơn giá nhập (${batch.importPrice.toLocaleString("vi-VN")}₫).`,
      });
      return;
    }

    onSave(batch.id, batch.importPrice, newSellingPrice);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-[12px] shadow-xl w-full max-w-[500px] flex flex-col overflow-hidden border border-[#e2e8f0]"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {/* Modal Header */}
        <div className="border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between bg-[#f8fafc]">
          <div>
            <h2 className="text-[#0f172a] text-[18px] font-semibold tracking-[-0.3px]">
              Chỉnh sửa giá bán: Lô #{String(batch.id).padStart(4, "0")}
            </h2>
            <p className="text-[12px] text-[#64748b] mt-0.5">
              Hiệu chỉnh sai sót giá bán sản phẩm
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#94a3b8] hover:text-[#475569] p-1.5 hover:bg-[#f1f5f9] rounded-[8px] transition-colors cursor-pointer"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Product brief info */}
          <div className="flex items-center gap-3 p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px]">
            <div className="size-12 rounded-[6px] bg-white border border-[#e2e8f0] overflow-hidden shrink-0 flex items-center justify-center">
              {batch.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={batch.thumbnailUrl}
                  alt={batch.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-[10px] text-[#94a3b8] font-bold">
                  No Image
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-[#0f172a] line-clamp-1">
                {batch.productName}
              </p>
              <p className="text-[11px] text-[#64748b] mt-0.5">
                Mã SP: #{batch.productId}
              </p>
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            {/* Import Price (Disabled/Read-only) */}
            <div>
              <label className="text-[12px] font-semibold text-[#64748b] block mb-1.5">
                Giá nhập (VND) - Lô này (Không thể thay đổi)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-medium text-[#94a3b8]">
                  ₫
                </span>
                <input
                  type="text"
                  value={formatVND(batch.importPrice)}
                  disabled
                  readOnly
                  className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-[8px] pl-8 pr-4 py-2 text-[14px] text-[#64748b] font-semibold cursor-not-allowed select-none focus:outline-none"
                />
              </div>
            </div>

            {/* Selling Price Input */}
            <div>
              <label className="text-[12px] font-semibold text-[#475569] block mb-1.5">
                Giá bán mới (VND) - Sản phẩm
              </label>
              {errors.sellingPrice && (
                <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1 mb-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  ⚠️ {errors.sellingPrice}
                </span>
              )}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-medium text-[#94a3b8]">
                  ₫
                </span>
                <input
                  type="text"
                  value={formatVND(newSellingPrice)}
                  onChange={(e) => {
                    const rawVal = e.target.value.replace(/\./g, "");
                    if (/^\d*$/.test(rawVal)) {
                      setNewSellingPrice(Number(rawVal) || 0);
                      setErrors((prev) => ({ ...prev, sellingPrice: "" }));
                    }
                  }}
                  className={`w-full bg-[#f8fafc] border rounded-[8px] pl-8 pr-4 py-2 text-[14px] text-[#0f172a] font-semibold focus:outline-none transition-all ${
                    errors.sellingPrice
                      ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-[#e2e8f0] focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be]"
                  }`}
                  placeholder="Nhập giá bán..."
                />
              </div>
              <p className="text-[10px] text-amber-600 font-medium mt-1">
                * Lưu ý: Thay đổi này sẽ cập nhật trực tiếp giá bán sản phẩm
                trên toàn hệ thống cửa hàng.
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-[#e2e8f0] pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#e2e8f0] hover:border-[#cbd5e1] rounded-[8px] text-[13px] font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#0058be] hover:bg-[#0047a3] text-white text-[13px] font-semibold rounded-[8px] shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
