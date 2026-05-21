'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Check, Loader2 } from 'lucide-react';
import { adminAPI, Product } from '@/lib/api';

interface BuildPickerModalProps {
  slotKey: string;
  slotLabel: string;
  onSelect: (product: Product) => void;
  onClose: () => void;
}

export default function BuildPickerModal({ slotKey, slotLabel, onSelect, onClose }: BuildPickerModalProps) {
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
    const keywords = slotCategoryKeywords[slotKey] ?? [slotKey];

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

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand?.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

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
                    disabled={p.stock === 0}
                    onClick={() => { onSelect(p); onClose(); }}
                    onMouseEnter={() => setHoveredId(p.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`w-full flex items-center gap-4 p-4 rounded-[16px] border text-left transition-all duration-200 cursor-pointer ${
                      p.stock === 0
                        ? 'opacity-50 cursor-not-allowed border-[#e8ecf2] bg-[#f8fafc]'
                        : isHovered
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
                      <p className={`text-[11px] mt-1 font-medium ${p.stock === 0 ? 'text-red-500' : 'text-[#64748b]'}`}>
                        {p.stock === 0 ? 'Hết hàng' : `Còn ${p.stock} sản phẩm`}
                      </p>
                    </div>

                    {/* Price + check */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <p className="text-[16px] font-bold text-[#0058be]">
                        {p.price.toLocaleString('vi-VN')}
                        <span className="text-[11px] font-normal ml-0.5 opacity-70">₫</span>
                      </p>
                      {isHovered && p.stock > 0 && (
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
