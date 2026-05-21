'use client';

import { useState } from 'react';
import {
  Cpu, Layers, HardDrive, Tv, Zap, Box, Wind, Monitor, Folder, Fan,
  ShoppingCart, Loader2, CheckCircle2, AlertTriangle, RotateCcw
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { Product } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import BuildSlot from './BuildSlot';
import BuildPickerModal from './BuildPickerModal';
import toast from 'react-hot-toast';

// ─── Slot definitions ────────────────────────────────────────────────────────

interface SlotDef {
  key: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  required: boolean;
}

const SLOTS: SlotDef[] = [
  { key: 'cpu',      label: 'Vi xử lý (CPU)',        description: 'Bộ não của hệ thống', Icon: Cpu,    required: true  },
  { key: 'mainboard',label: 'Bo mạch chủ',            description: 'Nền tảng kết nối',   Icon: Folder,  required: true  },
  { key: 'ram',      label: 'Bộ nhớ RAM',             description: 'Bộ nhớ tạm thời',    Icon: Layers,  required: true  },
  { key: 'storage',  label: 'Ổ cứng (SSD/HDD)',       description: 'Lưu trữ dữ liệu',    Icon: HardDrive,required: true },
  { key: 'vga',      label: 'Card đồ họa (GPU)',      description: 'Sức mạnh đồ họa',    Icon: Tv,      required: false },
  { key: 'psu',      label: 'Nguồn (PSU)',             description: 'Nguồn cấp điện',     Icon: Zap,     required: true  },
  { key: 'case',     label: 'Vỏ máy (Case)',           description: 'Khung chứa linh kiện',Icon: Box,   required: true  },
  { key: 'cooler',   label: 'Tản nhiệt CPU',           description: 'Giải nhiệt vi xử lý',Icon: Wind,   required: false },
  { key: 'monitor',  label: 'Màn hình',                description: 'Thiết bị hiển thị',  Icon: Monitor, required: false },
  { key: 'fan',      label: 'Quạt case',               description: 'Thông gió trong thùng',Icon: Fan,  required: false },
];

type BuildState = Record<string, Product | null>;

// ─── Summary panel ───────────────────────────────────────────────────────────

function SummaryPanel({ build, totalPrice, onAddAllToCart, adding }: {
  build: BuildState;
  totalPrice: number;
  onAddAllToCart: () => void;
  adding: boolean;
}) {
  const selectedCount = Object.values(build).filter(Boolean).length;
  const requiredSlots = SLOTS.filter(s => s.required);
  const missingRequired = requiredSlots.filter(s => !build[s.key]);
  const hasOutOfStock = Object.values(build).some(p => p && p.stock === 0);

  return (
    <div className="sticky top-24 flex flex-col gap-4">
      {/* Price card */}
      <div className="bg-white rounded-[24px] border border-[#e8ecf2] p-6 flex flex-col gap-5 shadow-sm">
        <div>
          <p className="text-[11px] font-bold text-[#0058be] uppercase tracking-[1.2px] mb-1">Tổng cấu hình</p>
          <p className="text-[32px] font-black text-[#0f172a] tracking-[-1px] leading-none" style={{ fontFamily: 'Inter, sans-serif' }}>
            {totalPrice.toLocaleString('vi-VN')}
            <span className="text-[18px] font-bold text-[#0058be] ml-1.5">₫</span>
          </p>
          <p className="text-[12px] text-[#94a3b8] mt-1.5 font-medium">{selectedCount}/{SLOTS.length} linh kiện đã chọn</p>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#0058be] to-[#2170e4] rounded-full transition-all duration-500"
            style={{ width: `${(selectedCount / SLOTS.length) * 100}%` }}
          />
        </div>

        {/* Warnings */}
        {missingRequired.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-[12px] p-3.5">
            <p className="text-[12px] font-bold text-amber-700 flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="size-3.5" /> Còn thiếu linh kiện bắt buộc
            </p>
            <ul className="flex flex-col gap-0.5">
              {missingRequired.map(s => (
                <li key={s.key} className="text-[11px] text-amber-600 font-medium">• {s.label}</li>
              ))}
            </ul>
          </div>
        )}

        {hasOutOfStock && (
          <div className="bg-red-50 border border-red-200 rounded-[12px] p-3.5">
            <p className="text-[12px] font-bold text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="size-3.5" /> Có linh kiện đang hết hàng
            </p>
          </div>
        )}

        {/* CTA */}
        <button
          type="button"
          disabled={selectedCount === 0 || adding}
          onClick={onAddAllToCart}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-[14px] bg-gradient-to-r from-[#0058be] to-[#2170e4] text-white text-[15px] font-bold shadow-[0_8px_20px_rgba(0,88,190,0.25)] hover:shadow-[0_8px_28px_rgba(0,88,190,0.35)] hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {adding ? (
            <><Loader2 className="size-4 animate-spin" /> Đang thêm...</>
          ) : (
            <><ShoppingCart className="size-4" /> Thêm tất cả vào giỏ</>
          )}
        </button>
      </div>

      {/* Component list summary */}
      {selectedCount > 0 && (
        <div className="bg-white rounded-[24px] border border-[#e8ecf2] p-5 flex flex-col gap-3 shadow-sm">
          <p className="text-[12px] font-bold text-[#475569] uppercase tracking-[0.8px]">Danh sách linh kiện</p>
          {SLOTS.map(slot => {
            const product = build[slot.key];
            if (!product) return null;
            return (
              <div key={slot.key} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <slot.Icon className="size-3.5 text-[#0058be] shrink-0" />
                  <p className="text-[12px] text-[#0f172a] font-medium truncate">{product.name}</p>
                </div>
                <p className="text-[12px] font-bold text-[#0058be] shrink-0">
                  {product.price.toLocaleString('vi-VN')} ₫
                </p>
              </div>
            );
          })}
          <div className="pt-2 border-t border-[#f1f5f9] flex justify-between">
            <p className="text-[12px] font-bold text-[#475569]">Tổng cộng</p>
            <p className="text-[13px] font-black text-[#0058be]">{totalPrice.toLocaleString('vi-VN')} ₫</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function BuildPage() {
  const [build, setBuild] = useState<BuildState>(
    Object.fromEntries(SLOTS.map(s => [s.key, null]))
  );
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addItem } = useCartStore();

  const totalPrice = Object.values(build).reduce((sum, p) => sum + (p?.price ?? 0), 0);

  const handleSelect = (slotKey: string, product: Product) => {
    setBuild(prev => ({ ...prev, [slotKey]: product }));
  };

  const handleRemove = (slotKey: string) => {
    setBuild(prev => ({ ...prev, [slotKey]: null }));
  };

  const handleReset = () => {
    setBuild(Object.fromEntries(SLOTS.map(s => [s.key, null])));
    toast.success('Đã đặt lại cấu hình!');
  };

  const handleAddAllToCart = async () => {
    const selected = Object.values(build).filter((p): p is Product => !!p && p.stock > 0);
    if (selected.length === 0) {
      toast.error('Chưa có linh kiện nào được chọn!');
      return;
    }
    setAddingToCart(true);
    let failed = 0;
    for (const product of selected) {
      try {
        await addItem(Number(product.id), 1);
      } catch {
        failed++;
      }
    }
    setAddingToCart(false);
    if (failed === 0) {
      toast.success(`Đã thêm ${selected.length} linh kiện vào giỏ hàng!`);
    } else {
      toast.error(`${failed} sản phẩm không thể thêm. Vui lòng đăng nhập trước.`);
    }
  };

  const selectedCount = Object.values(build).filter(Boolean).length;

  return (
    <div className="flex flex-col min-h-screen w-full" style={{ background: 'linear-gradient(180deg, #f7f9fb 0%, #f0f4f8 100%)' }}>
      {/* Page Header */}
      <div className="w-full bg-white border-b border-[#e8ecf2] sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#0058be] uppercase tracking-[1.2px]">PCMaster Builder</p>
            <h1 className="text-[22px] font-black text-[#0f172a] tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
              Xây dựng cấu hình PC
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {selectedCount > 0 && (
              <>
                <span className="px-3 py-1.5 rounded-full bg-[#eff6ff] text-[#0058be] text-[12px] font-bold border border-blue-100">
                  {selectedCount}/{SLOTS.length} linh kiện
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-white border border-[#e8ecf2] text-[#64748b] text-[13px] font-semibold hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
                >
                  <RotateCcw className="size-3.5" />
                  Đặt lại
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-[1400px] mx-auto w-full px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
          {/* Left: Slot list */}
          <div className="flex flex-col gap-3">
            {/* Intro banner */}
            <div className="bg-gradient-to-r from-[#0058be] to-[#2170e4] rounded-[20px] p-6 flex items-center justify-between mb-2 shadow-lg shadow-blue-200">
              <div>
                <h2 className="text-white text-[20px] font-black tracking-tight mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Thiết kế cấu hình PC của riêng bạn
                </h2>
                <p className="text-blue-100 text-[14px] font-medium leading-snug max-w-[480px]">
                  Chọn từng linh kiện, xem tổng chi phí ngay lập tức và thêm toàn bộ cấu hình vào giỏ hàng chỉ với một cú nhấp.
                </p>
              </div>
              <div className="shrink-0 hidden md:flex items-center justify-center size-16 rounded-[18px] bg-white/10 border border-white/20">
                <CheckCircle2 className="size-8 text-white" />
              </div>
            </div>

            {/* Group: Core */}
            <p className="text-[11px] font-black text-[#94a3b8] uppercase tracking-[1.5px] px-1 mt-2">🔧 Linh kiện cốt lõi</p>
            <div className="flex flex-col gap-3">
              {SLOTS.filter(s => s.required).map(slot => (
                <BuildSlot
                  key={slot.key}
                  slotKey={slot.key}
                  label={slot.label}
                  description={slot.description}
                  Icon={slot.Icon}
                  product={build[slot.key]}
                  onPick={() => setActiveSlot(slot.key)}
                  onRemove={() => handleRemove(slot.key)}
                />
              ))}
            </div>

            {/* Group: Optional */}
            <p className="text-[11px] font-black text-[#94a3b8] uppercase tracking-[1.5px] px-1 mt-4">✨ Linh kiện tùy chọn</p>
            <div className="flex flex-col gap-3">
              {SLOTS.filter(s => !s.required).map(slot => (
                <BuildSlot
                  key={slot.key}
                  slotKey={slot.key}
                  label={slot.label}
                  description={slot.description}
                  Icon={slot.Icon}
                  product={build[slot.key]}
                  onPick={() => setActiveSlot(slot.key)}
                  onRemove={() => handleRemove(slot.key)}
                />
              ))}
            </div>
          </div>

          {/* Right: Summary */}
          <SummaryPanel
            build={build}
            totalPrice={totalPrice}
            onAddAllToCart={handleAddAllToCart}
            adding={addingToCart}
          />
        </div>
      </div>

      {/* Picker Modal */}
      {activeSlot && (
        <BuildPickerModal
          slotKey={activeSlot}
          slotLabel={SLOTS.find(s => s.key === activeSlot)?.label ?? activeSlot}
          onSelect={p => handleSelect(activeSlot, p)}
          onClose={() => setActiveSlot(null)}
        />
      )}
    </div>
  );
}
