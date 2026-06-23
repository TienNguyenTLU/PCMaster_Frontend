"use client";

import {
  Cpu,
  Layers,
  HardDrive,
  Tv,
  Zap,
  Box,
  Wind,
  Monitor,
  Folder,
  Fan,
  ShoppingCart,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Product } from "@/lib/api";
import { SlotDef, BuildState, SLOTS } from "@/hooks/usePcBuildState";
import { formatPrice } from "@/utils/format";

interface SummaryPanelProps {
  build: BuildState;
  totalPrice: number;
  onAddAllToCart: () => void;
  adding: boolean;
  extraStorageSlots?: SlotDef[];
  aiPsuWattage: number | null;
  aiPsuExplanation: string | null;
  loadingPsu: boolean;
}

export default function SummaryPanel({
  build,
  totalPrice,
  onAddAllToCart,
  adding,
  extraStorageSlots = [],
  aiPsuWattage,
  aiPsuExplanation,
  loadingPsu,
}: SummaryPanelProps) {
  const allSlots = [...SLOTS, ...extraStorageSlots];
  const selectedCount = allSlots.filter((s) => !!build[s.key]).length;
  const requiredSlots = SLOTS.filter((s) => s.required);
  const missingRequired = requiredSlots.filter((s) => !build[s.key]);

  const getProductSpecs = (p?: Product | null) => {
    if (!p || !p.specsJson) return {};
    try {
      return JSON.parse(p.specsJson);
    } catch {
      return {};
    }
  };

  const cpuSpecs = getProductSpecs(build.cpu);
  const vgaSpecs = getProductSpecs(build.vga);
  const totalTdp =
    (Number(cpuSpecs.tdp_w) || 0) + (Number(vgaSpecs.tdp_w) || 0);

  const psuSpecs = getProductSpecs(build.psu);
  const currentPsuWattage =
    Number(psuSpecs.wattage) || Number(psuSpecs.watt) || 0;
  const recommendedWattageVal =
    aiPsuWattage || (totalTdp > 0 ? Math.ceil((totalTdp + 150) / 50) * 50 : 0);
  const showPsuRecommendation =
    loadingPsu ||
    (recommendedWattageVal > 0 &&
      (!build.psu || currentPsuWattage < recommendedWattageVal));

  return (
    <div className="sticky top-24 flex flex-col gap-4">
      {}
      <div className="bg-white rounded-[24px] border border-[#e8ecf2] p-6 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div>
          <p className="text-[11px] font-bold text-[#0058be] uppercase tracking-[1.5px] mb-1.5">
            Tổng cấu hình
          </p>
          <p
            className="text-[34px] font-black text-[#0f172a] tracking-tight leading-none"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {formatPrice(totalPrice)}
          </p>
          <p className="text-[12.5px] text-[#64748b] mt-2 font-medium">
            {selectedCount}/{allSlots.length} linh kiện đã chọn
          </p>
          {showPsuRecommendation && (
            <div className="mt-2.5 flex flex-col gap-1.5 self-start bg-amber-50/60 border border-amber-100/50 px-3 py-2 rounded-[12px] w-full text-amber-700 font-bold text-[11px] uppercase tracking-[0.5px]">
              {loadingPsu ? (
                <div className="flex items-center gap-1.5 animate-pulse">
                  <Loader2 className="size-3.5 animate-spin shrink-0 text-[#0058be]" />
                  Đang phân tích nguồn bằng AI...
                </div>
              ) : aiPsuWattage ? (
                <div className="flex flex-col gap-1 text-left normal-case">
                  <div className="flex items-center gap-1.5 font-extrabold text-[#0058be] text-[11px] uppercase tracking-[0.5px]">
                    <span className="size-3.5 text-center leading-none shrink-0">
                      🤖
                    </span>
                    Nguồn khuyên dùng (AI): {aiPsuWattage}W
                  </div>
                  <p className="text-[10px] text-[#475569] font-semibold leading-normal mt-0.5">
                    {aiPsuExplanation}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="size-3.5 text-center leading-none shrink-0">
                    🛡️
                  </span>
                  PSU khuyến nghị: {Math.ceil((totalTdp + 150) / 50) * 50}W
                </div>
              )}
            </div>
          )}
        </div>

        {}
        <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden border border-[#cbd5e1]/10">
          <div
            className="h-full bg-gradient-to-r from-[#0058be] to-[#2563eb] rounded-full transition-all duration-500"
            style={{ width: `${(selectedCount / allSlots.length) * 100}%` }}
          />
        </div>

        {}
        {missingRequired.length > 0 && (
          <div className="bg-rose-50/50 border border-rose-100 rounded-[16px] p-4">
            <p className="text-[12px] font-bold text-rose-700 flex items-center gap-1.5 mb-2">
              <AlertTriangle className="size-3.5 shrink-0" /> Linh kiện bắt buộc
              còn thiếu:
            </p>
            <ul className="flex flex-col gap-1 pl-1">
              {missingRequired.map((s) => (
                <li
                  key={s.key}
                  className="text-[11px] text-rose-600 font-semibold flex items-center gap-1.5"
                >
                  <span className="size-1 rounded-full bg-rose-400 shrink-0" />
                  {s.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {}
        <button
          type="button"
          disabled={selectedCount === 0 || adding}
          onClick={onAddAllToCart}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[14px] bg-gradient-to-r from-[#0058be] to-[#2563eb] text-white text-[14px] font-bold shadow-[0_8px_24px_rgba(0,88,190,0.25)] hover:shadow-[0_8px_32px_rgba(0,88,190,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {adding ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Đang thêm...
            </>
          ) : (
            <>
              <ShoppingCart className="size-4" /> Thêm tất cả vào giỏ
            </>
          )}
        </button>
      </div>

      {}
      {selectedCount > 0 && (
        <div className="bg-white rounded-[24px] border border-[#e8ecf2] p-5 flex flex-col gap-3.5 shadow-sm hover:shadow-md transition-shadow duration-300">
          <p className="text-[12px] font-extrabold text-[#475569] uppercase tracking-[1px] border-b border-[#f1f5f9] pb-2">
            Danh sách chi tiết
          </p>
          <div
            className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1"
            style={{ scrollbarWidth: "thin" }}
          >
            {allSlots.map((slot) => {
              const product = build[slot.key];
              if (!product) return null;
              return (
                <div
                  key={slot.key}
                  className="flex items-center justify-between gap-2.5 group/sum"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <slot.Icon className="size-3.5 text-[#0058be] shrink-0" />
                    <p className="text-[12px] text-[#334155] font-semibold truncate group-hover/sum:text-[#0058be] transition-colors">
                      {product.name}
                    </p>
                  </div>
                  <p className="text-[12px] font-bold text-[#0f172a] shrink-0">
                    {formatPrice(product.price)}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="pt-3 border-t border-[#f1f5f9] flex justify-between items-center">
            <p className="text-[12px] font-extrabold text-[#475569]">
              Tổng giá trị
            </p>
            <p className="text-[15px] font-black text-[#0058be]">
              {formatPrice(totalPrice)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
