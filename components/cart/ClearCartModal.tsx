"use client";

import { Trash2, Loader2 } from "lucide-react";

interface ClearCartModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export default function ClearCartModal({
  onConfirm,
  onCancel,
  loading,
}: ClearCartModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[20px] p-6 shadow-2xl w-full max-w-[380px] flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 rounded-full">
            <Trash2 className="size-5 text-red-500" />
          </div>
          <h3 className="text-[17px] font-bold text-[#0f172a]">
            Xóa toàn bộ giỏ hàng?
          </h3>
        </div>
        <p className="text-[13px] text-[#64748b] leading-relaxed">
          Tất cả sản phẩm trong giỏ hàng sẽ bị xóa. Hành động này không thể hoàn
          tác.
        </p>
        <div className="flex justify-end gap-3 pt-2 border-t border-[#f1f5f9]">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-[10px] border border-[#e2e8f0] text-[13px] font-semibold text-[#475569] hover:bg-[#f8fafc] transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 rounded-[10px] bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            Xóa tất cả
          </button>
        </div>
      </div>
    </div>
  );
}
