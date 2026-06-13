"use client";

import React from "react";
import { Loader2, X } from "lucide-react";

interface SaveBuildModalProps {
  showSaveModal: boolean;
  setShowSaveModal: (val: boolean) => void;
  buildName: string;
  setBuildName: (val: string) => void;
  savingBuild: boolean;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleSaveConfirm: (e: React.FormEvent) => void;
}

export default function SaveBuildModal({
  showSaveModal,
  setShowSaveModal,
  buildName,
  setBuildName,
  savingBuild,
  errors,
  setErrors,
  handleSaveConfirm,
}: SaveBuildModalProps) {
  if (!showSaveModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <form
        onSubmit={handleSaveConfirm}
        className="bg-white rounded-[20px] shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="text-[#0f172a] font-bold text-[16px]">
            Lưu cấu hình PC
          </h4>
          <button
            type="button"
            onClick={() => setShowSaveModal(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-[#475569]">
            Tên cấu hình của bạn:
          </label>
          {errors.buildName && (
            <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
              ⚠️ {errors.buildName}
            </span>
          )}
          <input
            type="text"
            required
            value={buildName}
            onChange={(e) => {
              setBuildName(e.target.value);
              setErrors((prev) => ({ ...prev, buildName: "" }));
            }}
            placeholder="VD: PC Chuyên Chiến Game"
            className={`bg-[#f8fafc] border rounded-[8px] px-3 py-2 text-[14px] focus:outline-none transition-all ${
              errors.buildName
                ? "border-red-500 focus:border-red-500"
                : "border-[#e2e8f0] focus:border-[#0058be]"
            }`}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowSaveModal(false)}
            className="px-4 py-2 text-[13px] font-medium text-slate-600 border border-[#e2e8f0] rounded-[8px] hover:bg-slate-50 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={savingBuild}
            className="px-4 py-2 text-[13px] font-bold text-white bg-[#0058be] hover:bg-[#0047a3] rounded-[8px] disabled:opacity-75 flex items-center gap-1.5 cursor-pointer"
          >
            {savingBuild && <Loader2 className="size-3.5 animate-spin" />}
            Xác nhận lưu
          </button>
        </div>
      </form>
    </div>
  );
}
