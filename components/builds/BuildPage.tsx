'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Cpu, Layers, HardDrive, Tv, Zap, Box, Wind, Monitor, Folder, Fan,
  ShoppingCart, Loader2, AlertTriangle, RotateCcw, FolderOpen, Calendar, Save, Trash2, Heart, Plus, X
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { Product, buildAPI, adminAPI, PcBuildResponse } from '@/lib/api';
import { useCartStore, useAuthStore } from '@/lib/store';
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
  { key: 'vga',      label: 'Card đồ họa (GPU)',      description: 'Sức mạnh đồ họa',    Icon: Tv,      required: true  },
  { key: 'storage',  label: 'Ổ cứng (SSD/HDD)',       description: 'Lưu trữ dữ liệu',    Icon: HardDrive,required: true },
  { key: 'psu',      label: 'Nguồn (PSU)',             description: 'Nguồn cấp điện',     Icon: Zap,     required: true  },
  { key: 'case',     label: 'Vỏ máy (Case)',           description: 'Khung chứa linh kiện',Icon: Box,   required: true  },
  { key: 'cooler',   label: 'Tản nhiệt CPU',           description: 'Giải nhiệt vi xử lý',Icon: Wind,   required: false },
  { key: 'monitor',  label: 'Màn hình',                description: 'Thiết bị hiển thị',  Icon: Monitor, required: false },
  { key: 'fan',      label: 'Quạt case',               description: 'Thông gió trong thùng',Icon: Fan,  required: false },
];

type BuildState = Record<string, Product | null>;

// ─── Summary panel ───────────────────────────────────────────────────────────

function SummaryPanel({ build, totalPrice, onAddAllToCart, adding, extraStorageSlots = [] }: {
  build: BuildState;
  totalPrice: number;
  onAddAllToCart: () => void;
  adding: boolean;
  extraStorageSlots?: SlotDef[];
}) {
  const allSlots = [...SLOTS, ...extraStorageSlots];
  const selectedCount = allSlots.filter(s => !!build[s.key]).length;
  const requiredSlots = SLOTS.filter(s => s.required);
  const missingRequired = requiredSlots.filter(s => !build[s.key]);

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
  const totalTdp = (Number(cpuSpecs.tdp_w) || 0) + (Number(vgaSpecs.tdp_w) || 0);

  return (
    <div className="sticky top-24 flex flex-col gap-4">
      {/* Price card */}
      <div className="bg-white rounded-[24px] border border-[#e8ecf2] p-6 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div>
          <p className="text-[11px] font-bold text-[#0058be] uppercase tracking-[1.5px] mb-1.5">Tổng cấu hình</p>
          <p className="text-[34px] font-black text-[#0f172a] tracking-tight leading-none" style={{ fontFamily: 'Inter, sans-serif' }}>
            {totalPrice.toLocaleString('vi-VN')}
            <span className="text-[18px] font-extrabold text-[#0058be] ml-1">₫</span>
          </p>
          <p className="text-[12.5px] text-[#64748b] mt-2 font-medium">{selectedCount}/{allSlots.length} linh kiện đã chọn</p>
          {totalTdp > 0 && (
            <div className="mt-2.5 flex flex-col gap-1.5 self-start bg-amber-50/60 border border-amber-100/50 px-3 py-2 rounded-[10px] w-full text-amber-700 font-bold text-[11px] uppercase tracking-[0.5px]">
              <div className="flex items-center gap-1.5">
                <Zap className="size-3.5 shrink-0" />
                Công suất ước tính: {totalTdp}W
              </div>
              <div className="flex items-center gap-1.5 border-t border-amber-200/30 pt-1.5 mt-0.5">
                <span className="size-3.5 text-center leading-none shrink-0">🛡️</span>
                PSU khuyến nghị: {Math.ceil((totalTdp + 150) / 50) * 50}W
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden border border-[#cbd5e1]/10">
          <div
            className="h-full bg-gradient-to-r from-[#0058be] to-[#2563eb] rounded-full transition-all duration-500"
            style={{ width: `${(selectedCount / allSlots.length) * 100}%` }}
          />
        </div>

        {/* Warnings */}
        {missingRequired.length > 0 && (
          <div className="bg-rose-50/50 border border-rose-100 rounded-[16px] p-4">
            <p className="text-[12px] font-bold text-rose-700 flex items-center gap-1.5 mb-2">
              <AlertTriangle className="size-3.5 shrink-0" /> Linh kiện bắt buộc còn thiếu:
            </p>
            <ul className="flex flex-col gap-1 pl-1">
              {missingRequired.map(s => (
                <li key={s.key} className="text-[11px] text-rose-600 font-semibold flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-rose-400 shrink-0" />
                  {s.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <button
          type="button"
          disabled={selectedCount === 0 || adding}
          onClick={onAddAllToCart}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[14px] bg-gradient-to-r from-[#0058be] to-[#2563eb] text-white text-[14px] font-bold shadow-[0_8px_24px_rgba(0,88,190,0.25)] hover:shadow-[0_8px_32px_rgba(0,88,190,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
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
        <div className="bg-white rounded-[24px] border border-[#e8ecf2] p-5 flex flex-col gap-3.5 shadow-sm hover:shadow-md transition-shadow duration-300">
          <p className="text-[12px] font-extrabold text-[#475569] uppercase tracking-[1px] border-b border-[#f1f5f9] pb-2">Danh sách chi tiết</p>
          <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {allSlots.map(slot => {
              const product = build[slot.key];
              if (!product) return null;
              return (
                <div key={slot.key} className="flex items-center justify-between gap-2.5 group/sum">
                  <div className="flex items-center gap-2 min-w-0">
                    <slot.Icon className="size-3.5 text-[#0058be] shrink-0" />
                    <p className="text-[12px] text-[#334155] font-semibold truncate group-hover/sum:text-[#0058be] transition-colors">{product.name}</p>
                  </div>
                  <p className="text-[12px] font-bold text-[#0f172a] shrink-0">
                    {product.price.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
              );
            })}
          </div>
          <div className="pt-3 border-t border-[#f1f5f9] flex justify-between items-center">
            <p className="text-[12px] font-extrabold text-[#475569]">Tổng giá trị</p>
            <p className="text-[15px] font-black text-[#0058be]">{totalPrice.toLocaleString('vi-VN')} ₫</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function BuildPage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [build, setBuild] = useState<BuildState>(
    Object.fromEntries(SLOTS.map(s => [s.key, null]))
  );
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addItem } = useCartStore();

  // Tab State
  const [activeTab, setActiveTab] = useState<'builder' | 'my-builds'>('builder');

  // Custom configuration list
  const [myBuilds, setMyBuilds] = useState<PcBuildResponse[]>([]);
  const [loadingMyBuilds, setLoadingMyBuilds] = useState(false);

  // Sync tab query parameter on load
  useEffect(() => {
    if (tabParam === 'my-builds') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab('my-builds');
    }
  }, [tabParam]);

  // Save Modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [buildName, setBuildName] = useState('');
  const [savingBuild, setSavingBuild] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper to parse specsJson
  const getProductSpecs = (p?: Product | null) => {
    if (!p || !p.specsJson) return {};
    try {
      return JSON.parse(p.specsJson);
    } catch {
      return {};
    }
  };

  // Dynamic slots based on motherboard M.2 slots
  const extraStorageSlots: SlotDef[] = [];
  const mb = build.mainboard;
  const mbSpecs = mb ? getProductSpecs(mb) : {};
  const m2Slots = Number(mbSpecs.m2_slots) || 0;
  for (let i = 1; i <= m2Slots; i++) {
    extraStorageSlots.push({
      key: `storage_extra_${i}`,
      label: `Ổ cứng M.2 bổ sung ${i}`,
      description: `Ổ cứng SSD M.2 gắn thêm vào khe thứ ${i}`,
      Icon: HardDrive,
      required: false,
    });
  }

  const allSlots = [...SLOTS, ...extraStorageSlots];
  const selectedCount = allSlots.filter(s => !!build[s.key]).length;
  const totalPrice = Object.values(build).reduce((sum, p) => sum + (p?.price ?? 0), 0);

  // Clean up dynamic slots if motherboard changes and reduces M.2 slots
  useEffect(() => {
    const mbSpecsObj = build.mainboard ? getProductSpecs(build.mainboard) : {};
    const currentM2Slots = Number(mbSpecsObj.m2_slots) || 0;

    let hasChanges = false;
    const newBuild = { ...build };

    Object.keys(build).forEach(key => {
      if (key.startsWith('storage_extra_')) {
        const index = parseInt(key.replace('storage_extra_', ''), 10);
        if (isNaN(index) || index > currentM2Slots) {
          delete newBuild[key];
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setBuild(newBuild);
    }
  }, [build.mainboard]);

  // Fetch saved builds when active tab changes to 'my-builds'
  const fetchMyBuilds = async () => {
    if (!user) return;
    setLoadingMyBuilds(true);
    try {
      const data = await buildAPI.list();
      setMyBuilds(data);
    } catch {
      console.error('Error fetching custom builds.');
    } finally {
      setLoadingMyBuilds(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-builds' && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMyBuilds();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

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
    const selected = Object.values(build).filter((p): p is Product => !!p);
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
      toast.error(`${failed} sản phẩm không thể thêm (có thể do hết hàng hoặc chưa đăng nhập).`);
    }
  };

  // Compatibility Notes Calculator
  const getCompatibilityNotes = (): { type: 'info' | 'warning'; text: string }[] => {
    const notes: { type: 'info' | 'warning'; text: string }[] = [];

    const cpu = build.cpu;
    const mb = build.mainboard;
    const ram = build.ram;
    const caseProd = build.case;

    const cpuSpecs = getProductSpecs(cpu);
    const mbSpecs = getProductSpecs(mb);
    const ramSpecs = getProductSpecs(ram);
    const caseSpecs = getProductSpecs(caseProd);

    const cpuSocket = cpuSpecs.socket;
    const mbSocket = mbSpecs.socket;
    const mbRamType = mbSpecs.ram_type;
    const ramType = ramSpecs.type;
    const mbFormFactor = mbSpecs.form_factor;

    // CPU Socket Hint
    if (cpu && cpuSocket) {
      if (!mb) {
        notes.push({
          type: 'info',
          text: `Bạn cần chọn bo mạch chủ (Mainboard) hỗ trợ socket ${cpuSocket} để tương thích với vi xử lý [${cpu.name}].`
        });
      } else if (mbSocket && mbSocket !== cpuSocket) {
        notes.push({
          type: 'warning',
          text: `⚠️ Vi xử lý [${cpu.name}] (Socket ${cpuSocket}) không tương thích với bo mạch chủ [${mb.name}] (Socket ${mbSocket}).`
        });
      }
    }

    // Mainboard Hints
    if (mb) {
      if (mbSocket && !cpu) {
        notes.push({
          type: 'info',
          text: `Bạn cần chọn vi xử lý (CPU) hỗ trợ socket ${mbSocket} để lắp ráp vào bo mạch chủ [${mb.name}].`
        });
      }
      if (mbRamType && !ram) {
        notes.push({
          type: 'info',
          text: `Bạn cần chọn bộ nhớ RAM chuẩn ${mbRamType} để tương thích với bo mạch chủ [${mb.name}].`
        });
      } else if (ramType && mbRamType !== ramType) {
        notes.push({
          type: 'warning',
          text: `⚠️ Bo mạch chủ [${mb.name}] (Hỗ trợ RAM ${mbRamType}) không tương thích với bộ nhớ RAM [${ram?.name || 'RAM'}] (Chuẩn RAM ${ramType}).`
        });
      }
      if (mbFormFactor && !caseProd) {
        notes.push({
          type: 'info',
          text: `Bạn cần chọn vỏ máy (Case) hỗ trợ kích thước ${mbFormFactor} cho bo mạch chủ [${mb.name}].`
        });
      } else if (mbFormFactor && caseProd) {
        const supported = caseSpecs.supported_mainboards;
        let isCompatible = true;
        if (supported) {
          if (Array.isArray(supported)) {
            isCompatible = supported.map(s => String(s).toLowerCase()).includes(mbFormFactor.toLowerCase());
          } else {
            isCompatible = String(supported).toLowerCase().includes(mbFormFactor.toLowerCase());
          }
        }
        if (!isCompatible) {
          notes.push({
            type: 'warning',
            text: `⚠️ Bo mạch chủ [${mb.name}] (Kích cỡ ${mbFormFactor}) quá lớn hoặc không vừa với vỏ máy [${caseProd.name}].`
          });
        }
      }
    }

    // RAM Hint
    if (ram && ramType && !mb) {
      notes.push({
        type: 'info',
        text: `Bạn cần chọn bo mạch chủ hỗ trợ chuẩn bộ nhớ ${ramType} cho thanh RAM [${ram.name}].`
      });
    }

    return notes;
  };

  const handleSaveClick = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập trước khi lưu cấu hình!');
      return;
    }
    if (selectedCount === 0) {
      toast.error('Vui lòng chọn ít nhất 1 linh kiện trước khi lưu!');
      return;
    }
    setBuildName(`Cấu hình máy ngày ${new Date().toLocaleDateString('vi-VN')}`);
    setErrors({});
    setShowSaveModal(true);
  };

  const handleSaveConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildName.trim()) {
      setErrors({ buildName: 'Vui lòng nhập tên cấu hình!' });
      return;
    }

    setSavingBuild(true);
    try {
      // 1. Create PcBuild entity
      const savedBuild = await buildAPI.create(buildName);
      
      // 2. Map slot keys to backend ComponentType
      const slotToTypeMap: Record<string, string> = {
        cpu: 'CPU',
        mainboard: 'MAINBOARD',
        ram: 'RAM',
        storage: 'STORAGE',
        vga: 'GPU',
        psu: 'PSU',
        case: 'CASE',
        cooler: 'COOLER'
      };

      const selectedItems = Object.entries(build)
        .filter(([, prod]) => !!prod)
        .map(([slotKey, prod]) => {
          const componentType = slotKey.startsWith('storage_extra_')
            ? 'STORAGE'
            : slotToTypeMap[slotKey];
          return {
            productId: Number(prod!.id),
            componentType
          };
        })
        .filter(item => !!item.componentType); // ignore monitor and fan since they are not in the core backend enum

      // 3. Add components sequentially
      for (const item of selectedItems) {
        await buildAPI.addItem(savedBuild.id, item.productId, item.componentType);
      }

      toast.success('Lưu cấu hình PC thành công!');
      setShowSaveModal(false);
      // If they are saved, fetch list again
      fetchMyBuilds();
    } catch (err) {
      console.error(err);
      toast.error('Lưu cấu hình thất bại. Vui lòng thử lại.');
    } finally {
      setSavingBuild(false);
    }
  };

  const loadSavedBuild = async (savedBuild: PcBuildResponse) => {
    setLoadingMyBuilds(true);
    const toastId = toast.loading('Đang tải chi tiết cấu hình...');
    try {
      const newBuildState: Record<string, Product | null> = Object.fromEntries(
        SLOTS.map(s => [s.key, null])
      );
      
      const typeToSlotMap: Record<string, string> = {
        'CPU': 'cpu',
        'MAINBOARD': 'mainboard',
        'RAM': 'ram',
        'STORAGE': 'storage',
        'GPU': 'vga',
        'PSU': 'psu',
        'CASE': 'case',
        'COOLER': 'cooler'
      };

      let storageCount = 0;

      for (const item of savedBuild.items) {
        if (item.productId) {
          let slotKey = typeToSlotMap[item.componentType];
          if (item.componentType === 'STORAGE') {
            if (storageCount > 0) {
              slotKey = `storage_extra_${storageCount}`;
            }
            storageCount++;
          }
          if (slotKey) {
            try {
              const product = await adminAPI.getProductById(item.productId);
              newBuildState[slotKey] = product;
            } catch (err) {
              console.error("Error loading product: ", item.productId, err);
            }
          }
        }
      }
      
      setBuild(newBuildState);
      setActiveTab('builder');
      toast.success(`Đã tải cấu hình: ${savedBuild.name}`, { id: toastId });
    } catch {
      toast.error('Lỗi khi tải chi tiết cấu hình.', { id: toastId });
    } finally {
      setLoadingMyBuilds(false);
    }
  };

  const handleDeleteBuild = async (buildId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent loading saved build
    if (!window.confirm('Bạn có chắc chắn muốn xóa cấu hình này khỏi tài khoản của mình?')) {
      return;
    }
    
    const toastId = toast.loading('Đang xóa cấu hình...');
    try {
      await buildAPI.delete(buildId);
      toast.success('Đã xóa cấu hình PC thành công!', { id: toastId });
      fetchMyBuilds();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa cấu hình. Vui lòng thử lại.', { id: toastId });
    }
  };

  const compatNotes = getCompatibilityNotes();

  return (
    <div className="flex flex-col min-h-screen w-full" style={{ background: 'linear-gradient(180deg, #f7f9fb 0%, #f0f4f8 100%)' }}>
      {/* Page Header */}
      <div className="w-full bg-white/80 backdrop-blur-md border-b border-[#e2e8f0]/80 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[11px] font-bold text-[#0058be] uppercase tracking-[1.2px]">PCMaster Builder</p>
              <h1 className="text-[20px] font-black text-[#0f172a] tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                Xây dựng cấu hình PC
              </h1>
            </div>
            {/* Toggle button to switch between Design and Saved Configurations */}
            {activeTab === 'builder' ? (
              <button
                onClick={() => setActiveTab('my-builds')}
                className="flex items-center gap-1.5 bg-white border border-[#cbd5e1] hover:border-[#0058be] text-[#334155] hover:text-[#0058be] text-[13px] font-bold px-4 py-2 rounded-[10px] shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <span>📂</span>
                <span>Cấu hình đã lưu</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('builder')}
                className="flex items-center gap-1.5 bg-[#0058be] hover:bg-[#0047a3] text-white text-[13px] font-bold px-4 py-2 rounded-[10px] shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <span>🛠️</span>
                <span>Thiết kế PC</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {activeTab === 'builder' && selectedCount > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleSaveClick}
                  className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#0058be] text-white text-[13px] font-bold hover:bg-[#0047a3] shadow-md shadow-blue-100 transition-all cursor-pointer"
                >
                  <Save className="size-3.5" />
                  Lưu cấu hình
                </button>
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
      <div className="max-w-[1400px] mx-auto w-full px-8 py-8 flex-1">
        {activeTab === 'builder' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
            {/* Left: Slot list */}
            <div className="flex flex-col gap-3">
              {/* Intro banner removed as requested */}

              {/* Compatibility Notes Widget */}
              {compatNotes.length > 0 && (
                <div className="bg-white border border-[#e8ecf2] rounded-[24px] p-6 flex flex-col gap-4 shadow-sm mb-3">
                  <div className="flex items-center gap-2.5 text-[#0058be] font-extrabold text-[14px] uppercase tracking-[0.5px]">
                    <span className="flex items-center justify-center size-6 rounded-full bg-[#eff6ff] text-[12px] shadow-sm">💡</span>
                    Gợi ý tương thích hệ thống
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {compatNotes.map((note, index) => (
                      <div
                        key={index}
                        className={`text-[12.5px] px-4 py-3 rounded-[12px] border font-medium leading-relaxed transition-colors ${
                          note.type === 'warning'
                            ? 'bg-rose-50/40 border-rose-100 text-rose-700'
                            : 'bg-[#eff6ff]/30 border-blue-100/40 text-[#0058be]'
                        }`}
                      >
                        {note.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                {extraStorageSlots.map(slot => (
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
              extraStorageSlots={extraStorageSlots}
            />
          </div>
        ) : (
          /* Custom Configurations Tab */
          <div className="max-w-[800px] mx-auto w-full flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-[#0f172a] text-[18px] font-bold">Danh sách cấu hình đã lưu</h3>
                <p className="text-[#64748b] text-[13px] mt-0.5">Tải lại cấu hình cũ để tiếp tục căn chỉnh hoặc đặt mua.</p>
              </div>
              <button
                onClick={() => setActiveTab('builder')}
                className="bg-white border border-[#e8ecf2] px-4 py-2 rounded-[10px] text-[13px] font-bold text-[#0058be] hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="size-4" /> Thiết kế cấu hình mới
              </button>
            </div>

            {loadingMyBuilds ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#0058be]">
                <Loader2 className="size-8 animate-spin" />
                <span className="text-[14px] text-slate-500 font-medium">Đang tải cấu hình của bạn...</span>
              </div>
            ) : !user ? (
              <div className="bg-white rounded-[24px] border border-[#e8ecf2] p-12 text-center flex flex-col items-center gap-4 shadow-sm">
                <div className="p-4 bg-blue-50 text-[#0058be] rounded-full shrink-0">
                  <FolderOpen className="size-10" />
                </div>
                <div>
                  <h4 className="text-[#0f172a] font-bold text-[16px]">Vui lòng đăng nhập tài khoản</h4>
                  <p className="text-[#64748b] text-[13px] mt-1">Đăng nhập tài khoản khách hàng để xem các cấu hình PC đã tự thiết kế trước đó.</p>
                </div>
              </div>
            ) : myBuilds.length === 0 ? (
              <div className="bg-white rounded-[24px] border border-[#e8ecf2] p-12 text-center flex flex-col items-center gap-4 shadow-sm">
                <div className="p-4 bg-rose-50 text-rose-600 rounded-full shrink-0">
                  <Heart className="size-10" />
                </div>
                <div>
                  <h4 className="text-[#0f172a] font-bold text-[16px]">Bạn chưa lưu cấu hình nào</h4>
                  <p className="text-[#64748b] text-[13px] mt-1">Tự tay lắp ráp các linh kiện tương thích bên tab **Thiết kế PC** và lưu lại.</p>
                </div>
                <button
                  onClick={() => setActiveTab('builder')}
                  className="bg-[#0058be] text-white px-5 py-2 rounded-[10px] text-[13px] font-bold hover:bg-[#0047a3] cursor-pointer"
                >
                  Bắt đầu lắp ráp ngay
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {myBuilds.map(b => (
                  <div
                     key={b.id}
                     onClick={() => loadSavedBuild(b)}
                     className="bg-white rounded-[24px] border border-[#e8ecf2] p-6 shadow-sm hover:border-[#0058be]/30 hover:shadow-[0_12px_36px_rgba(0,88,190,0.06)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 cursor-pointer group/card"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3.5 bg-[#eff6ff] text-[#0058be] border border-blue-100/30 rounded-[16px] group-hover/card:bg-[#0058be] group-hover/card:text-white transition-colors duration-300">
                        <Cpu className="size-6" />
                      </div>
                      <div>
                        <h4 className="text-[#0f172a] font-bold text-[16px] leading-snug group-hover/card:text-[#0058be] transition-colors">{b.name}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-[11px] text-[#64748b] font-semibold">
                          <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-[6px]">
                            <Calendar className="size-3.5 text-[#94a3b8]" />
                            {new Date(b.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[#0058be] bg-[#eff6ff] border border-blue-100/35 px-2 py-0.5 rounded-[6px]">{b.items.length} linh kiện chính</span>
                          {b.totalPower > 0 && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-[6px]">TDP: {b.totalPower}W</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 shrink-0"
                      onClick={e => e.stopPropagation()} // prevent double trigger
                    >
                      <div className="md:text-right">
                        <p className="text-[10px] text-[#94a3b8] uppercase font-bold tracking-[1.5px] mb-0.5">Tổng giá trị</p>
                        <p className="text-[20px] font-black text-[#0058be] leading-none" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {b.totalPrice.toLocaleString('vi-VN')}
                          <span className="text-[13px] font-bold ml-0.5">₫</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => loadSavedBuild(b)}
                          className="bg-blue-50 text-[#0058be] hover:bg-[#0058be] hover:text-white border border-blue-100/40 px-4.5 py-2.5 rounded-[12px] text-[13px] font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shrink-0"
                        >
                          Tải cấu hình
                        </button>
                        <button
                          onClick={(e) => handleDeleteBuild(b.id, e)}
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 rounded-[12px] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shadow-sm shrink-0"
                          title="Xóa cấu hình"
                        >
                          <Trash2 className="size-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Picker Modal */}
      {activeSlot && (
        <BuildPickerModal
          slotKey={activeSlot}
          slotLabel={allSlots.find(s => s.key === activeSlot)?.label ?? activeSlot}
          build={build}
          onSelect={p => handleSelect(activeSlot, p)}
          onClose={() => setActiveSlot(null)}
        />
      )}

      {/* Save Modal dialog */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <form onSubmit={handleSaveConfirm} className="bg-white rounded-[20px] shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-[#0f172a] font-bold text-[16px]">Lưu cấu hình PC</h4>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#475569]">Tên cấu hình của bạn:</label>
              {errors.buildName && (
                <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  ⚠️ {errors.buildName}
                </span>
              )}
              <input
                type="text"
                required
                value={buildName}
                onChange={e => {
                  setBuildName(e.target.value);
                  setErrors(prev => ({ ...prev, buildName: '' }));
                }}
                placeholder="VD: PC Chuyên Chiến Game"
                className={`bg-[#f8fafc] border rounded-[8px] px-3 py-2 text-[14px] focus:outline-none transition-all ${
                  errors.buildName ? 'border-red-500 focus:border-red-500' : 'border-[#e2e8f0] focus:border-[#0058be]'
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
      )}
    </div>
  );
}
