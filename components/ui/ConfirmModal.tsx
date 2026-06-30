"use client";

import { X, AlertCircle } from "lucide-react";

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-[16px] shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
            <AlertCircle className="size-6" />
          </div>
          <div>
            <h3 className="font-bold text-[18px] text-[#0f172a]">{title}</h3>
            <p className="text-[14px] text-[#64748b] mt-1">{message}</p>
          </div>
        </div>

        <div className="border-t border-[#e2e8f0] p-4 bg-[#f8fafc] flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-[#cbd5e1] hover:bg-white rounded-[8px] text-[14px] font-semibold text-[#475569] transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-[8px] text-[14px] font-semibold transition-colors"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
