'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { BuildState } from './BuildPage';

interface ConfirmSelectionModalProps {
  showConfirmModal: boolean;
  pendingSelection: any;
  cancelPendingSelection: () => void;
  confirmPendingSelection: () => void;
  build: BuildState;
}

export default function ConfirmSelectionModal({
  showConfirmModal,
  pendingSelection,
  cancelPendingSelection,
  confirmPendingSelection,
  build
}: ConfirmSelectionModalProps) {
  if (!showConfirmModal || !pendingSelection) return null;

  const slotLabelsMap: Record<string, string> = {
    cpu: 'Vi xử lý (CPU)',
    mainboard: 'Bo mạch chủ (Mainboard)',
    ram: 'Bộ nhớ RAM',
    storage: 'Ổ cứng SSD/HDD',
    case: 'Vỏ máy (Case)',
    cooler: 'Tản nhiệt CPU'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] p-6 shadow-2xl w-full max-w-[420px] flex flex-col gap-5 border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-full shrink-0">
            <AlertTriangle className="size-6 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[17px] font-bold text-[#0f172a] mb-1">Xác nhận đổi linh kiện?</h3>
            <p className="text-[13px] text-[#64748b] leading-relaxed">
              Linh kiện <span className="font-semibold text-[#0f172a]">{pendingSelection.product.name}</span> bạn chọn không tương thích với cấu hình hiện tại.
            </p>
          </div>
        </div>

        <div className="bg-rose-50/40 border border-rose-100/50 rounded-[16px] p-4 flex flex-col gap-3">
          <p className="text-[12px] font-bold text-rose-700 uppercase tracking-wide">
            Các linh kiện sẽ tự động gỡ bỏ:
          </p>
          <div className="flex flex-col gap-2">
            {pendingSelection.incompatibleSlots.map((slot: string) => {
              const currentCompName = build[slot]?.name || 'Chưa chọn';
              return (
                <div key={slot} className="flex items-start gap-2.5 text-[13px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-slate-700">{slotLabelsMap[slot] || slot}:</span>{' '}
                    <span className="text-slate-500 line-clamp-1">{currentCompName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#f1f5f9]">
          <button
            type="button"
            onClick={cancelPendingSelection}
            className="px-4 py-2.5 rounded-[12px] border border-[#e2e8f0] text-[13px] font-semibold text-[#475569] hover:bg-[#f8fafc] transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={confirmPendingSelection}
            className="px-5 py-2.5 rounded-[12px] bg-red-500 text-white text-[13px] font-bold hover:bg-red-600 transition-colors shadow-sm hover:shadow-md cursor-pointer"
          >
            Đồng ý và Gỡ bỏ
          </button>
        </div>
      </div>
    </div>
  );
}
