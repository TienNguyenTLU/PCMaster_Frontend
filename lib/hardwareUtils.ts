import { LucideIcon } from "lucide-react";
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
import { Product } from "./api";



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
      return `AMD ${ryzenMatch[0]}`;
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

  let supportedList: string[] = [];
  if (Array.isArray(supported)) {
    supportedList = supported.map((s) => String(s));
  } else if (typeof supported === "string") {
    supportedList = supported.split(/[,;\/\n]+/).map((s) => s.trim());
  } else {
    supportedList = [String(supported)];
  }

  return supportedList.some((s) => normalizeFF(s) === cleanMb);
};

export function getProductSpecs(p?: Product | null): Record<string, any> {
  if (!p || !p.specsJson) return {};
  try {
    return JSON.parse(p.specsJson);
  } catch {
    return {};
  }
}

export function isSsdCompatibleWithMb(ssdProduct: Product, mbProduct: Product): boolean {
  const ssdSpecs = getProductSpecs(ssdProduct);
  const mbSpecs = getProductSpecs(mbProduct);
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
}

export function isCoolerCompatibleWithCpu(coolerProd: Product, cpuSocket: string): boolean {
  const coolerSpecs = getProductSpecs(coolerProd);
  const supported =
    coolerSpecs.supported_sockets ||
    coolerSpecs.supported_socket ||
    coolerSpecs.socket;
  if (!supported) return true;

  const cleanSocket = cpuSocket.toLowerCase().replace(/[^a-z0-9]/g, "");

  const isSocketMatch = (supportedSocketStr: string) => {
    const cleanSupported = supportedSocketStr
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    return (
      cleanSupported.includes(cleanSocket) ||
      cleanSocket.includes(cleanSupported)
    );
  };

  if (Array.isArray(supported)) {
    return supported.some((s) => isSocketMatch(String(s)));
  }
  return isSocketMatch(String(supported));
}

