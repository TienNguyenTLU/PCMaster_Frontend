"use client";

import React from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface SmartBuildDropdownProps {
  smartBuildNeed: string;
  setSmartBuildNeed: (val: string) => void;
  smartBuildBudget: string;
  setSmartBuildBudget: (val: string) => void;
  isGeneratingSmartBuild: boolean;
  smartBuildStatus: string | null;
  handleSmartBuildSubmit: () => void;
  showSmartBuildDropdown: boolean;
  setShowSmartBuildDropdown: (val: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export default function SmartBuildDropdown({
  smartBuildNeed,
  setSmartBuildNeed,
  smartBuildBudget,
  setSmartBuildBudget,
  isGeneratingSmartBuild,
  smartBuildStatus,
  handleSmartBuildSubmit,
  showSmartBuildDropdown,
  setShowSmartBuildDropdown,
  dropdownRef,
}: SmartBuildDropdownProps) {
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowSmartBuildDropdown(!showSmartBuildDropdown)}
        className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-[13px] font-bold px-4 py-2 rounded-[10px] shadow-md transition-all cursor-pointer"
      >
        <Sparkles className="size-3.5" />
        <span>Cấu hình thông minh (AI)</span>
      </button>

      {showSmartBuildDropdown && (
        <div className="absolute right-0 mt-2 w-[440px] bg-white border border-[#cbd5e1] rounded-[24px] shadow-2xl p-6 z-40 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 bg-violet-50 text-violet-600 rounded-[10px] shrink-0">
              <Sparkles className="size-4.5 text-violet-600 animate-pulse" />
            </div>
            <div>
              <h3 className="text-[14px] font-black text-[#0f172a] tracking-tight text-left">
                Cấu hình thông minh AI
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5 text-left">
                Lựa chọn nhu cầu & khoảng giá dự kiến để xây dựng
              </p>
            </div>
          </div>

          {}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[11px] font-bold text-slate-700">
              1. Lựa chọn nhu cầu sử dụng:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "gaming", label: "🎮 Chơi game" },
                { id: "graphics", label: "🎨 Thiết kế & 3D" },
                { id: "study", label: "✏️ Học tập" },
                { id: "office", label: "💼 Văn phòng" },
              ].map((need) => (
                <button
                  key={need.id}
                  type="button"
                  onClick={() => setSmartBuildNeed(need.id)}
                  className={`px-3 py-2 rounded-[10px] text-[12px] font-bold border text-center transition-all cursor-pointer ${
                    smartBuildNeed === need.id
                      ? "border-violet-600 bg-violet-50/40 text-violet-700 shadow-sm"
                      : "border-slate-200 bg-[#f8fafc] text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {need.label}
                </button>
              ))}
            </div>
          </div>

          {}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[11px] font-bold text-slate-700">
              2. Lựa chọn khoảng giá dự kiến:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "under-10", label: "Dưới 10 triệu" },
                { id: "10-15", label: "10 - 15 triệu" },
                { id: "15-20", label: "15 - 20 triệu" },
                { id: "20-30", label: "20 - 30 triệu" },
                { id: "30-50", label: "30 - 50 triệu" },
                { id: "over-50", label: "Trên 50 triệu" },
              ].map((budget) => (
                <button
                  key={budget.id}
                  type="button"
                  onClick={() => setSmartBuildBudget(budget.id)}
                  className={`px-3 py-2 rounded-[10px] text-[12px] font-bold border text-center transition-all cursor-pointer ${
                    smartBuildBudget === budget.id
                      ? "border-violet-600 bg-violet-50/40 text-violet-700 shadow-sm"
                      : "border-slate-200 bg-[#f8fafc] text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {budget.label}
                </button>
              ))}
            </div>
          </div>

          {}
          {isGeneratingSmartBuild && smartBuildStatus && (
            <div className="bg-slate-50/60 border border-slate-100 rounded-[12px] p-3 text-[11px] font-bold text-slate-600 flex items-center gap-2 animate-pulse text-left">
              <Loader2 className="size-3.5 animate-spin text-violet-600 shrink-0" />
              <span>{smartBuildStatus}</span>
            </div>
          )}

          {}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-1">
            <button
              type="button"
              disabled={isGeneratingSmartBuild}
              onClick={() => setShowSmartBuildDropdown(false)}
              className="px-3.5 py-2 rounded-[10px] border border-[#e2e8f0] text-[12px] font-semibold text-[#475569] hover:bg-[#f8fafc] transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={isGeneratingSmartBuild}
              onClick={handleSmartBuildSubmit}
              className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-[10px] bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[12.5px] font-bold hover:from-violet-700 hover:to-indigo-700 transition-colors shadow-md shadow-violet-100 cursor-pointer disabled:opacity-50"
            >
              {isGeneratingSmartBuild ? (
                <>
                  <Loader2 className="size-3.5 animate-spin shrink-0" />
                  Đang xây dựng...
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5 shrink-0" />
                  Bắt đầu xây dựng
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
