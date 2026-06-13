"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
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
  RotateCcw,
  FolderOpen,
  Calendar,
  Save,
  Trash2,
  Heart,
  Plus,
  X,
  Sparkles,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import {
  Product,
  buildAPI,
  adminAPI,
  PcBuildResponse,
  aiBuildAPI,
  chatbotAPI,
} from "@/lib/api";
import { useCartStore, useAuthStore } from "@/lib/store";
import BuildSlot from "./BuildSlot";
import BuildPickerModal from "./BuildPickerModal";
import toast from "react-hot-toast";

// Subcomponents
import SummaryPanel from "./SummaryPanel";
import BottleneckReport from "./BottleneckReport";
import SmartBuildDropdown from "./SmartBuildDropdown";
import MyBuildsList from "./MyBuildsList";
import SaveBuildModal from "./SaveBuildModal";
import ConfirmSelectionModal from "./ConfirmSelectionModal";
import DeleteBuildModal from "./DeleteBuildModal";

// ─── Slot definitions ────────────────────────────────────────────────────────

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

function normalizeHardwareName(name: string, type: "cpu" | "gpu"): string {
  if (!name) return "";
  let cleanName = name.trim();

  // Generic terms to remove case-insensitively
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

  let lowerName = cleanName.toLowerCase();

  // Remove common prefixes/words
  commonPrefixes.forEach((prefix) => {
    const regex = new RegExp(`(^|\\b)${prefix}(\\b|\\s|\\-|\\:)`, "gi");
    cleanName = cleanName.replace(regex, " ");
  });

  // Clean up extra spaces
  cleanName = cleanName.replace(/\s+/g, " ").trim();

  // Specific regex mapping for CPU
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

  // Specific regex mapping for GPU
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

function getRamCapacityAndBus(ramProduct: Product | null) {
  let capacity = 16; // default fallback
  let busSpeed = 3200; // default fallback

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

// ─── Main Component ──────────────────────────────────────────────────────────

export default function BuildPage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [build, setBuild] = useState<BuildState>(
    Object.fromEntries(SLOTS.map((s) => [s.key, null])),
  );
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addItem } = useCartStore();

  // Smart Build AI States
  const [showSmartBuildDropdown, setShowSmartBuildDropdown] = useState(false);
  const [smartBuildNeed, setSmartBuildNeed] = useState("gaming");
  const [smartBuildBudget, setSmartBuildBudget] = useState("20-30");
  const [isGeneratingSmartBuild, setIsGeneratingSmartBuild] = useState(false);
  const [smartBuildStatus, setSmartBuildStatus] = useState<string | null>(null);
  const [aiBuildNote, setAiBuildNote] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSmartBuildDropdown(false);
      }
    };
    if (showSmartBuildDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSmartBuildDropdown]);

  const handleSmartBuildSubmit = async () => {
    setIsGeneratingSmartBuild(true);
    setAiBuildNote(null);
    setSmartBuildStatus("Đang khởi tạo cấu hình...");

    const needsMap: Record<string, string> = {
      gaming: "Chơi game (Gaming)",
      graphics: "Thiết kế đồ họa & 3D",
      study: "Học tập & Giải trí",
      office: "Văn phòng / Work",
    };

    const budgetMap: Record<string, string> = {
      "under-10": "Dưới 10 triệu",
      "10-15": "10 - 15 triệu",
      "15-20": "15 - 20 triệu",
      "20-30": "20 - 30 triệu",
      "30-50": "30 - 50 triệu",
      "over-50": "Trên 50 triệu",
    };

    const selectedNeed = needsMap[smartBuildNeed] || smartBuildNeed;
    const selectedBudget = budgetMap[smartBuildBudget] || smartBuildBudget;

    try {
      // Step 1: Fetch all categories
      setSmartBuildStatus("Đang tải thông tin danh mục linh kiện...");
      await new Promise((resolve) => setTimeout(resolve, 300));
      const categoriesResponse = await adminAPI.getCategories(0, 100);
      const categories = categoriesResponse.content || [];

      const findIdBySlug = (slug: string) => {
        const cat = categories.find(
          (c) =>
            c.slug?.toLowerCase() === slug.toLowerCase() ||
            c.name.toLowerCase().includes(slug.toLowerCase()),
        );
        return cat ? cat.id : null;
      };

      const cpuId = findIdBySlug("cpu");
      const mainboardId = findIdBySlug("mainboard");
      const ramId = findIdBySlug("ram");
      const vgaId = findIdBySlug("vga");
      const storageId = findIdBySlug("ssd") || findIdBySlug("storage");
      const psuId = findIdBySlug("psu");
      const caseId = findIdBySlug("case");
      const coolerId = findIdBySlug("cooler");
      const monitorId = findIdBySlug("monitor");
      const fanId = findIdBySlug("fan");

      // Step 2: Fetch products for all required categories in parallel
      setSmartBuildStatus(
        "Đang tải danh sách linh kiện khả dụng từ cửa hàng...",
      );
      await new Promise((resolve) => setTimeout(resolve, 300));
      const [
        cpuRes,
        mbRes,
        ramRes,
        vgaRes,
        storageRes,
        psuRes,
        caseRes,
        coolerRes,
        monitorRes,
        fanRes,
      ] = await Promise.all([
        cpuId
          ? adminAPI.getProducts(0, 100, undefined, cpuId.toString())
          : Promise.resolve({ content: [] }),
        mainboardId
          ? adminAPI.getProducts(0, 100, undefined, mainboardId.toString())
          : Promise.resolve({ content: [] }),
        ramId
          ? adminAPI.getProducts(0, 100, undefined, ramId.toString())
          : Promise.resolve({ content: [] }),
        vgaId
          ? adminAPI.getProducts(0, 100, undefined, vgaId.toString())
          : Promise.resolve({ content: [] }),
        storageId
          ? adminAPI.getProducts(0, 100, undefined, storageId.toString())
          : Promise.resolve({ content: [] }),
        psuId
          ? adminAPI.getProducts(0, 100, undefined, psuId.toString())
          : Promise.resolve({ content: [] }),
        caseId
          ? adminAPI.getProducts(0, 100, undefined, caseId.toString())
          : Promise.resolve({ content: [] }),
        coolerId
          ? adminAPI.getProducts(0, 100, undefined, coolerId.toString())
          : Promise.resolve({ content: [] }),
        monitorId
          ? adminAPI.getProducts(0, 100, undefined, monitorId.toString())
          : Promise.resolve({ content: [] }),
        fanId
          ? adminAPI.getProducts(0, 100, undefined, fanId.toString())
          : Promise.resolve({ content: [] }),
      ]);

      const cpus = (cpuRes.content || []).filter((p: any) => p.stock > 0);
      const mainboards = (mbRes.content || []).filter((p: any) => p.stock > 0);
      const rams = (ramRes.content || []).filter((p: any) => p.stock > 0);
      const vgas = (vgaRes.content || []).filter((p: any) => p.stock > 0);
      const storages = (storageRes.content || []).filter(
        (p: any) => p.stock > 0,
      );
      const psus = (psuRes.content || []).filter((p: any) => p.stock > 0);
      const cases = (caseRes.content || []).filter((p: any) => p.stock > 0);
      const coolers = (coolerRes.content || []).filter((p: any) => p.stock > 0);
      const monitors = (monitorRes.content || []).filter(
        (p: any) => p.stock > 0,
      );
      const fans = (fanRes.content || []).filter((p: any) => p.stock > 0);

      if (cpus.length === 0 || mainboards.length === 0 || rams.length === 0) {
        toast.error(
          "Cửa hàng không đủ linh kiện cốt lõi (CPU, Mainboard, RAM) để tự động xây dựng cấu hình!",
        );
        setIsGeneratingSmartBuild(false);
        setSmartBuildStatus(null);
        return;
      }

      // Step 3: Determine budget allocations
      setSmartBuildStatus("Đang cân đối ngân sách cho từng linh kiện...");
      await new Promise((resolve) => setTimeout(resolve, 300));
      let targetBudget = 25000000;
      if (smartBuildBudget === "under-10") targetBudget = 9000000;
      else if (smartBuildBudget === "10-15") targetBudget = 13000000;
      else if (smartBuildBudget === "15-20") targetBudget = 18000000;
      else if (smartBuildBudget === "20-30") targetBudget = 25000000;
      else if (smartBuildBudget === "30-50") targetBudget = 40000000;
      else if (smartBuildBudget === "over-50") targetBudget = 60000000;

      const isGamingOrGraphics =
        smartBuildNeed === "gaming" || smartBuildNeed === "graphics";

      const cpuShare = isGamingOrGraphics ? 0.2 : 0.28;
      const mbShare = isGamingOrGraphics ? 0.12 : 0.16;
      const ramShare = isGamingOrGraphics ? 0.08 : 0.1;
      const vgaShare = isGamingOrGraphics ? 0.35 : 0.12;

      const cpuBudget = targetBudget * cpuShare;
      const mbBudget = targetBudget * mbShare;
      const ramBudget = targetBudget * ramShare;
      const vgaBudget = targetBudget * vgaShare;

      // Helper to parse specs
      const getSpecs = (p: Product) => {
        if (!p || !p.specsJson) return {};
        try {
          return JSON.parse(p.specsJson);
        } catch {
          return {};
        }
      };

      // Helper to check static bottleneck heuristics
      const checkStaticBottleneck = (
        cpuName: string,
        gpuName: string,
      ): number => {
        const cpuL = cpuName.toLowerCase();
        const gpuL = gpuName.toLowerCase();

        const isCpuH =
          cpuL.includes("i9") ||
          cpuL.includes("ryzen 9") ||
          cpuL.includes("9900") ||
          cpuL.includes("9950") ||
          cpuL.includes("14900") ||
          cpuL.includes("13900") ||
          cpuL.includes("7900") ||
          cpuL.includes("7950");
        const isCpuM =
          cpuL.includes("i7") ||
          cpuL.includes("ryzen 7") ||
          cpuL.includes("14700") ||
          cpuL.includes("13700") ||
          cpuL.includes("7700") ||
          cpuL.includes("7800") ||
          cpuL.includes("9700") ||
          cpuL.includes("i5") ||
          cpuL.includes("ryzen 5") ||
          cpuL.includes("14600") ||
          cpuL.includes("13600") ||
          cpuL.includes("7600");

        const isGpuH =
          gpuL.includes("4090") ||
          gpuL.includes("4080") ||
          gpuL.includes("3090") ||
          gpuL.includes("3080") ||
          gpuL.includes("7900");
        const isGpuM =
          gpuL.includes("4070") ||
          gpuL.includes("3070") ||
          gpuL.includes("7800") ||
          gpuL.includes("7700") ||
          gpuL.includes("4060") ||
          gpuL.includes("3060") ||
          gpuL.includes("7600");

        if (isCpuH && !isGpuH && !isGpuM) return 2; // GPU bottleneck (CPU is too strong for GPU)
        if (!isCpuH && !isCpuM && isGpuH) return 1; // CPU bottleneck (GPU is too strong for CPU)
        if (!isCpuH && !isCpuM && isGpuM) return 1; // CPU bottleneck (GPU is too strong for CPU)
        return 0; // Balanced
      };

      // Helper to query bottleneck from API or static
      const queryBottleneck = async (
        cpu: Product,
        gpu: Product,
        ram: Product,
      ): Promise<number> => {
        const cpuName = normalizeHardwareName(cpu.name, "cpu");
        const gpuName = normalizeHardwareName(gpu.name, "gpu");
        const { capacity: ramCapacity, busSpeed: ramBusSpeed } =
          getRamCapacityAndBus(ram);

        try {
          const response = await fetch("http://localhost:5000/api/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cpu_name: cpuName,
              gpu_name: gpuName,
              ram_capacity: ramCapacity,
              ram_bus_speed: ramBusSpeed,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            if (
              data &&
              data.success &&
              data.predictions &&
              data.predictions.length > 0
            ) {
              const pred1080 = data.predictions.find(
                (p: any) => p.resolution === "1080",
              );
              if (pred1080) return Number(pred1080.predicted_type);
            }
          }
        } catch (err) {
          console.error(
            "Bottleneck ML predict failed during smart build:",
            err,
          );
        }

        return checkStaticBottleneck(cpu.name, gpu.name);
      };

      // Step 4: Sort candidates by price ascending
      const sortedCpus = [...cpus].sort((a, b) => a.price - b.price);
      const sortedMbs = [...mainboards].sort((a, b) => a.price - b.price);
      const sortedRams = [...rams].sort((a, b) => a.price - b.price);
      const sortedVgas = [...vgas].sort((a, b) => a.price - b.price);

      // Helper to find index of product closest to a target price
      const findClosestIndex = (
        arr: Product[],
        targetPrice: number,
      ): number => {
        let closestIdx = 0;
        let minDiff = Infinity;
        for (let i = 0; i < arr.length; i++) {
          const diff = Math.abs(arr[i].price - targetPrice);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = i;
          }
        }
        return closestIdx;
      };

      // Helper to find CPU and a compatible Mainboard closest to targets
      const findCompatibleCpuAndMainboard = (
        startCpuIdx: number,
        targetMbBudget: number,
      ): { cpu: Product; mb: Product; cpuIdx: number } | null => {
        let queue: number[] = [startCpuIdx];
        let visited = new Set<number>();
        visited.add(startCpuIdx);

        let offset = 1;
        while (visited.size < sortedCpus.length) {
          const left = startCpuIdx - offset;
          const right = startCpuIdx + offset;
          if (left >= 0 && !visited.has(left)) {
            queue.push(left);
            visited.add(left);
          }
          if (right < sortedCpus.length && !visited.has(right)) {
            queue.push(right);
            visited.add(right);
          }
          offset++;
        }

        for (const idx of queue) {
          const cpu = sortedCpus[idx];
          const cpuSocket = getSpecs(cpu).socket;
          if (!cpuSocket) continue;

          const compatibleMbs = sortedMbs.filter((mb) => {
            const mbSocket = getSpecs(mb).socket;
            return (
              mbSocket && mbSocket.toLowerCase() === cpuSocket.toLowerCase()
            );
          });

          if (compatibleMbs.length > 0) {
            const bestMb = [...compatibleMbs].sort(
              (a, b) =>
                Math.abs(a.price - targetMbBudget) -
                Math.abs(b.price - targetMbBudget),
            )[0];
            return { cpu, mb: bestMb, cpuIdx: idx };
          }
        }
        return null;
      };

      // Find compatible RAM matching motherboard RAM type
      const getCompatibleRam = (
        mbProduct: Product,
        targetRamBudget: number,
      ): Product | null => {
        const mbRamType = getSpecs(mbProduct).ram_type || "DDR4";
        const compatibleRams = sortedRams.filter((ram) => {
          const ramType = getSpecs(ram).ram_type;
          return ramType && ramType.toLowerCase() === mbRamType.toLowerCase();
        });
        if (compatibleRams.length === 0) return null;
        return [...compatibleRams].sort(
          (a, b) =>
            Math.abs(a.price - targetRamBudget) -
            Math.abs(b.price - targetRamBudget),
        )[0];
      };

      // Core selections setup
      setSmartBuildStatus(
        "Đang ghép nối CPU và Mainboard tương thích socket...",
      );
      await new Promise((resolve) => setTimeout(resolve, 400));
      let currentCpuIdx = findClosestIndex(sortedCpus, cpuBudget);
      const initialCore = findCompatibleCpuAndMainboard(
        currentCpuIdx,
        mbBudget,
      );
      if (!initialCore) {
        toast.error(
          "Không tìm thấy tổ hợp CPU + Mainboard tương thích nào trong cửa hàng!",
        );
        setIsGeneratingSmartBuild(false);
        setSmartBuildStatus(null);
        return;
      }

      let currCpu = initialCore.cpu;
      let currMb = initialCore.mb;
      currentCpuIdx = initialCore.cpuIdx;

      setSmartBuildStatus(
        `Đã khớp CPU [${currCpu.name}] với Mainboard [${currMb.name}]. Đang chọn RAM & VGA...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 400));
      let currRam = getCompatibleRam(currMb, ramBudget);
      if (!currRam && sortedRams.length > 0) {
        currRam = [...sortedRams].sort(
          (a, b) =>
            Math.abs(a.price - ramBudget) - Math.abs(b.price - ramBudget),
        )[0];
      }

      let currentVgaIdx = findClosestIndex(sortedVgas, vgaBudget);
      let currVga = sortedVgas.length > 0 ? sortedVgas[currentVgaIdx] : null;

      // Iterative Bottleneck Feedback Loop (maximum 6 steps)
      let loopCount = 0;
      const maxIterations = 6;
      let bestConfig = {
        cpu: currCpu,
        mb: currMb,
        ram: currRam,
        vga: currVga,
        bottleneck: 999,
      };
      const triedConfigs = new Set<string>();

      while (loopCount < maxIterations) {
        if (!currCpu || !currRam) break;

        const configKey = `${currCpu.id}-${currMb.id}-${currRam.id}-${currVga ? currVga.id : "none"}`;
        if (triedConfigs.has(configKey)) break;
        triedConfigs.add(configKey);

        setSmartBuildStatus(
          `[Vòng lặp ${loopCount + 1}] Đang kiểm tra bottleneck tương quan hiệu năng...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 350));

        let bottleneckVal = 0;
        if (currVga) {
          bottleneckVal = await queryBottleneck(currCpu, currVga, currRam);
        }

        if (bottleneckVal === 0) {
          setSmartBuildStatus(
            "Cấu hình đã cân bằng tuyệt đối! Không phát hiện nghẽn cổ chai.",
          );
          await new Promise((resolve) => setTimeout(resolve, 300));
          bestConfig = {
            cpu: currCpu,
            mb: currMb,
            ram: currRam,
            vga: currVga,
            bottleneck: 0,
          };
          break; // Balanced!
        }

        if (bestConfig.bottleneck === 999 || bestConfig.bottleneck > 0) {
          bestConfig = {
            cpu: currCpu,
            mb: currMb,
            ram: currRam,
            vga: currVga,
            bottleneck: bottleneckVal,
          };
        }

        // Adjust components based on bottleneck feedback
        if (bottleneckVal === 1 && currVga) {
          // CPU Bottleneck (CPU too weak for VGA): Upgrade CPU or Downgrade VGA
          setSmartBuildStatus(
            "Nghẽn CPU! Đang điều chỉnh cấu hình nâng CPU hoặc hạ VGA...",
          );
          await new Promise((resolve) => setTimeout(resolve, 400));
          if (currentCpuIdx < sortedCpus.length - 1) {
            const newCore = findCompatibleCpuAndMainboard(
              currentCpuIdx + 1,
              mbBudget,
            );
            if (newCore) {
              currCpu = newCore.cpu;
              currMb = newCore.mb;
              currentCpuIdx = newCore.cpuIdx;
              const newRam = getCompatibleRam(currMb, ramBudget);
              if (newRam) currRam = newRam;
            } else {
              currentVgaIdx = Math.max(0, currentVgaIdx - 1);
              currVga = sortedVgas[currentVgaIdx];
            }
          } else {
            currentVgaIdx = Math.max(0, currentVgaIdx - 1);
            currVga = sortedVgas[currentVgaIdx];
          }
        } else if (bottleneckVal === 2 && currVga) {
          // GPU Bottleneck (VGA too weak for CPU): Upgrade VGA or Downgrade CPU
          setSmartBuildStatus(
            "Nghẽn GPU! Đang điều chỉnh cấu hình nâng VGA hoặc hạ CPU...",
          );
          await new Promise((resolve) => setTimeout(resolve, 400));
          if (currentVgaIdx < sortedVgas.length - 1) {
            currentVgaIdx = currentVgaIdx + 1;
            currVga = sortedVgas[currentVgaIdx];
          } else {
            const newCpuIdx = Math.max(0, currentCpuIdx - 1);
            if (newCpuIdx !== currentCpuIdx) {
              const newCore = findCompatibleCpuAndMainboard(
                newCpuIdx,
                mbBudget,
              );
              if (newCore) {
                currCpu = newCore.cpu;
                currMb = newCore.mb;
                currentCpuIdx = newCore.cpuIdx;
                const newRam = getCompatibleRam(currMb, ramBudget);
                if (newRam) currRam = newRam;
              }
            }
          }
        } else if (bottleneckVal === 3) {
          // RAM Bottleneck: Try upgrading RAM
          setSmartBuildStatus(
            "Nghẽn RAM! Đang tìm RAM chất lượng hoặc bus cao hơn...",
          );
          await new Promise((resolve) => setTimeout(resolve, 400));
          const mbRamType = getSpecs(currMb).ram_type || "DDR4";
          const compatibleRams = sortedRams.filter((ram) => {
            const ramType = getSpecs(ram).ram_type;
            return ramType && ramType.toLowerCase() === mbRamType.toLowerCase();
          });
          const currRamIdx = compatibleRams.findIndex(
            (r) => r.id === currRam?.id,
          );
          if (currRamIdx !== -1 && currRamIdx < compatibleRams.length - 1) {
            currRam = compatibleRams[currRamIdx + 1];
          } else {
            break;
          }
        } else {
          break;
        }

        loopCount++;
      }

      const finalCpu = bestConfig.cpu;
      const finalMb = bestConfig.mb;
      const finalRam = bestConfig.ram;
      const finalVga = bestConfig.vga;

      if (!finalCpu || !finalMb || !finalRam) {
        toast.error("Không tìm thấy cấu hình tối thiểu phù hợp!");
        setIsGeneratingSmartBuild(false);
        setSmartBuildStatus(null);
        return;
      }

      // Step 5: Select remaining parts based on the leftover budget
      setSmartBuildStatus(
        "Đang phân bổ các linh kiện phụ (SSD, Vỏ máy, Tản nhiệt)...",
      );
      await new Promise((resolve) => setTimeout(resolve, 400));
      const corePrice =
        finalCpu.price +
        finalMb.price +
        finalRam.price +
        (finalVga ? finalVga.price : 0);
      const leftoverBudget = targetBudget - corePrice;

      // Select PSU using AI recommended PSU API
      setSmartBuildStatus(
        "Đang truy vấn AI để lấy đề xuất công suất PSU tối ưu...",
      );
      let psuWattageNeeded = 500;
      try {
        const psuRec = await aiBuildAPI.getPsuRecommendation(
          finalCpu.name,
          finalVga ? finalVga.name : "None",
          finalRam.name,
        );
        psuWattageNeeded = psuRec.recommendedWattage;
      } catch (err) {
        console.error(
          "Failed to get AI PSU recommendation in smart build, falling back to static calculation:",
          err,
        );
        const cpuTdp = Number(getSpecs(finalCpu).tdp_w) || 100;
        const gpuTdp = finalVga ? Number(getSpecs(finalVga).tdp_w) || 200 : 0;
        psuWattageNeeded = Math.ceil((cpuTdp + gpuTdp + 150) / 50) * 50;
      }

      const compatiblePsus = psus.filter((psu) => {
        const specs = getSpecs(psu);
        const watt = Number(specs.wattage) || Number(specs.watt) || 500;
        return watt >= psuWattageNeeded;
      });
      const selectedPsu =
        compatiblePsus.length > 0
          ? [...compatiblePsus].sort((a, b) => a.price - b.price)[0] // Pick cheapest compatible PSU
          : psus.sort((a, b) => b.price - a.price)[0]; // Fallback to strongest PSU

      // Select Case with Mainboard size compatibility check
      const mbFormFactor = getSpecs(finalMb).form_factor || "ATX";
      const compatibleCases = cases.filter((c) =>
        isCaseCompatibleWithMb(c, mbFormFactor),
      );
      const selectedCase =
        compatibleCases.length > 0
          ? [...compatibleCases].sort((a, b) => a.price - b.price)[0]
          : cases[0];

      // Select Storage (SSD)
      const selectedStorage =
        storages.length > 0
          ? [...storages].sort(
              (a, b) =>
                Math.abs(a.price - leftoverBudget * 0.4) -
                Math.abs(b.price - leftoverBudget * 0.4),
            )[0]
          : null;

      // Select Cooler with supported sockets check & liquid cooler preference for high-end CPU
      const mbSocket = getSpecs(finalMb).socket || "";
      const cpuSocket = getSpecs(finalCpu).socket || mbSocket;
      const compatibleCoolers = coolers.filter((col) => {
        const sockets =
          getSpecs(col).supported_sockets ||
          getSpecs(col).supported_socket ||
          getSpecs(col).socket;
        if (!sockets) return true;

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

        if (Array.isArray(sockets)) {
          return sockets.some((s) => isSocketMatch(String(s)));
        }
        return isSocketMatch(String(sockets));
      });

      // High-end CPU should use liquid cooler (tản nhiệt nước)
      const cpuNameLower = finalCpu.name.toLowerCase();
      const isHighEndCpu =
        cpuNameLower.includes("i9") ||
        cpuNameLower.includes("i7") ||
        cpuNameLower.includes("ryzen 9") ||
        cpuNameLower.includes("ryzen 7") ||
        Number(getSpecs(finalCpu).tdp_w) >= 125;

      const isLiquidCooler = (cooler: Product) => {
        const name = cooler.name.toLowerCase();
        const specs = getSpecs(cooler);
        const type = String(specs.type || specs.loai || "").toLowerCase();
        return (
          name.includes("aio") ||
          name.includes("liquid") ||
          name.includes("water") ||
          name.includes("nước") ||
          name.includes("nuoc") ||
          name.includes("240") ||
          name.includes("360") ||
          type.includes("nước") ||
          type.includes("nuoc") ||
          type.includes("liquid") ||
          type.includes("aio")
        );
      };

      let candidateCoolers = compatibleCoolers;
      if (isHighEndCpu) {
        const liquidCoolers = compatibleCoolers.filter(isLiquidCooler);
        if (liquidCoolers.length > 0) {
          candidateCoolers = liquidCoolers;
        }
      }

      const selectedCooler =
        candidateCoolers.length > 0
          ? [...candidateCoolers].sort((a, b) => a.price - b.price)[0]
          : coolers[0];

      // Populate BuildState
      const newBuild: BuildState = Object.fromEntries(
        SLOTS.map((s) => [s.key, null]),
      );
      newBuild.cpu = finalCpu;
      newBuild.mainboard = finalMb;
      newBuild.ram = finalRam;
      if (finalVga) newBuild.vga = finalVga;
      if (selectedPsu) newBuild.psu = selectedPsu;
      if (selectedCase) newBuild.case = selectedCase;
      if (selectedStorage) newBuild.storage = selectedStorage;
      if (selectedCooler) newBuild.cooler = selectedCooler;

      // Select additional fans/monitors if budget allows
      const finalPriceBeforeOptional = Object.values(newBuild).reduce(
        (sum, p) => sum + (p?.price ?? 0),
        0,
      );
      const leftoverBudgetForOptional = targetBudget - finalPriceBeforeOptional;
      if (leftoverBudgetForOptional > 2000000 && monitors.length > 0) {
        newBuild.monitor = monitors.sort((a, b) => a.price - b.price)[0];
      }
      if (leftoverBudgetForOptional > 300000 && fans.length > 0) {
        newBuild.fan = fans.sort((a, b) => a.price - b.price)[0];
      }

      // Step 6: Final PSU Capacity Check & Swap
      setSmartBuildStatus("Đang kiểm tra công suất nguồn PSU cuối cùng...");
      await new Promise((resolve) => setTimeout(resolve, 500));

      const finalPsuWattageNeeded = psuWattageNeeded; // Use the wattage recommended by AI in Step 5

      const currentPsu = newBuild.psu;
      const currentPsuSpecs = currentPsu ? getSpecs(currentPsu) : {};
      const currentPsuWattage =
        Number(currentPsuSpecs.wattage) || Number(currentPsuSpecs.watt) || 0;

      if (!currentPsu || currentPsuWattage < finalPsuWattageNeeded) {
        setSmartBuildStatus(
          `Công suất nguồn (${currentPsuWattage}W) không đủ! Đang tìm nguồn tối thiểu ${finalPsuWattageNeeded}W...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 800));

        const strongerPsus = psus
          .filter((psu) => {
            const specs = getSpecs(psu);
            const watt = Number(specs.wattage) || Number(specs.watt) || 0;
            return watt >= finalPsuWattageNeeded;
          })
          .sort((a, b) => a.price - b.price);

        if (strongerPsus.length > 0) {
          newBuild.psu = strongerPsus[0];
          setSmartBuildStatus(
            `Đã đổi nguồn sang: ${strongerPsus[0].name} (${Number(getSpecs(strongerPsus[0]).wattage) || Number(getSpecs(strongerPsus[0]).watt)}W)`,
          );
          await new Promise((resolve) => setTimeout(resolve, 600));
        } else {
          setSmartBuildStatus(
            "Không tìm thấy bộ nguồn công suất cao hơn trong kho.",
          );
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      } else {
        setSmartBuildStatus(
          `Nguồn hiện tại đạt yêu cầu: ${currentPsuWattage}W (Cần tối thiểu ${finalPsuWattageNeeded}W)`,
        );
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      setBuild(newBuild);

      // Call chatbot API to generate beautiful expert note for these exact components
      setSmartBuildStatus(
        "Đang gửi cấu hình tới Trợ lý AI để lấy nhận xét chuyên gia...",
      );
      const promptMessage = `Bạn là chuyên gia PCMaster. Tôi đã tự động build cấu hình PC sau:
- CPU: ${finalCpu.name}
- Mainboard: ${finalMb.name}
- RAM: ${finalRam.name}
- VGA: ${finalVga ? finalVga.name : "Chưa chọn"}
- Storage: ${selectedStorage ? selectedStorage.name : "Chưa chọn"}
- Nguồn (PSU): ${newBuild.psu ? newBuild.psu.name : "Chưa chọn"}
- Vỏ máy (Case): ${selectedCase ? selectedCase.name : "Chưa chọn"}

Hãy viết nhận xét ngắn gọn khoảng 3-4 câu bằng tiếng Việt giải thích tại sao cấu hình này cực kỳ phù hợp cho nhu cầu ${selectedNeed} trong tầm giá ${selectedBudget} VNĐ, đảm bảo hiệu năng tối ưu và không bị nghẽn cổ chai.`;

      try {
        const response = await chatbotAPI.chat(promptMessage, [], "consult");
        const advice = response.message;

        // Typewriter streaming effect
        let index = 0;
        setAiBuildNote("");
        const interval = setInterval(() => {
          setAiBuildNote((prev) => (prev || "") + advice.charAt(index));
          index++;
          if (index >= advice.length) {
            clearInterval(interval);
          }
        }, 15);
      } catch {
        const fallbackAdvice = `Cấu hình được chọn tự động dựa trên phân tích tương thích phần cứng: CPU [${finalCpu.name}] đi kèm Bo mạch chủ [${finalMb.name}] và RAM [${finalRam.name}]. Card màn hình [${finalVga ? finalVga.name : "Onboard GPU"}] hoạt động mượt mà không gây nghẽn cổ chai trong phân khúc giá.`;

        let index = 0;
        setAiBuildNote("");
        const interval = setInterval(() => {
          setAiBuildNote((prev) => (prev || "") + fallbackAdvice.charAt(index));
          index++;
          if (index >= fallbackAdvice.length) {
            clearInterval(interval);
          }
        }, 15);
      }

      toast.success("Đã tạo thành công cấu hình thông minh bằng AI!");
      setShowSmartBuildDropdown(false);
    } catch (err) {
      console.error("Failed to run smart build algorithm:", err);
      toast.error("Có lỗi xảy ra khi xây dựng cấu hình AI!");
    } finally {
      setIsGeneratingSmartBuild(false);
      setSmartBuildStatus(null);
    }
  };

  // Tab State
  const [activeTab, setActiveTab] = useState<"builder" | "my-builds">(
    "builder",
  );

  // Custom configuration list
  const [myBuilds, setMyBuilds] = useState<PcBuildResponse[]>([]);
  const [loadingMyBuilds, setLoadingMyBuilds] = useState(false);

  // Bottleneck Predictor State
  const [bottleneckResult, setBottleneckResult] = useState<any>(null);
  const [loadingBottleneck, setLoadingBottleneck] = useState(false);
  const [bottleneckError, setBottleneckError] = useState<string | null>(null);

  // AI Advice States
  const [cpuAdvice, setCpuAdvice] = useState<string | null>(null);
  const [aiPsuWattage, setAiPsuWattage] = useState<number | null>(null);
  const [aiPsuExplanation, setAiPsuExplanation] = useState<string | null>(null);
  const [loadingPsu, setLoadingPsu] = useState(false);

  // Confirmation Modal States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<{
    slotKey: string;
    product: Product;
    incompatibleSlots: string[];
  } | null>(null);

  // Delete Confirmation Modal States
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [pendingDeleteBuildId, setPendingDeleteBuildId] = useState<
    number | null
  >(null);

  // Sync tab query parameter on load
  useEffect(() => {
    if (tabParam === "my-builds") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab("my-builds");
    }
  }, [tabParam]);

  // Load draft from Chatbot AI (localStorage) on mount and on custom event
  useEffect(() => {
    const loadDraft = async () => {
      const draftStr = localStorage.getItem("pcMaster_build_draft");
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          const newBuildUpdates: Record<string, Product> = {};

          for (const slotKey of Object.keys(draft)) {
            const draftItem = draft[slotKey];
            if (draftItem && draftItem.id) {
              try {
                // Fetch full product details so we get specsJson, category, brand, etc.
                const fullProduct = await adminAPI.getProductById(draftItem.id);
                newBuildUpdates[slotKey] = fullProduct;
              } catch (err) {
                console.error(
                  `Failed to fetch full product details for draft item:`,
                  draftItem.id,
                  err,
                );
                // Fallback to the DTO if fetch fails
                newBuildUpdates[slotKey] = draftItem;
              }
            }
          }

          if (Object.keys(newBuildUpdates).length > 0) {
            setBuild((prev) => ({
              ...prev,
              ...newBuildUpdates,
            }));
            toast.success("Đã tải linh kiện từ Chatbot AI vào cấu hình PC!");
          }

          localStorage.removeItem("pcMaster_build_draft");
        } catch (err) {
          console.error("Failed to parse build draft from localStorage", err);
        }
      }
    };

    // Load draft immediately
    loadDraft();

    // Listen for changes (in case Chatbot is used while already on the build page)
    const handleDraftUpdated = () => {
      loadDraft();
    };

    window.addEventListener("pc-build-draft-updated", handleDraftUpdated);
    return () => {
      window.removeEventListener("pc-build-draft-updated", handleDraftUpdated);
    };
  }, []);

  // Calculate hardware bottleneck automatically
  useEffect(() => {
    const calculateBottleneck = async () => {
      const cpu = build.cpu;
      const vga = build.vga;
      const ram = build.ram;

      if (!cpu || !vga || !ram) {
        setBottleneckResult(null);
        setBottleneckError(null);
        return;
      }

      setLoadingBottleneck(true);
      setBottleneckError(null);

      // 1. Normalize hardware names
      const cpuName = normalizeHardwareName(cpu.name, "cpu");
      const gpuName = normalizeHardwareName(vga.name, "gpu");

      // 2. Parse RAM capacity and speed
      const { capacity: ramCapacity, busSpeed: ramBusSpeed } =
        getRamCapacityAndBus(ram);

      try {
        const response = await fetch("http://localhost:5000/api/predict", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cpu_name: cpuName,
            gpu_name: gpuName,
            ram_capacity: ramCapacity,
            ram_bus_speed: ramBusSpeed,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `Lỗi máy chủ: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setBottleneckResult(data.predictions);
        } else {
          setBottleneckError(data.error || "Lỗi phân tích không xác định");
        }
      } catch (err: any) {
        console.error("Bottleneck API error:", err);
        setBottleneckError(
          err.message || "Không thể kết nối tới dịch vụ phân tích AI.",
        );
      } finally {
        setLoadingBottleneck(false);
      }
    };

    calculateBottleneck();
  }, [build.cpu, build.vga, build.ram]);

  // Call AI CPU Advice when CPU changes
  useEffect(() => {
    const fetchCpuAdvice = async () => {
      if (!build.cpu) {
        setCpuAdvice(null);
        return;
      }
      try {
        const data = await aiBuildAPI.getCpuAdvice(build.cpu.name);
        setCpuAdvice(data.advice);
      } catch (err) {
        console.error("Error fetching CPU advice:", err);
        setCpuAdvice(null);
      }
    };
    fetchCpuAdvice();
  }, [build.cpu]);

  // Call AI PSU Recommendation when CPU, GPU, or RAM changes
  useEffect(() => {
    const fetchPsuRecommendation = async () => {
      const cpu = build.cpu;
      const vga = build.vga;
      const ram = build.ram;

      if (!cpu || !vga || !ram) {
        setAiPsuWattage(null);
        setAiPsuExplanation(null);
        return;
      }

      setLoadingPsu(true);
      try {
        const data = await aiBuildAPI.getPsuRecommendation(
          cpu.name,
          vga.name,
          ram.name,
        );
        setAiPsuWattage(data.recommendedWattage);
        setAiPsuExplanation(data.explanation);
      } catch (err) {
        console.error("Error fetching PSU recommendation:", err);
        // Fallback calculation on client side as a last resort
        const cpuSpecs = getProductSpecs(cpu);
        const vgaSpecs = getProductSpecs(vga);
        const totalTdp =
          (Number(cpuSpecs.tdp_w) || 0) + (Number(vgaSpecs.tdp_w) || 0);
        const wattage = Math.ceil((totalTdp + 150) / 50) * 50;
        setAiPsuWattage(wattage);
        setAiPsuExplanation(
          `Đề xuất nguồn công suất tối thiểu ${wattage}W dựa trên tổng công suất tỏa nhiệt (TDP) của CPU (${cpuSpecs.tdp_w || 100}W) và GPU (${vgaSpecs.tdp_w || 200}W) cộng với biên an toàn 150W.`,
        );
      } finally {
        setLoadingPsu(false);
      }
    };
    fetchPsuRecommendation();
  }, [build.cpu, build.vga, build.ram]);

  // Save Modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [buildName, setBuildName] = useState("");
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
  const selectedCount = allSlots.filter((s) => !!build[s.key]).length;
  const totalPrice = Object.values(build).reduce(
    (sum, p) => sum + (p?.price ?? 0),
    0,
  );

  // Clean up dynamic slots if motherboard changes and reduces M.2 slots
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

  // Fetch saved builds when active tab changes to 'my-builds'
  const fetchMyBuilds = async () => {
    if (!user) return;
    setLoadingMyBuilds(true);
    try {
      const data = await buildAPI.list();
      setMyBuilds(data);
    } catch {
      console.error("Error fetching custom builds.");
    } finally {
      setLoadingMyBuilds(false);
    }
  };

  useEffect(() => {
    if (activeTab === "my-builds" && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMyBuilds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

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

    if (slotKey === "case") {
      if (
        currentMainboard &&
        mainboardFormFactor &&
        !isCaseCompatible(product, mainboardFormFactor)
      ) {
        incompatibleSlots.push("mainboard");
      }
    }

    if (slotKey === "storage" || slotKey.startsWith("storage_extra_")) {
      if (currentMainboard && !isSsdCompatible(product, currentMainboard)) {
        incompatibleSlots.push("mainboard");
      }
    }

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

    // Set product and remove incompatible ones
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

  const handleRemove = (slotKey: string) => {
    setBuild((prev) => ({ ...prev, [slotKey]: null }));
  };

  const handleReset = () => {
    setBuild(Object.fromEntries(SLOTS.map((s) => [s.key, null])));
    toast.success("Đã đặt lại cấu hình!");
  };

  const handleAddAllToCart = async () => {
    const selected = Object.values(build).filter((p): p is Product => !!p);
    if (selected.length === 0) {
      toast.error("Chưa có linh kiện nào được chọn!");
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
      toast.error(
        `${failed} sản phẩm không thể thêm (có thể do hết hàng hoặc chưa đăng nhập).`,
      );
    }
  };

  // Compatibility Notes Calculator
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
    const caseSpecs = getProductSpecs(caseProd);

    const cpuSocket = cpuSpecs.socket;
    const mbSocket = mbSpecs.socket;
    const mbRamType = mbSpecs.ram_type;
    const ramType = ramSpecs.ram_type;
    const mbFormFactor = mbSpecs.form_factor;

    // CPU Socket Hint
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

    // Mainboard Hints
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

    // RAM Hint
    if (ram && ramType && !mb) {
      notes.push({
        type: "info",
        text: `Bạn cần chọn bo mạch chủ hỗ trợ chuẩn bộ nhớ ${ramType} cho thanh RAM [${ram.name}].`,
      });
    }

    // AI CPU Motherboard advice
    if (cpuAdvice) {
      notes.push({
        type: "info",
        text: `🤖 Gợi ý từ AI: ${cpuAdvice}`,
      });
    }

    return notes;
  };

  const handleSaveClick = () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập trước khi lưu cấu hình!");
      return;
    }
    if (selectedCount === 0) {
      toast.error("Vui lòng chọn ít nhất 1 linh kiện trước khi lưu!");
      return;
    }
    setBuildName(`Cấu hình máy ngày ${new Date().toLocaleDateString("vi-VN")}`);
    setErrors({});
    setShowSaveModal(true);
  };

  const handleSaveConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildName.trim()) {
      setErrors({ buildName: "Vui lòng nhập tên cấu hình!" });
      return;
    }

    setSavingBuild(true);
    try {
      // 1. Create PcBuild entity
      const savedBuild = await buildAPI.create(buildName);

      // 2. Map slot keys to backend ComponentType
      const slotToTypeMap: Record<string, string> = {
        cpu: "CPU",
        mainboard: "MAINBOARD",
        ram: "RAM",
        storage: "STORAGE",
        vga: "GPU",
        psu: "PSU",
        case: "CASE",
        cooler: "COOLER",
      };

      const selectedItems = Object.entries(build)
        .filter(([, prod]) => !!prod)
        .map(([slotKey, prod]) => {
          const componentType = slotKey.startsWith("storage_extra_")
            ? "STORAGE"
            : slotToTypeMap[slotKey];
          return {
            productId: Number(prod!.id),
            componentType,
          };
        })
        .filter((item) => !!item.componentType); // ignore monitor and fan since they are not in the core backend enum

      // 3. Add components sequentially
      for (const item of selectedItems) {
        await buildAPI.addItem(
          savedBuild.id,
          item.productId,
          item.componentType,
        );
      }

      toast.success("Lưu cấu hình PC thành công!");
      setShowSaveModal(false);
      // If they are saved, fetch list again
      fetchMyBuilds();
    } catch (err) {
      console.error(err);
      toast.error("Lưu cấu hình thất bại. Vui lòng thử lại.");
    } finally {
      setSavingBuild(false);
    }
  };

  const loadSavedBuild = async (savedBuild: PcBuildResponse) => {
    setLoadingMyBuilds(true);
    const toastId = toast.loading("Đang tải chi tiết cấu hình...");
    try {
      const newBuildState: Record<string, Product | null> = Object.fromEntries(
        SLOTS.map((s) => [s.key, null]),
      );

      const typeToSlotMap: Record<string, string> = {
        CPU: "cpu",
        MAINBOARD: "mainboard",
        RAM: "ram",
        STORAGE: "storage",
        GPU: "vga",
        PSU: "psu",
        CASE: "case",
        COOLER: "cooler",
      };

      let storageCount = 0;

      for (const item of savedBuild.items) {
        if (item.productId) {
          let slotKey = typeToSlotMap[item.componentType];
          if (item.componentType === "STORAGE") {
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
      setActiveTab("builder");
      toast.success(`Đã tải cấu hình: ${savedBuild.name}`, { id: toastId });
    } catch {
      toast.error("Lỗi khi tải chi tiết cấu hình.", { id: toastId });
    } finally {
      setLoadingMyBuilds(false);
    }
  };

  const handleDeleteBuildClick = (buildId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent loading saved build
    setPendingDeleteBuildId(buildId);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteBuild = async () => {
    if (pendingDeleteBuildId === null) return;
    const toastId = toast.loading("Đang xóa cấu hình...");
    try {
      await buildAPI.delete(pendingDeleteBuildId);
      toast.success("Đã xóa cấu hình PC thành công!", { id: toastId });
      fetchMyBuilds();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xóa cấu hình. Vui lòng thử lại.", { id: toastId });
    } finally {
      setShowDeleteConfirmModal(false);
      setPendingDeleteBuildId(null);
    }
  };

  const cancelDeleteBuild = () => {
    setShowDeleteConfirmModal(false);
    setPendingDeleteBuildId(null);
  };

  const compatNotes = getCompatibilityNotes();
  const showCompatNotes =
    compatNotes.length > 0 &&
    (!build.mainboard || compatNotes.some((note) => note.type === "warning"));

  return (
    <div
      className="flex flex-col min-h-screen w-full"
      style={{
        background: "linear-gradient(180deg, #f7f9fb 0%, #f0f4f8 100%)",
      }}
    >
      {/* Page Header */}
      <div className="w-full bg-white/80 backdrop-blur-md border-b border-[#e2e8f0]/80 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[11px] font-bold text-[#0058be] uppercase tracking-[1.2px]">
                PCMaster Builder
              </p>
              <h1
                className="text-[20px] font-black text-[#0f172a] tracking-tight"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Xây dựng cấu hình PC
              </h1>
            </div>
            {/* Toggle button to switch between Design and Saved Configurations */}
            {activeTab === "builder" ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab("my-builds")}
                  className="flex items-center gap-1.5 bg-white border border-[#cbd5e1] hover:border-[#0058be] text-[#334155] hover:text-[#0058be] text-[13px] font-bold px-4 py-2 rounded-[10px] shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  <span>📂</span>
                  <span>Cấu hình đã lưu</span>
                </button>
                <SmartBuildDropdown
                  smartBuildNeed={smartBuildNeed}
                  setSmartBuildNeed={setSmartBuildNeed}
                  smartBuildBudget={smartBuildBudget}
                  setSmartBuildBudget={setSmartBuildBudget}
                  isGeneratingSmartBuild={isGeneratingSmartBuild}
                  smartBuildStatus={smartBuildStatus}
                  handleSmartBuildSubmit={handleSmartBuildSubmit}
                  showSmartBuildDropdown={showSmartBuildDropdown}
                  setShowSmartBuildDropdown={setShowSmartBuildDropdown}
                  dropdownRef={dropdownRef}
                />
              </div>
            ) : (
              <button
                onClick={() => setActiveTab("builder")}
                className="flex items-center gap-1.5 bg-[#0058be] hover:bg-[#0047a3] text-white text-[13px] font-bold px-4 py-2 rounded-[10px] shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <span>🛠️</span>
                <span>Thiết kế PC</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "builder" && selectedCount > 0 && (
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
        {activeTab === "builder" ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
            {/* Left: Slot list */}
            <div className="flex flex-col gap-3">
              {/* Intro banner removed as requested */}

              {/* AI Smart Build Note Card */}
              {aiBuildNote && (
                <div className="bg-white border border-violet-100 rounded-[24px] p-6 flex flex-col gap-4 shadow-sm mb-3">
                  <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
                    <div className="flex items-center gap-2.5 text-violet-700 font-extrabold text-[14px] uppercase tracking-[0.5px]">
                      <Sparkles className="size-4 shrink-0 text-violet-600 animate-pulse" />
                      Nhận xét cấu hình từ Trợ lý AI
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiBuildNote(null)}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="text-[13px] text-slate-700 leading-relaxed font-medium bg-slate-50/50 p-4 border border-slate-200/60 rounded-[16px]">
                    <MarkdownText text={aiBuildNote} />
                  </div>
                </div>
              )}

              {/* AI Bottleneck Analysis Widget */}
              <BottleneckReport
                build={build}
                bottleneckResult={bottleneckResult}
                loadingBottleneck={loadingBottleneck}
                bottleneckError={bottleneckError}
              />

              {/* Compatibility Notes Widget */}
              {showCompatNotes && (
                <div className="bg-white border border-[#e8ecf2] rounded-[24px] p-6 flex flex-col gap-4 shadow-sm mb-3">
                  <div className="flex items-center gap-2.5 text-[#0058be] font-extrabold text-[14px] uppercase tracking-[0.5px]">
                    <span className="flex items-center justify-center size-6 rounded-full bg-[#eff6ff] text-[12px] shadow-sm">
                      💡
                    </span>
                    Gợi ý tương thích hệ thống
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {compatNotes.map((note, index) => (
                      <div
                        key={index}
                        className={`text-[12.5px] px-4 py-3 rounded-[12px] border font-medium leading-relaxed transition-colors ${
                          note.type === "warning"
                            ? "bg-rose-50/40 border-rose-100 text-rose-700"
                            : "bg-[#eff6ff]/30 border-blue-100/40 text-[#0058be]"
                        }`}
                      >
                        {note.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Group: Core */}
              <p className="text-[11px] font-black text-[#94a3b8] uppercase tracking-[1.5px] px-1 mt-2">
                🔧 Linh kiện cốt lõi
              </p>
              <div className="flex flex-col gap-3">
                {SLOTS.filter((s) => s.required).map((slot) => (
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
              <p className="text-[11px] font-black text-[#94a3b8] uppercase tracking-[1.5px] px-1 mt-4">
                ✨ Linh kiện tùy chọn
              </p>
              <div className="flex flex-col gap-3">
                {SLOTS.filter((s) => !s.required).map((slot) => (
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
                {extraStorageSlots.map((slot) => (
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
              aiPsuWattage={aiPsuWattage}
              aiPsuExplanation={aiPsuExplanation}
              loadingPsu={loadingPsu}
            />
          </div>
        ) : (
          <MyBuildsList
            myBuilds={myBuilds}
            loadingMyBuilds={loadingMyBuilds}
            user={user}
            loadSavedBuild={loadSavedBuild}
            handleDeleteBuildClick={handleDeleteBuildClick}
            setActiveTab={setActiveTab}
          />
        )}
      </div>

      {/* Picker Modal */}
      {activeSlot && (
        <BuildPickerModal
          slotKey={activeSlot}
          slotLabel={
            allSlots.find((s) => s.key === activeSlot)?.label ?? activeSlot
          }
          build={build}
          onSelect={(p) => handleSelect(activeSlot, p)}
          onClose={() => setActiveSlot(null)}
          aiPsuWattage={aiPsuWattage}
        />
      )}

      {/* Save Modal dialog */}
      <SaveBuildModal
        showSaveModal={showSaveModal}
        setShowSaveModal={setShowSaveModal}
        buildName={buildName}
        setBuildName={setBuildName}
        savingBuild={savingBuild}
        errors={errors}
        setErrors={setErrors}
        handleSaveConfirm={handleSaveConfirm}
      />

      {/* Compatibility Confirmation Modal */}
      <ConfirmSelectionModal
        showConfirmModal={showConfirmModal}
        pendingSelection={pendingSelection}
        cancelPendingSelection={cancelPendingSelection}
        confirmPendingSelection={confirmPendingSelection}
        build={build}
      />

      {/* Delete Saved Build Confirmation Modal */}
      <DeleteBuildModal
        showDeleteConfirmModal={showDeleteConfirmModal}
        pendingDeleteBuildId={pendingDeleteBuildId}
        cancelDeleteBuild={cancelDeleteBuild}
        confirmDeleteBuild={confirmDeleteBuild}
      />
    </div>
  );
}

// ─── AI Smart Build Helper Functions ─────────────────────────────────────────

const mapCategoryToSlotKey = (slug?: string | null): string | null => {
  if (!slug) return null;
  const clean = slug.toLowerCase().replace(/_/g, "-");
  if (clean === "ssd" || clean === "hdd") return "storage";
  const slotKeys = [
    "cpu",
    "mainboard",
    "ram",
    "vga",
    "psu",
    "case",
    "cooler",
    "monitor",
    "fan",
  ];
  if (slotKeys.includes(clean)) return clean;
  return null;
};

function MarkdownText({ text }: { text: string }) {
  const html = text
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, "<br />")
    .replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-extrabold text-slate-900">$1</strong>',
    )
    .replace(/\*(.*?)\*/g, '<em class="italic text-slate-600">$1</em>')
    .replace(
      /(?:^|<br \/>)\s*[-•]\s+(.*?)(?=<br \/>|$)/g,
      '<li class="ml-4 list-disc text-slate-700 mt-1">$1</li>',
    );

  return <div dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} />;
}
