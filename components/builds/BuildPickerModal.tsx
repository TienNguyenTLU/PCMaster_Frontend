"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Package,
  Check,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { adminAPI, Product } from "@/lib/api";
import { isCaseCompatibleWithMb } from "./BuildPage";

interface BuildPickerModalProps {
  slotKey: string;
  slotLabel: string;
  build: Record<string, Product | null>;
  onSelect: (product: Product) => void;
  onClose: () => void;
  aiPsuWattage?: number | null;
}

export default function BuildPickerModal({
  slotKey,
  slotLabel,
  build,
  onSelect,
  onClose,
  aiPsuWattage = null,
}: BuildPickerModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  
  const slotCategoryKeywords: Record<string, string[]> = {
    cpu: ["cpu", "processor", "vi xu ly"],
    mainboard: ["mainboard", "motherboard", "board", "bo mach"],
    ram: ["ram", "memory", "bo nho"],
    storage: ["ssd", "hdd", "storage", "o cung"],
    vga: ["vga", "graphic", "gpu", "do hoa", "card man hinh"],
    psu: ["psu", "power", "nguon"],
    case: ["case", "vo may"],
    cooler: ["cooler", "tan nhiet", "cooling"],
    monitor: ["monitor", "man hinh"],
    fan: ["fan", "quat"],
  };

  useEffect(() => {
    searchRef.current?.focus();
    const keywords = slotKey.startsWith("storage_extra_")
      ? slotCategoryKeywords["storage"]
      : (slotCategoryKeywords[slotKey] ?? [slotKey]);

    adminAPI
      .getCategories(0, 200)
      .then((res) => {
        const cats = res.content || [];

        
        const matchedCats = cats.filter((c) => {
          const slug = c.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          return keywords.some((kw) => slug.includes(kw));
        });

        const catId = matchedCats[0]?.id;
        return adminAPI.getProducts(
          0,
          200,
          undefined,
          catId ? String(catId) : undefined,
        );
      })
      .then((res) => {
        setProducts(res.content || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    
  }, [slotKey]);

  
  const getProductSpecs = (p?: Product | null) => {
    if (!p || !p.specsJson) return {};
    try {
      return JSON.parse(p.specsJson);
    } catch {
      return {};
    }
  };

  
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

  const cpuSocket = cpuSpecs.socket;
  const mainboardSocket = mainboardSpecs.socket;
  const mainboardRamType = mainboardSpecs.ram_type;
  const ramType = ramSpecs.ram_type;
  const mainboardFormFactor = mainboardSpecs.form_factor;

  
  const totalTdp =
    (Number(cpuSpecs.tdp_w) || 0) + (Number(vgaSpecs.tdp_w) || 0);

  const isCaseCompatible = (caseProd: Product, mbFormFactor: string) => {
    return isCaseCompatibleWithMb(caseProd, mbFormFactor);
  };

  const isSsdCompatible = (ssdProd: Product, mbProd: Product) => {
    const ssdSpecs = getProductSpecs(ssdProd);
    const mbSpecs = getProductSpecs(mbProd);
    const ssdInt = String(ssdSpecs.interface || "").toLowerCase();
    const ssdType = String(ssdSpecs.type || "").toLowerCase();

    if (
      ssdInt.includes("nvme") ||
      ssdInt.includes("m.2") ||
      ssdInt.includes("pcie") ||
      ssdType.includes("m2")
    ) {
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
      return supported
        .map((s) => String(s).toLowerCase())
        .includes(socket.toLowerCase());
    }
    const supportedStr = String(supported).toLowerCase();
    return (
      supportedStr.includes(socket.toLowerCase()) ||
      socket.toLowerCase().includes(supportedStr)
    );
  };

  
  const checkCompatibility = (
    p: Product,
  ): { compatible: boolean; reason?: string } => {
    const specs = getProductSpecs(p);

    if (slotKey === "mainboard") {
      const mbSocket = specs.socket;
      const mbRamType = specs.ram_type;
      const mbFormFactor = specs.form_factor;

      if (
        cpuSocket &&
        mbSocket &&
        cpuSocket.toLowerCase() !== mbSocket.toLowerCase()
      ) {
        return {
          compatible: false,
          reason: `Không cùng socket với CPU (CPU: ${cpuSocket} vs Mainboard: ${mbSocket})`,
        };
      }
      if (
        ramType &&
        mbRamType &&
        ramType.toLowerCase() !== mbRamType.toLowerCase()
      ) {
        return {
          compatible: false,
          reason: `Không cùng chuẩn RAM (RAM: ${ramType} vs Mainboard hỗ trợ: ${mbRamType})`,
        };
      }
      if (
        selectedCase &&
        mbFormFactor &&
        !isCaseCompatible(selectedCase, mbFormFactor)
      ) {
        return {
          compatible: false,
          reason: `Kích thước mainboard (${mbFormFactor}) không hỗ trợ bởi vỏ máy [${selectedCase.name}]`,
        };
      }
      if (selectedStorage && !isSsdCompatible(selectedStorage, p)) {
        return {
          compatible: false,
          reason: `Bo mạch chủ không có khe cắm M.2 hỗ trợ SSD [${selectedStorage.name}]`,
        };
      }
      if (
        selectedCooler &&
        mbSocket &&
        !isCoolerCompatible(selectedCooler, mbSocket)
      ) {
        return {
          compatible: false,
          reason: `Socket mainboard (${mbSocket}) không hỗ trợ bởi tản nhiệt [${selectedCooler.name}]`,
        };
      }
    }

    if (slotKey === "cpu") {
      const socket = specs.socket;
      if (
        mainboardSocket &&
        socket &&
        mainboardSocket.toLowerCase() !== socket.toLowerCase()
      ) {
        return {
          compatible: false,
          reason: `Không cùng socket với Mainboard (Mainboard: ${mainboardSocket} vs CPU: ${socket})`,
        };
      }
      if (
        selectedCooler &&
        socket &&
        !isCoolerCompatible(selectedCooler, socket)
      ) {
        return {
          compatible: false,
          reason: `Socket CPU (${socket}) không hỗ trợ bởi tản nhiệt [${selectedCooler.name}]`,
        };
      }
    }

    if (slotKey === "ram") {
      const pRamType = specs.ram_type;
      if (
        mainboardRamType &&
        pRamType &&
        mainboardRamType.toLowerCase() !== pRamType.toLowerCase()
      ) {
        return {
          compatible: false,
          reason: `Không cùng chuẩn RAM với Mainboard (Mainboard hỗ trợ: ${mainboardRamType} vs RAM: ${pRamType})`,
        };
      }
    }

    if (slotKey === "case") {
      if (mainboardFormFactor && !isCaseCompatible(p, mainboardFormFactor)) {
        return {
          compatible: false,
          reason: `Vỏ máy không hỗ trợ kích thước mainboard [${selectedMainboard?.name}] (${mainboardFormFactor})`,
        };
      }
    }

    if (slotKey === "storage" || slotKey.startsWith("storage_extra_")) {
      if (selectedMainboard && !isSsdCompatible(p, selectedMainboard)) {
        return {
          compatible: false,
          reason: `Bo mạch chủ [${selectedMainboard.name}] không có khe cắm M.2 NVMe/PCIe`,
        };
      }
      if (slotKey.startsWith("storage_extra_")) {
        const ssdInt = String(specs.interface || "").toLowerCase();
        const ssdType = String(specs.type || "").toLowerCase();
        const isM2 =
          ssdInt.includes("nvme") ||
          ssdInt.includes("m.2") ||
          ssdInt.includes("pcie") ||
          ssdType.includes("m2");
        if (!isM2) {
          return {
            compatible: false,
            reason: `Khe cắm M.2 bổ sung chỉ hỗ trợ ổ cứng chuẩn SSD M.2 NVMe/PCIe`,
          };
        }
      }
    }

    if (slotKey === "cooler") {
      if (cpuSocket && !isCoolerCompatible(p, cpuSocket)) {
        return {
          compatible: false,
          reason: `Tản nhiệt không hỗ trợ socket CPU [${selectedCpu?.name}] (${cpuSocket})`,
        };
      } else if (
        !cpuSocket &&
        mainboardSocket &&
        !isCoolerCompatible(p, mainboardSocket)
      ) {
        return {
          compatible: false,
          reason: `Tản nhiệt không hỗ trợ socket Mainboard [${selectedMainboard?.name}] (${mainboardSocket})`,
        };
      }
    }

    if (slotKey === "psu") {
      const wattage = Number(specs.wattage) || 0;
      if (aiPsuWattage && wattage > 0 && wattage < aiPsuWattage) {
        return {
          compatible: false,
          reason: `Công suất nguồn quá thấp (${wattage}W) so với đề xuất từ AI (${aiPsuWattage}W)`,
        };
      }
      if (!aiPsuWattage && totalTdp > 0 && wattage > 0 && wattage < totalTdp) {
        return {
          compatible: false,
          reason: `Công suất nguồn quá thấp (${wattage}W) so với công suất hệ thống tối thiểu (${totalTdp}W)`,
        };
      }
    }

    return { compatible: true };
  };

  
  const textFiltered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand?.name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  
  const mappedProducts = textFiltered.map((p) => {
    const compat = checkCompatibility(p);
    return {
      product: p,
      compatible: compat.compatible,
      reason: compat.reason,
    };
  });

  
  mappedProducts.sort((a, b) => {
    if (a.compatible && !b.compatible) return -1;
    if (!a.compatible && b.compatible) return 1;
    return 0; 
  });

  const imgSrc = (p: Product) => {
    if (!p.thumbnailUrl) return null;
    return p.thumbnailUrl.startsWith("http")
      ? p.thumbnailUrl
      : `http://localhost:8080${p.thumbnailUrl}`;
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex justify-end">
      {}
      <div
        className="fixed inset-0 bg-slate-900/10 backdrop-blur-[1px] z-30 cursor-pointer"
        onClick={onClose}
      />

      {}
      <div className="relative w-full max-w-[550px] h-full bg-white shadow-2xl border-l border-[#e2e8f0] flex flex-col z-40 animate-in slide-in-from-right duration-200">
        {}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f1f5f9]">
          <div>
            <p className="text-[11px] font-bold text-[#0058be] uppercase tracking-[1.2px]">
              Chọn linh kiện
            </p>
            <h2
              className="text-[20px] font-bold text-[#0f172a] tracking-tight"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
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

        {}
        <div className="px-6 py-4 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[12px] px-4 py-2.5 focus-within:border-[#0058be] transition-colors">
            <Search className="size-4 text-[#94a3b8] shrink-0" />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Tìm ${slotLabel.toLowerCase()}...`}
              className="flex-1 bg-transparent text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-[#94a3b8] hover:text-[#64748b] cursor-pointer"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {}
        <div
          className="flex-1 overflow-y-auto px-4 py-3"
          style={{ scrollbarWidth: "thin" }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-[#0058be]">
              <Loader2 className="size-6 animate-spin" />
              <span className="text-[14px] font-medium text-slate-500">
                Đang tải sản phẩm...
              </span>
            </div>
          ) : mappedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
              <Package className="size-10 mb-3 opacity-30" />
              <p className="text-[14px] font-medium">
                Không tìm thấy sản phẩm phù hợp
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {mappedProducts.map(({ product: p, compatible, reason }) => {
                const src = imgSrc(p);
                const isHovered = hoveredId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelect(p);
                    }}
                    onMouseEnter={() => setHoveredId(p.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`w-full flex flex-col gap-2 p-4 rounded-[16px] border text-left transition-all duration-200 cursor-pointer ${
                      !compatible
                        ? "border-[#fdd8d8] bg-rose-50/20 hover:border-red-300 opacity-80"
                        : isHovered
                          ? "border-[#0058be] bg-[#eff6ff] shadow-sm scale-[1.005]"
                          : "border-[#e8ecf2] bg-white hover:border-[#0058be]"
                    }`}
                  >
                    <div className="w-full flex items-center gap-4">
                      {}
                      <div className="size-[72px] rounded-[12px] bg-[#f7f9fb] flex items-center justify-center shrink-0 overflow-hidden border border-slate-100">
                        {src ? (
                          <img
                            src={src}
                            alt={p.name}
                            className="size-full object-contain p-1"
                          />
                        ) : (
                          <Package className="size-7 text-[#cbd5e1]" />
                        )}
                      </div>

                      {}
                      <div className="flex-1 min-w-0">
                        {p.brand && (
                          <p className="text-[10px] font-bold text-[#0058be] uppercase tracking-[1px] mb-0.5">
                            {p.brand.name}
                          </p>
                        )}
                        <p className="text-[14px] font-semibold text-[#0f172a] leading-snug line-clamp-2">
                          {p.name}
                        </p>
                        <p
                          className={`text-[11px] mt-1 font-medium ${p.stock === 0 ? "text-amber-600 font-semibold" : "text-[#64748b]"}`}
                        >
                          {p.stock === 0
                            ? "Hết hàng (Vẫn cho phép build)"
                            : `Còn ${p.stock} sản phẩm`}
                        </p>
                      </div>

                      {}
                      <div className="text-right shrink-0 flex flex-col items-end gap-2">
                        <p className="text-[16px] font-bold text-[#0058be]">
                          {p.price.toLocaleString("vi-VN")}
                          <span className="text-[11px] font-normal ml-0.5 opacity-70">
                            ₫
                          </span>
                        </p>
                        {isHovered && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#0058be] px-2.5 py-1 rounded-full">
                            <Check className="size-3" /> Chọn
                          </span>
                        )}
                      </div>
                    </div>

                    {}
                    {!compatible && (
                      <div className="w-full mt-1.5 flex items-start gap-1.5 bg-rose-50 border border-rose-100/60 text-rose-700 px-3 py-2 rounded-[10px] text-[11px] font-semibold">
                        <AlertTriangle className="size-3.5 shrink-0 text-red-500 mt-0.5" />
                        <span>Không tương thích: {reason}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {}
        {!loading && (
          <div className="px-6 py-3 border-t border-[#f1f5f9] bg-[#f8fafc]">
            <p className="text-[12px] text-[#94a3b8] font-medium text-center sm:text-left">
              Có {mappedProducts.length} sản phẩm{" "}
              {search ? `phù hợp với "${search}"` : "trong danh mục"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
