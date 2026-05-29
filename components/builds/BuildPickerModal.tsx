'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Check, Loader2 } from 'lucide-react';
import { adminAPI, Product } from '@/lib/api';

interface BuildPickerModalProps {
  slotKey: string;
  slotLabel: string;
  build: Record<string, Product | null>;
  onSelect: (product: Product) => void;
  onClose: () => void;
}

export default function BuildPickerModal({ slotKey, slotLabel, build, onSelect, onClose }: BuildPickerModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Map slot key → category name keywords to auto-filter
  const slotCategoryKeywords: Record<string, string[]> = {
    cpu:      ['cpu', 'processor', 'vi xu ly'],
    mainboard:['mainboard', 'motherboard', 'board', 'bo mach'],
    ram:      ['ram', 'memory', 'bo nho'],
    storage:  ['ssd', 'hdd', 'storage', 'o cung'],
    vga:      ['vga', 'graphic', 'gpu', 'do hoa', 'card man hinh'],
    psu:      ['psu', 'power', 'nguon'],
    case:     ['case', 'vo may'],
    cooler:   ['cooler', 'tan nhiet', 'cooling'],
    monitor:  ['monitor', 'man hinh'],
    fan:      ['fan', 'quat'],
  };

  useEffect(() => {
    searchRef.current?.focus();
    const keywords = slotKey.startsWith('storage_extra_')
      ? slotCategoryKeywords['storage']
      : slotCategoryKeywords[slotKey] ?? [slotKey];

    adminAPI.getCategories(0, 200).then(res => {
      const cats = res.content || [];

      // Find category IDs matching this slot
      const matchedCats = cats.filter(c => {
        const slug = c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return keywords.some(kw => slug.includes(kw));
      });

      const catId = matchedCats[0]?.id;
      return adminAPI.getProducts(0, 200, undefined, catId ? String(catId) : undefined);
    }).then(res => {
      setProducts(res.content || []);
    }).catch(console.error).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotKey]);

  // Helper to safely parse specsJson
  const getProductSpecs = (p?: Product | null) => {
    if (!p || !p.specsJson) return {};
    try {
      return JSON.parse(p.specsJson);
    } catch {
      return {};
    }
  };

  // Get compatibility parameters from current build state
  const selectedCpu = build.cpu;
  const selectedMainboard = build.mainboard;
  const selectedRam = build.ram;
  const selectedVga = build.vga;
  const selectedCase = build.case;
  const selectedStorage = build.storage;
  const selectedCooler = build.cooler;

  const cpuSpecs = getProductSpecs(selectedCpu);
  const mainboardSpecs = getProductSpecs(selectedMainboard);
  const ramSpecs = getProductSpecs(selectedRam);
  const vgaSpecs = getProductSpecs(selectedVga);
  // caseSpecs, storageSpecs, coolerSpecs are checked dynamically in other places

  const cpuSocket = cpuSpecs.socket;
  const mainboardSocket = mainboardSpecs.socket;
  const mainboardRamType = mainboardSpecs.ram_type;
  const ramType = ramSpecs.type;
  const mainboardFormFactor = mainboardSpecs.form_factor;

  // TDP calculations for power supply filtering
  const totalTdp = (Number(cpuSpecs.tdp_w) || 0) + (Number(vgaSpecs.tdp_w) || 0);

  const isCaseCompatible = (caseProd: Product, mbFormFactor: string) => {
    const specs = getProductSpecs(caseProd);
    const supported = specs.supported_mainboards;
    if (!supported) return true;
    if (Array.isArray(supported)) {
      return supported.map(s => String(s).toLowerCase()).includes(mbFormFactor.toLowerCase());
    }
    return String(supported).toLowerCase().includes(mbFormFactor.toLowerCase());
  };

  const isSsdCompatible = (ssdProd: Product, mbProd: Product) => {
    const ssdSpecs = getProductSpecs(ssdProd);
    const mbSpecs = getProductSpecs(mbProd);
    const ssdInt = String(ssdSpecs.interface || '').toLowerCase();
    const ssdType = String(ssdSpecs.type || '').toLowerCase();
    
    if (ssdInt.includes('nvme') || ssdInt.includes('m.2') || ssdInt.includes('pcie') || ssdType.includes('m2')) {
      const m2Slots = Number(mbSpecs.m2_slots) || 0;
      return m2Slots > 0;
    }
    return true;
  };

  const isCoolerCompatible = (coolerProd: Product, socket: string) => {
    const specs = getProductSpecs(coolerProd);
    const supported = specs.supported_sockets;
    if (!supported) return true;
    if (Array.isArray(supported)) {
      return supported.map(s => String(s).toLowerCase()).includes(socket.toLowerCase());
    }
    const supportedStr = String(supported).toLowerCase();
    return supportedStr.includes(socket.toLowerCase()) || socket.toLowerCase().includes(supportedStr);
  };

  // Text search filter
  let filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand?.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // Apply compatibility filters based on slots (Two-Way)
  if (slotKey === 'mainboard') {
    if (cpuSocket) {
      filtered = filtered.filter(p => getProductSpecs(p).socket === cpuSocket);
    }
    if (ramType) {
      filtered = filtered.filter(p => getProductSpecs(p).ram_type === ramType);
    }
    if (selectedCase) {
      filtered = filtered.filter(p => {
        const mbForm = getProductSpecs(p).form_factor;
        return mbForm ? isCaseCompatible(selectedCase, mbForm) : true;
      });
    }
    if (selectedStorage) {
      filtered = filtered.filter(p => isSsdCompatible(selectedStorage, p));
    }
    if (selectedCooler) {
      filtered = filtered.filter(p => {
        const socket = getProductSpecs(p).socket;
        return socket ? isCoolerCompatible(selectedCooler, socket) : true;
      });
    }
  } else if (slotKey === 'cpu') {
    if (mainboardSocket) {
      filtered = filtered.filter(p => getProductSpecs(p).socket === mainboardSocket);
    }
    if (selectedCooler) {
      filtered = filtered.filter(p => {
        const socket = getProductSpecs(p).socket;
        return socket ? isCoolerCompatible(selectedCooler, socket) : true;
      });
    }
  } else if (slotKey === 'ram') {
    if (mainboardRamType) {
      filtered = filtered.filter(p => getProductSpecs(p).type === mainboardRamType);
    }
  } else if (slotKey === 'case') {
    if (mainboardFormFactor) {
      filtered = filtered.filter(p => isCaseCompatible(p, mainboardFormFactor));
    }
  } else if (slotKey === 'storage' || slotKey.startsWith('storage_extra_')) {
    if (selectedMainboard) {
      filtered = filtered.filter(p => isSsdCompatible(p, selectedMainboard));
    }
    if (slotKey.startsWith('storage_extra_')) {
      filtered = filtered.filter(p => {
        const specs = getProductSpecs(p);
        const ssdInt = String(specs.interface || '').toLowerCase();
        const ssdType = String(specs.type || '').toLowerCase();
        return ssdInt.includes('nvme') || ssdInt.includes('m.2') || ssdInt.includes('pcie') || ssdType.includes('m2');
      });
    }
  } else if (slotKey === 'cooler') {
    if (cpuSocket) {
      filtered = filtered.filter(p => isCoolerCompatible(p, cpuSocket));
    } else if (mainboardSocket) {
      filtered = filtered.filter(p => isCoolerCompatible(p, mainboardSocket));
    }
  } else if (slotKey === 'psu') {
    if (totalTdp > 0) {
      filtered = filtered.filter(p => {
        const wattage = Number(getProductSpecs(p).wattage) || 0;
        return wattage >= totalTdp;
      });
    }
  }

  const imgSrc = (p: Product) => {
    if (!p.thumbnailUrl) return null;
    return p.thumbnailUrl.startsWith('http') ? p.thumbnailUrl : `http://localhost:8080${p.thumbnailUrl}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[720px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f1f5f9]">
          <div>
            <p className="text-[11px] font-bold text-[#0058be] uppercase tracking-[1.2px]">Chọn linh kiện</p>
            <h2 className="text-[20px] font-bold text-[#0f172a] tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
              {slotLabel}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#f1f5f9] text-[#64748b] transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[12px] px-4 py-2.5 focus-within:border-[#0058be] transition-colors">
            <Search className="size-4 text-[#94a3b8] shrink-0" />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Tìm ${slotLabel.toLowerCase()}...`}
              className="flex-1 bg-transparent text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-[#94a3b8] hover:text-[#64748b] cursor-pointer">
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: 'thin' }}>
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-[#0058be]">
              <Loader2 className="size-6 animate-spin" />
              <span className="text-[14px] font-medium text-slate-500">Đang tải sản phẩm...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
              <Package className="size-10 mb-3 opacity-30" />
              <p className="text-[14px] font-medium">Không tìm thấy sản phẩm phù hợp</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map(p => {
                const src = imgSrc(p);
                const isHovered = hoveredId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { onSelect(p); onClose(); }}
                    onMouseEnter={() => setHoveredId(p.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`w-full flex items-center gap-4 p-4 rounded-[16px] border text-left transition-all duration-200 cursor-pointer ${
                      isHovered
                        ? 'border-[#0058be] bg-[#eff6ff] shadow-sm scale-[1.005]'
                        : 'border-[#e8ecf2] bg-white hover:border-[#0058be]'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="size-[72px] rounded-[12px] bg-[#f7f9fb] flex items-center justify-center shrink-0 overflow-hidden">
                      {src ? (
                        <img src={src} alt={p.name} className="size-full object-contain p-1" />
                      ) : (
                        <Package className="size-7 text-[#cbd5e1]" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {p.brand && (
                        <p className="text-[10px] font-bold text-[#0058be] uppercase tracking-[1px] mb-0.5">
                          {p.brand.name}
                        </p>
                      )}
                      <p className="text-[14px] font-semibold text-[#0f172a] leading-snug line-clamp-2">
                        {p.name}
                      </p>
                      <p className={`text-[11px] mt-1 font-medium ${p.stock === 0 ? 'text-amber-600 font-semibold' : 'text-[#64748b]'}`}>
                        {p.stock === 0 ? 'Hết hàng (Vẫn cho phép build)' : `Còn ${p.stock} sản phẩm`}
                      </p>
                    </div>

                    {/* Price + check */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <p className="text-[16px] font-bold text-[#0058be]">
                        {p.price.toLocaleString('vi-VN')}
                        <span className="text-[11px] font-normal ml-0.5 opacity-70">₫</span>
                      </p>
                      {isHovered && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#0058be] px-2.5 py-1 rounded-full">
                          <Check className="size-3" /> Chọn
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer count */}
        {!loading && (
          <div className="px-6 py-3 border-t border-[#f1f5f9] bg-[#f8fafc]">
            <p className="text-[12px] text-[#94a3b8] font-medium">
              {filtered.length} sản phẩm {search ? `phù hợp với "${search}"` : 'trong danh mục'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
