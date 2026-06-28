"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, SlidersHorizontal, ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { adminAPI, Product, Category, Brand } from "@/lib/api";
import DualRangeSlider from "./DualRangeSlider";
import BrandSwiper from "./BrandSwiper";
import { PrebuiltProductCard, SkeletonCard } from "./PrebuiltProductCard";

const SORT_OPTIONS = [
  { value: "default", label: "Mặc định" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
  { value: "name_asc", label: "Tên A–Z" },
];


function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#f1f5f9] last:border-0 pb-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full py-2.5 text-[12px] font-bold text-[#374151] uppercase tracking-[0.6px] cursor-pointer"
      >
        {title}
        <ChevronDown
          className={`size-3.5 text-[#94a3b8] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}


export default function PrebuiltPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [search, setSearch] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    0, 150_000_000,
  ]);
  const [sortBy, setSortBy] = useState("default");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  const PAGE_SIZE = 12;
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  
  useEffect(() => {
    Promise.all([
      adminAPI.getCategories(0, 200),
      adminAPI.getBrands(0, 200),
    ]).then(([cats, brs]) => {
      setCategories(cats.content || []);
      setBrands(brs.content || []);
    });
  }, []);

  
  const fetchPrebuiltPCs = useCallback(async () => {
    setLoading(true);
    try {
      const pcSystemCat = categories.find(
        (c) =>
          c.slug?.toLowerCase() === "pc-system" ||
          c.name.toLowerCase() === "pc_system",
      );

      const catIdStr = pcSystemCat ? String(pcSystemCat.id) : undefined;

      const res = await adminAPI.getProducts(
        0,
        500, 
        search || undefined,
        catIdStr,
        undefined,
      );
      setProducts(res.content || []);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, categories]);

  useEffect(() => {
    if (categories.length > 0) {
      Promise.resolve().then(() => {
        fetchPrebuiltPCs();
      });
    }
  }, [categories, fetchPrebuiltPCs]);

  
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
    }, 0);
    return () => clearTimeout(timer);
  }, [
    search,
    selectedBrands,
    selectedNeeds,
    priceRange,
    showOutOfStock,
    sortBy,
  ]);

  
  const filtered = products
    .filter((p) => {
      
      if (!showOutOfStock && p.stock === 0) return false;

      
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;

      
      if (
        selectedBrands.length > 0 &&
        !selectedBrands.includes(String(p.brandId))
      )
        return false;

      
      if (selectedNeeds.length > 0) {
        try {
          const specs = p.specsJson ? JSON.parse(p.specsJson) : {};
          const needs: string[] = specs.usage_need
            ? Array.isArray(specs.usage_need)
              ? specs.usage_need
              : String(specs.usage_need)
                  .split(",")
                  .map((s: string) => s.trim())
            : [];
          if (!selectedNeeds.some((n) => needs.includes(n))) return false;
        } catch {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "name_asc") return a.name.localeCompare(b.name, "vi");
      return 0;
    });

  const totalElements = filtered.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE) || 1;
  const displayedProducts = filtered.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  const activeFilterCount = [
    ...selectedBrands,
    ...selectedNeeds,
    priceRange[0] > 0 || priceRange[1] < 150_000_000 ? "p" : "",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedNeeds([]);
    setPriceRange([0, 150_000_000]);
    setSearch("");
    setPage(0);
  };

  
  const sidebar = (
    <aside className="flex flex-col gap-0.5">
      {}
      <div className="flex items-center justify-between mb-3 border-b border-[#f1f5f9] pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-3.5 text-[#0058be]" />
          <span className="text-[13px] font-bold text-[#0f172a]">Bộ lọc</span>
          {activeFilterCount > 0 && (
            <span className="bg-[#0058be] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-[11px] text-[#0058be] hover:underline cursor-pointer font-medium"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {}
      <FilterSection title="Thương hiệu">
        <div
          className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1"
          style={{ scrollbarWidth: "thin" }}
        >
          {brands.map((brand) => {
            const isChecked = selectedBrands.includes(String(brand.id));
            return (
              <label
                key={brand.id}
                className="flex items-center gap-2 cursor-pointer group/chk py-0.5 select-none"
              >
                <div
                  className={`shrink-0 w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center transition-colors ${
                    isChecked
                      ? "bg-[#0058be] border-[#0058be]"
                      : "border-[#cbd5e1] group-hover/chk:border-[#0058be]"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedBrands((prev) =>
                      prev.includes(String(brand.id))
                        ? prev.filter((id) => id !== String(brand.id))
                        : [...prev, String(brand.id)],
                    );
                  }}
                >
                  {isChecked && (
                    <svg width="8" height="6" viewBox="0 0 10 7" fill="none">
                      <path
                        d="M1 3L4 6L9 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-[12px] text-[#475569] group-hover/chk:text-[#0f172a] transition-colors truncate">
                  {brand.name}
                </span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      {}
      <FilterSection title="Nhu cầu sử dụng">
        <div className="flex flex-col gap-2">
          {["Gaming", "Đồ họa", "Văn phòng", "Lập trình"].map((need) => {
            const isChecked = selectedNeeds.includes(need);
            return (
              <label
                key={need}
                className="flex items-center gap-2 cursor-pointer group/chk py-0.5 select-none"
              >
                <div
                  className={`shrink-0 w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center transition-colors ${
                    isChecked
                      ? "bg-[#0058be] border-[#0058be]"
                      : "border-[#cbd5e1] group-hover/chk:border-[#0058be]"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedNeeds((prev) =>
                      prev.includes(need)
                        ? prev.filter((n) => n !== need)
                        : [...prev, need],
                    );
                  }}
                >
                  {isChecked && (
                    <svg width="8" height="6" viewBox="0 0 10 7" fill="none">
                      <path
                        d="M1 3L4 6L9 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-[12px] text-[#475569] group-hover/chk:text-[#0f172a] transition-colors truncate">
                  {need}
                </span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      {}
      <FilterSection title="Khoảng giá">
        <DualRangeSlider
          min={0}
          max={150_000_000}
          step={500_000}
          value={priceRange}
          onChange={setPriceRange}
        />
      </FilterSection>
    </aside>
  );

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #f7f9fb 0%, #f0f4fa 100%)",
      }}
    >
      {}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-1">
        <div className="flex items-center gap-1.5 text-[13px] text-[#64748b]">
          <Link href="/home" className="hover:text-[#0058be] transition-colors">
            Trang chủ
          </Link>
          <span className="text-[#cbd5e1] font-normal">/</span>
          <span className="text-[#0f172a] font-medium">PC build sẵn</span>
        </div>
      </div>

      {}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
        {}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
            <input
              type="search"
              placeholder="Tìm kiếm máy tính build sẵn..."
              value={search}
              onChange={(e) => {
                const v = e.target.value;
                if (searchDebounceRef.current)
                  clearTimeout(searchDebounceRef.current);
                setSearch(v);
                searchDebounceRef.current = setTimeout(() => setPage(0), 400);
              }}
              className="w-full bg-white border border-[#e2e8f0] rounded-[12px] pl-10 pr-10 py-2.5 text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0058be] focus:ring-2 focus:ring-[#0058be]/10 shadow-sm transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569] cursor-pointer"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="relative hidden sm:block">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-[#e2e8f0] rounded-[12px] pl-4 pr-9 py-2.5 text-[13px] text-[#374151] focus:outline-none focus:border-[#0058be] shadow-sm cursor-pointer font-medium"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8] pointer-events-none" />
          </div>

          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden flex items-center gap-2 bg-white border border-[#e2e8f0] rounded-[12px] px-4 py-2.5 text-[13px] font-medium text-[#374151] shadow-sm cursor-pointer"
          >
            <SlidersHorizontal className="size-4" />
            Lọc
            {activeFilterCount > 0 && (
              <span className="bg-[#0058be] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {}
        <div className="mb-5 bg-white border border-[#e2e8f0] rounded-[16px] p-2.5 shadow-sm">
          <BrandSwiper
            brands={brands}
            selectedBrands={selectedBrands}
            onToggle={(id) => {
              if (id === "") {
                setSelectedBrands([]);
              } else {
                setSelectedBrands((prev) =>
                  prev.includes(id)
                    ? prev.filter((b) => b !== id)
                    : [...prev, id],
                );
              }
              setPage(0);
            }}
          />
        </div>

        {}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-[13px] text-[#475569]">
              <span className="font-bold text-[#0f172a]">{totalElements}</span>{" "}
              máy cấu hình sẵn
              {filtered.length !== products.length && (
                <span className="text-[#94a3b8]">
                  {" "}
                  (trong tổng số {products.length})
                </span>
              )}
            </p>

            <div className="flex items-center gap-2 border-l border-[#e2e8f0] pl-3 ml-1">
              <label className="text-[12px] font-medium text-[#475569] cursor-pointer flex items-center gap-2 select-none">
                <div className="relative inline-block w-8 h-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={showOutOfStock}
                    onChange={(e) => setShowOutOfStock(e.target.checked)}
                  />
                  <div className="w-full h-full bg-[#cbd5e1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#0058be]"></div>
                </div>
                Hiển thị cấu hình hết hàng
              </label>
            </div>

            <div className="flex items-center gap-2 flex-wrap ml-2">
              {selectedBrands.map((brandId) => (
                <span
                  key={brandId}
                  className="inline-flex items-center gap-1.5 bg-[#eff6ff] text-[#0058be] text-[11px] font-medium px-2 py-0.5 rounded-full"
                >
                  {brands.find((b) => String(b.id) === brandId)?.name}
                  <button
                    onClick={() =>
                      setSelectedBrands((prev) =>
                        prev.filter((id) => id !== brandId),
                      )
                    }
                    className="cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              {selectedNeeds.map((need) => (
                <span
                  key={need}
                  className="inline-flex items-center gap-1.5 bg-[#eff6ff] text-[#0058be] text-[11px] font-medium px-2 py-0.5 rounded-full"
                >
                  Nhu cầu: {need}
                  <button
                    onClick={() =>
                      setSelectedNeeds((prev) => prev.filter((n) => n !== need))
                    }
                    className="cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              {(priceRange[0] > 0 || priceRange[1] < 150_000_000) && (
                <span className="inline-flex items-center gap-1.5 bg-[#eff6ff] text-[#0058be] text-[11px] font-medium px-2 py-0.5 rounded-full">
                  {priceRange[0] > 0
                    ? (priceRange[0] / 1_000_000).toFixed(1) + "M"
                    : "0"}{" "}
                  -{" "}
                  {priceRange[1] < 150_000_000
                    ? (priceRange[1] / 1_000_000).toFixed(1) + "M"
                    : "Max"}
                  <button
                    onClick={() => setPriceRange([0, 150_000_000])}
                    className="cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-[12px] text-[#94a3b8] hover:text-[#475569] transition-colors cursor-pointer"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {}
        <div className="flex gap-5 items-start">
          {}
          <div
            className="hidden lg:block w-[232px] shrink-0 bg-white rounded-[16px] border border-[#e8ecf2] p-4 shadow-sm sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto"
            style={{ scrollbarWidth: "thin" }}
          >
            {sidebar}
          </div>

          {}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-[#e8ecf2] rounded-[16px] shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center">
                  <Search className="size-7 text-[#cbd5e1]" />
                </div>
                <p className="text-[15px] font-semibold text-[#0f172a]">
                  Không tìm thấy cấu hình
                </p>
                <p className="text-[13px] text-[#94a3b8]">
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-1 px-5 py-2 bg-[#0058be] text-white rounded-[10px] text-[13px] font-medium hover:bg-[#0047a3] transition-colors cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {displayedProducts.map((p) => (
                    <PrebuiltProductCard key={p.id} product={p} />
                  ))}
                </div>

                {}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className="px-4 py-2 rounded-[10px] border border-[#e2e8f0] bg-white text-[13px] font-medium text-[#475569] hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Trước
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }).map(
                      (_, i) => {
                        const pn =
                          totalPages <= 7
                            ? i
                            : Math.max(0, Math.min(totalPages - 7, page - 3)) +
                              i;
                        return (
                          <button
                            key={pn}
                            onClick={() => setPage(pn)}
                            className={`w-9 h-9 rounded-[8px] text-[13px] font-medium cursor-pointer ${pn === page ? "bg-[#0058be] text-white" : "bg-white border border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc]"}`}
                          >
                            {pn + 1}
                          </button>
                        );
                      },
                    )}
                    <button
                      disabled={page >= totalPages - 1}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages - 1, p + 1))
                      }
                      className="px-4 py-2 rounded-[10px] border border-[#e2e8f0] bg-white text-[13px] font-medium text-[#475569] hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative ml-auto w-[300px] bg-white h-full overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-[#f1f5f9] pb-3">
              <h2 className="font-bold text-[15px] text-[#0f172a]">Bộ lọc</h2>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded hover:bg-slate-50 cursor-pointer"
              >
                <X className="size-5 text-[#94a3b8]" />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}
    </div>
  );
}
