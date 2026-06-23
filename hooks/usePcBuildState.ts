"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Product } from "@/lib/api";
import { useCartManager } from "@/hooks/useCartManager";
import toast from "react-hot-toast";

// ==========================================
// ĐỊNH NGHĨA KIỂU DỮ LIỆU & HẰNG SỐ CỦA SLOT
// ==========================================

export interface SlotDef {
  key: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  required: boolean;
}

export const SLOTS: SlotDef[] = [
  {
    key: "cpu",
    label: "Vi xử lý (CPU)",
    description: "Bộ não của hệ thống",
    Icon: Cpu,
    required: true,
  },
  {
    key: "mainboard",
    label: "Bo mạch chủ",
    description: "Nền tảng kết nối",
    Icon: Folder,
    required: true,
  },
  {
    key: "ram",
    label: "Bộ nhớ RAM",
    description: "Bộ nhớ tạm thời",
    Icon: Layers,
    required: true,
  },
  {
    key: "vga",
    label: "Card đồ họa (GPU)",
    description: "Sức mạnh đồ họa",
    Icon: Tv,
    required: true,
  },
  {
    key: "storage",
    label: "Ổ cứng (SSD/HDD)",
    description: "Lưu trữ dữ liệu",
    Icon: HardDrive,
    required: true,
  },
  {
    key: "psu",
    label: "Nguồn (PSU)",
    description: "Nguồn cấp điện",
    Icon: Zap,
    required: true,
  },
  {
    key: "case",
    label: "Vỏ máy (Case)",
    description: "Khung chứa linh kiện",
    Icon: Box,
    required: true,
  },
  {
    key: "cooler",
    label: "Tản nhiệt CPU",
    description: "Giải nhiệt vi xử lý",
    Icon: Wind,
    required: false,
  },
  {
    key: "monitor",
    label: "Màn hình",
    description: "Thiết bị hiển thị",
    Icon: Monitor,
    required: false,
  },
  {
    key: "fan",
    label: "Quạt case",
    description: "Thông gió trong thùng",
    Icon: Fan,
    required: false,
  },
];

export type BuildState = Record<string, Product | null>;

// ==========================================
// CÁC HÀM TRỢ GIÚP PHÂN TÍCH THÔNG TIN PHẦN CỨNG
// ==========================================

export function normalizeHardwareName(name: string, type: "cpu" | "gpu"): string {
  if (!name) return "";
  let cleanName = name.trim();
  const commonPrefixes = [
    "card màn hình",
    "card đồ họa",
    "card do hoa",
    "vga",
    "graphics card",
    "gpu",
    "vi xử lý",
    "vi xu ly",
    "cpu",
    "processor",
    "bộ vi xử lý",
    "bo vi xu ly",
    "chính hãng",
    "chinh hang",
    "box",
  ];
  commonPrefixes.forEach((prefix) => {
    const regex = new RegExp(`(^|\\b)${prefix}(\\b|\\s|\\-|\\:)`, "gi");
    cleanName = cleanName.replace(regex, " ");
  });
  cleanName = cleanName.replace(/\s+/g, " ").trim();
  if (type === "cpu") {
    const intelMatch = cleanName.match(/i\d[- ]\d+\w*/i);
    const ryzenMatch =
      cleanName.match(/ryzen[- ]\d[- ]\d+\w*/i) ||
      cleanName.match(/ryzen[- ]\d\s+\d+\w*/i);
    if (ryzenMatch) {
      return `AMD Ryzen ${ryzenMatch[0].replace(/ryzen[- ]/i, "")}`;
    }
    if (intelMatch) {
      return `Intel Core ${intelMatch[0]}`;
    }
  }
  if (type === "gpu") {
    const rtxMatch = cleanName.match(
      /(rtx|gtx|gt)\s*\d+\s*(ti super|ti|super)?/i,
    );
    const rxMatch = cleanName.match(/(rx)\s*\d+\s*(xt)?/i);
    if (rtxMatch) {
      return `NVIDIA GeForce ${rtxMatch[0].toUpperCase()}`;
    }
    if (rxMatch) {
      return `AMD Radeon ${rxMatch[0].toUpperCase()}`;
    }
  }
  return cleanName;
}

export function getRamCapacityAndBus(ramProduct: Product | null) {
  let capacity = 16;
  let busSpeed = 3200;
  if (!ramProduct) return { capacity, busSpeed };
  let specs: any = {};
  if (ramProduct.specsJson) {
    try {
      specs = JSON.parse(ramProduct.specsJson);
    } catch {
      specs = {};
    }
  }
  if (specs.capacity) {
    const capMatch = String(specs.capacity).match(/(\d+)\s*GB/i);
    if (capMatch) capacity = parseInt(capMatch[1], 10);
  }
  if (specs.bus_speed || specs.speed) {
    const speedStr = String(specs.bus_speed || specs.speed);
    const speedMatch =
      speedStr.match(/(\d+)\s*MHz/i) || speedStr.match(/(\d+)/);
    if (speedMatch) busSpeed = parseInt(speedMatch[1], 10);
  }
  const name = ramProduct.name;
  const xPattern = name.match(/(\d+)\s*GB\s*[xX]\s*(\d+)/i);
  const xPattern2 = name.match(/(\d+)\s*[xX]\s*(\d+)\s*GB/i);
  if (xPattern) {
    capacity = parseInt(xPattern[1], 10) * parseInt(xPattern[2], 10);
  } else if (xPattern2) {
    capacity = parseInt(xPattern2[1], 10) * parseInt(xPattern2[2], 10);
  } else {
    const gbMatch = name.match(/(\d+)\s*GB/i);
    if (gbMatch) capacity = parseInt(gbMatch[1], 10);
  }
  const mhzMatch = name.match(/(\d+)\s*MHz/i);
  if (mhzMatch) {
    busSpeed = parseInt(mhzMatch[1], 10);
  } else {
    const numMatch = name.match(
      /\b(2400|2666|3000|3200|3600|4800|5200|5600|6000|6400)\b/,
    );
    if (numMatch) busSpeed = parseInt(numMatch[1], 10);
  }
  return { capacity, busSpeed };
}

export const normalizeFF = (ff: string): string => {
  const clean = ff.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (clean === "matx" || clean === "microatx" || clean === "m-atx")
    return "microatx";
  if (clean === "itx" || clean === "miniitx") return "miniitx";
  if (clean === "eatx" || clean === "extendedatx") return "eatx";
  return clean;
};

export const isCaseCompatibleWithMb = (
  caseProduct: Product,
  mbFormFactorStr: string,
): boolean => {
  if (!caseProduct || !mbFormFactorStr) return true;
  let specs: any = {};
  if (caseProduct.specsJson) {
    try {
      specs = JSON.parse(caseProduct.specsJson);
    } catch {
      specs = {};
    }
  }
  const supported =
    specs.supported_mainboards || specs.h_tr_main || specs.supported_mb;
  if (!supported) return true;
  const cleanMb = normalizeFF(mbFormFactorStr);
  const isSupportedStrMatch = (supportedStr: string) => {
    const cleanSupported = normalizeFF(supportedStr);
    if (cleanSupported.includes(cleanMb) || cleanMb.includes(cleanSupported))
      return true;
    if (
      cleanSupported === "eatx" &&
      ["eatx", "atx", "microatx", "miniitx"].includes(cleanMb)
    )
      return true;
    if (
      cleanSupported === "atx" &&
      ["atx", "microatx", "miniitx"].includes(cleanMb)
    )
      return true;
    if (
      cleanSupported === "microatx" &&
      ["microatx", "miniitx"].includes(cleanMb)
    )
      return true;
    if (cleanSupported === "miniitx" && cleanMb === "miniitx") return true;
    return false;
  };
  if (Array.isArray(supported)) {
    return supported.some((s) => isSupportedStrMatch(String(s)));
  }
  return isSupportedStrMatch(String(supported));
};

// ==========================================
// HOOK CHÍNH: QUẢN LÝ TRẠNG THÁI LẮP RÁP PC
// ==========================================

export function usePcBuildState(cpuAdvice: string | null = null) {
  const { handleAddToCart } = useCartManager();

  // Khởi tạo các state
  const [build, setBuild] = useState<BuildState>(
    Object.fromEntries(SLOTS.map((s) => [s.key, null])),
  );
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<{
    slotKey: string;
    product: Product;
    incompatibleSlots: string[];
  } | null>(null);

  const getProductSpecs = (p?: Product | null) => {
    if (!p || !p.specsJson) return {};
    try {
      return JSON.parse(p.specsJson);
    } catch {
      return {};
    }
  };

  // Khởi tạo động các khe cắm ổ cứng M.2 dựa trên Mainboard
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
  const selectedCount = allSlots.filter((s) => !!build[s.key]).length;
  const totalPrice = Object.values(build).reduce(
    (sum, p) => sum + (p?.price ?? 0),
    0,
  );

  // Đồng bộ xóa bỏ ổ cứng extra khi đổi Mainboard có ít khe hơn
  useEffect(() => {
    const mbSpecsObj = build.mainboard ? getProductSpecs(build.mainboard) : {};
    const currentM2Slots = Number(mbSpecsObj.m2_slots) || 0;
    let hasChanges = false;
    const newBuild = { ...build };
    Object.keys(build).forEach((key) => {
      if (key.startsWith("storage_extra_")) {
        const index = parseInt(key.replace("storage_extra_", ""), 10);
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

  // Xử lý chọn linh kiện và kiểm tra xung đột phần cứng
  const handleSelect = (slotKey: string, product: Product) => {
    const specs = getProductSpecs(product);
    const incompatibleSlots: string[] = [];
    const getSpecs = (p: Product | null) => {
      if (!p || !p.specsJson) return {};
      try {
        return JSON.parse(p.specsJson);
      } catch {
        return {};
      }
    };
    const isCaseCompatible = (caseProd: Product, mbFormFactor: string) => {
      const caseSpecs = getSpecs(caseProd);
      const supported = caseSpecs.supported_mainboards || caseSpecs.h_tr_main;
      if (!supported) return true;
      if (Array.isArray(supported)) {
        return supported
          .map((s) => String(s).toLowerCase())
          .includes(mbFormFactor.toLowerCase());
      }
      return String(supported)
        .toLowerCase()
        .includes(mbFormFactor.toLowerCase());
    };
    const isSsdCompatible = (ssdProd: Product, mbProd: Product) => {
      const ssdSpecs = getSpecs(ssdProd);
      const mbSpecs = getSpecs(mbProd);
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
      const coolerSpecs = getSpecs(coolerProd);
      const supported = coolerSpecs.supported_sockets;
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

    const currentCpu = build.cpu;
    const currentMainboard = build.mainboard;
    const currentRam = build.ram;
    const currentCase = build.case;
    const currentStorage = build.storage;
    const currentCooler = build.cooler;

    const cpuSocket = getSpecs(currentCpu).socket;
    const mainboardSocket = getSpecs(currentMainboard).socket;
    const mainboardRamType = getSpecs(currentMainboard).ram_type;
    const ramType = getSpecs(currentRam).ram_type;
    const mainboardFormFactor = getSpecs(currentMainboard).form_factor;

    // Kiểm tra socket CPU vs Mainboard & Cooler
    if (slotKey === "cpu") {
      const socket = specs.socket;
      if (
        currentMainboard &&
        mainboardSocket &&
        socket &&
        mainboardSocket.toLowerCase() !== socket.toLowerCase()
      ) {
        incompatibleSlots.push("mainboard");
      }
      if (
        currentCooler &&
        socket &&
        !isCoolerCompatible(currentCooler, socket)
      ) {
        incompatibleSlots.push("cooler");
      }
    }
    // Kiểm tra Mainboard vs CPU, RAM, Case, SSD, Cooler
    if (slotKey === "mainboard") {
      const mbSocket = specs.socket;
      const mbRamType = specs.ram_type;
      const mbFormFactor = specs.form_factor;
      if (
        currentCpu &&
        cpuSocket &&
        mbSocket &&
        cpuSocket.toLowerCase() !== mbSocket.toLowerCase()
      ) {
        incompatibleSlots.push("cpu");
      }
      if (
        currentRam &&
        ramType &&
        mbRamType &&
        ramType.toLowerCase() !== mbRamType.toLowerCase()
      ) {
        incompatibleSlots.push("ram");
      }
      if (
        currentCase &&
        mbFormFactor &&
        !isCaseCompatible(currentCase, mbFormFactor)
      ) {
        incompatibleSlots.push("case");
      }
      if (currentStorage && !isSsdCompatible(currentStorage, product)) {
        incompatibleSlots.push("storage");
      }
      if (
        currentCooler &&
        mbSocket &&
        !isCoolerCompatible(currentCooler, mbSocket)
      ) {
        incompatibleSlots.push("cooler");
      }
    }
    // Kiểm tra chuẩn RAM vs Mainboard
    if (slotKey === "ram") {
      const pRamType = specs.ram_type;
      if (
        currentMainboard &&
        mainboardRamType &&
        pRamType &&
        mainboardRamType.toLowerCase() !== pRamType.toLowerCase()
      ) {
        incompatibleSlots.push("mainboard");
      }
    }
    // Kiểm tra Case vs Mainboard
    if (slotKey === "case") {
      if (
        currentMainboard &&
        mainboardFormFactor &&
        !isCaseCompatible(product, mainboardFormFactor)
      ) {
        incompatibleSlots.push("mainboard");
      }
    }
    // Kiểm tra SSD vs Mainboard
    if (slotKey === "storage" || slotKey.startsWith("storage_extra_")) {
      if (currentMainboard && !isSsdCompatible(product, currentMainboard)) {
        incompatibleSlots.push("mainboard");
      }
    }
    // Kiểm tra Cooler vs CPU & Mainboard
    if (slotKey === "cooler") {
      if (currentCpu && cpuSocket && !isCoolerCompatible(product, cpuSocket)) {
        incompatibleSlots.push("cpu");
      } else if (
        !currentCpu &&
        currentMainboard &&
        mainboardSocket &&
        !isCoolerCompatible(product, mainboardSocket)
      ) {
        incompatibleSlots.push("mainboard");
      }
    }

    if (incompatibleSlots.length > 0) {
      setPendingSelection({ slotKey, product, incompatibleSlots });
      setShowConfirmModal(true);
      return;
    }
    setBuild((prev) => {
      const nextBuild = { ...prev, [slotKey]: product };
      incompatibleSlots.forEach((s) => {
        nextBuild[s] = null;
      });
      return nextBuild;
    });
    toast.success(`Đã chọn linh kiện: ${product.name}`);
    setActiveSlot(null);
  };

  // Xác nhận thay thế các linh kiện xung đột
  const confirmPendingSelection = () => {
    if (!pendingSelection) return;
    const { slotKey, product, incompatibleSlots } = pendingSelection;
    setBuild((prev) => {
      const nextBuild = { ...prev, [slotKey]: product };
      incompatibleSlots.forEach((s) => {
        nextBuild[s] = null;
      });
      return nextBuild;
    });
    toast.success(`Đã chọn linh kiện: ${product.name}`);
    setShowConfirmModal(false);
    setPendingSelection(null);
    setActiveSlot(null);
  };

  const cancelPendingSelection = () => {
    setShowConfirmModal(false);
    setPendingSelection(null);
  };

  // Xóa linh kiện khỏi giỏ build
  const handleRemove = (slotKey: string) => {
    setBuild((prev) => ({ ...prev, [slotKey]: null }));
  };

  // Đặt lại toàn bộ cấu hình
  const handleReset = () => {
    setBuild(Object.fromEntries(SLOTS.map((s) => [s.key, null])));
    toast.success("Đã đặt lại cấu hình!");
  };

  // Thêm tất cả linh kiện đã chọn vào giỏ hàng thực tế
  const handleAddAllToCart = async () => {
    const selected = Object.values(build).filter((p): p is Product => !!p);
    if (selected.length === 0) {
      toast.error("Chưa có linh kiện nào được chọn!");
      return;
    }
    setAddingToCart(true);
    let failed = 0;
    for (const product of selected) {
      const success = await handleAddToCart(Number(product.id), 1, false);
      if (!success) failed++;
    }
    setAddingToCart(false);
    if (failed === 0) {
      toast.success(`Đã thêm ${selected.length} linh kiện vào giỏ hàng!`);
    } else if (failed < selected.length) {
      toast.error(
        `Thêm thành công ${selected.length - failed}/${selected.length} linh kiện. Có ${failed} linh kiện lỗi.`
      );
    } else {
      toast.error("Tất cả linh kiện đều không thể thêm vào giỏ hàng.");
    }
  };

  // Lấy các ghi chú cảnh báo tương thích phần cứng tổng thể
  const getCompatibilityNotes = (): {
    type: "info" | "warning";
    text: string;
  }[] => {
    const notes: { type: "info" | "warning"; text: string }[] = [];
    const cpu = build.cpu;
    const mb = build.mainboard;
    const ram = build.ram;
    const caseProd = build.case;

    const cpuSpecs = getProductSpecs(cpu);
    const mbSpecs = getProductSpecs(mb);
    const ramSpecs = getProductSpecs(ram);

    const cpuSocket = cpuSpecs.socket;
    const mbSocket = mbSpecs.socket;
    const mbRamType = mbSpecs.ram_type;
    const ramType = ramSpecs.ram_type;
    const mbFormFactor = mbSpecs.form_factor;

    if (cpu && cpuSocket) {
      if (!mb) {
        notes.push({
          type: "info",
          text: `Bạn cần chọn bo mạch chủ (Mainboard) hỗ trợ socket ${cpuSocket} để tương thích với vi xử lý [${cpu.name}].`,
        });
      } else if (mbSocket && mbSocket !== cpuSocket) {
        notes.push({
          type: "warning",
          text: `⚠️ Vi xử lý [${cpu.name}] (Socket ${cpuSocket}) không tương thích với bo mạch chủ [${mb.name}] (Socket ${mbSocket}).`,
        });
      }
    }
    if (mb) {
      if (mbSocket && !cpu) {
        notes.push({
          type: "info",
          text: `Bạn cần chọn vi xử lý (CPU) hỗ trợ socket ${mbSocket} để lắp ráp vào bo mạch chủ [${mb.name}].`,
        });
      }
      if (mbRamType && !ram) {
        notes.push({
          type: "info",
          text: `Bạn cần chọn bộ nhớ RAM chuẩn ${mbRamType} để tương thích với bo mạch chủ [${mb.name}].`,
        });
      } else if (ramType && mbRamType !== ramType) {
        notes.push({
          type: "warning",
          text: `⚠️ Bo mạch chủ [${mb.name}] (Hỗ trợ RAM ${mbRamType}) không tương thích với bộ nhớ RAM [${ram?.name || "RAM"}] (Chuẩn RAM ${ramType}).`,
        });
      }
      if (mbFormFactor && !caseProd) {
        notes.push({
          type: "info",
          text: `Bạn cần chọn vỏ máy (Case) hỗ trợ kích thước ${mbFormFactor} cho bo mạch chủ [${mb.name}].`,
        });
      } else if (mbFormFactor && caseProd) {
        const isCompatible = isCaseCompatibleWithMb(caseProd, mbFormFactor);
        if (!isCompatible) {
          notes.push({
            type: "warning",
            text: `⚠️ Bo mạch chủ [${mb.name}] (Kích cỡ ${mbFormFactor}) quá lớn hoặc không vừa với vỏ máy [${caseProd.name}].`,
          });
        }
      }
    }
    if (ram && ramType && !mb) {
      notes.push({
        type: "info",
        text: `Bạn cần chọn bo mạch chủ hỗ trợ chuẩn bộ nhớ ${ramType} cho thanh RAM [${ram.name}].`,
      });
    }
    if (cpuAdvice) {
      notes.push({
        type: "info",
        text: `🤖 Gợi ý từ AI: ${cpuAdvice}`,
      });
    }
    return notes;
  };

  const compatNotes = getCompatibilityNotes();
  const showCompatNotes =
    compatNotes.length > 0 &&
    (!build.mainboard || compatNotes.some((note) => note.type === "warning"));

  return {
    build,
    setBuild,
    activeSlot,
    setActiveSlot,
    addingToCart,
    setAddingToCart,
    showConfirmModal,
    setShowConfirmModal,
    pendingSelection,
    setPendingSelection,
    extraStorageSlots,
    allSlots,
    selectedCount,
    totalPrice,
    compatNotes,
    showCompatNotes,
    handleSelect,
    confirmPendingSelection,
    cancelPendingSelection,
    handleRemove,
    handleReset,
    handleAddAllToCart,
  };
}
