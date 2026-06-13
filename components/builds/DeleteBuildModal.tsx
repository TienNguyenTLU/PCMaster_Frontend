"use client";

import React from "react";
import { Trash2 } from "lucide-react";

interface DeleteBuildModalProps {
  showDeleteConfirmModal: boolean;
  pendingDeleteBuildId: number | null;
  cancelDeleteBuild: () => void;
  confirmDeleteBuild: () => void;
}

export default function DeleteBuildModal({
  showDeleteConfirmModal,
  pendingDeleteBuildId,
  cancelDeleteBuild,
  confirmDeleteBuild,
}: DeleteBuildModalProps) {
  if (!showDeleteConfirmModal || pendingDeleteBuildId === null) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] p-6 shadow-2xl w-full max-w-[380px] flex flex-col gap-4 border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-full shrink-0">
            <Trash2 className="size-5 text-red-500" />
          </div>
          <h3 className="text-[17px] font-bold text-[#0f172a]">
            Xóa cấu hình PC?
          </h3>
        </div>
        <p className="text-[13px] text-[#64748b] leading-relaxed">
          Bạn có chắc chắn muốn xóa cấu hình này khỏi tài khoản của mình? Hành
          động này không thể hoàn tác.
        </p>
        <div className="flex justify-end gap-3 pt-3 border-t border-[#f1f5f9]">
          <button
            type="button"
            onClick={cancelDeleteBuild}
            className="px-4 py-2 rounded-[10px] border border-[#e2e8f0] text-[13px] font-semibold text-[#475569] hover:bg-[#f8fafc] transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={confirmDeleteBuild}
            className="px-5 py-2 rounded-[10px] bg-red-500 text-white text-[13px] font-bold hover:bg-red-600 transition-colors cursor-pointer"
          >
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>
  );
}
