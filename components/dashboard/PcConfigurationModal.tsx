"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Save,
  Loader2,
  AlertCircle,
  ImageIcon,
  ShieldAlert,
  Cpu,
  Folder,
  Layers,
  Tv,
  HardDrive,
  Zap,
  Box,
  Wind,
  Fan,
  Plus,
  Trash2,
  Package,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import { adminAPI, Product, Brand, Category, aiBuildAPI, chatbotAPI } from "@/lib/api";
import toast from "react-hot-toast";

import BuildPickerModal from "@/components/builds/BuildPickerModal";
import ConfirmSelectionModal from "@/components/builds/ConfirmSelectionModal";
import BottleneckReport from "@/components/builds/BottleneckReport";
import SmartBuildDropdown from "@/components/builds/SmartBuildDropdown";

// Types matching the user build page
export interface SlotDef {
  key: string;
  label: string;
  description: string;
  Icon: any;
  required: boolean;
}

export type BuildState = Record<string, Product | null>;

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
    key: "fan",
    label: "Quạt case",
    description: "Thông gió trong thùng",
    Icon: Fan,
    required: false,
  },
];

interface PcConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProduct?: Product | null;
}

function normalizeHardwareName(name: string, type: "cpu" | "gpu"): string {
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
      return `AMD Ryzen ${ryzenMatch[0].match(/\d-\d+\w*/i)?.[0] || ryzenMatch[0]}`;
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

function getRamCapacityAndBus(ramProduct: Product | null) {
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

export default function PcConfigurationModal({
  isOpen,
  onClose,
  onSuccess,
  editingProduct,
}: PcConfigurationModalProps) {
  const isEditing = !!editingProduct;

  // Form Fields
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState("");
  const [price, setPrice] = useState("0");
  const [stock, setStock] = useState("0");
  const [description, setDescription] = useState("");
  const [usageNeeds, setUsageNeeds] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Metadata Lists
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productList, setProductList] = useState<Product[]>([]);

  // Selection States
  const [build, setBuild] = useState<BuildState>(
    Object.fromEntries(SLOTS.map((s) => [s.key, null])),
  );
  const [compQtys, setCompQtys] = useState<Record<string, number>>(
    Object.fromEntries(SLOTS.map((s) => [s.key, 1])),
  );

  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Smart AI build states
  const [showSmartBuildDropdown, setShowSmartBuildDropdown] = useState(false);
  const [smartBuildNeed, setSmartBuildNeed] = useState("gaming");
  const [smartBuildBudget, setSmartBuildBudget] = useState("20-30");
  const [isGeneratingSmartBuild, setIsGeneratingSmartBuild] = useState(false);
  const [smartBuildStatus, setSmartBuildStatus] = useState<string | null>(null);
  const [aiBuildNote, setAiBuildNote] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Bottleneck Prediction states
  const [bottleneckResult, setBottleneckResult] = useState<any>(null);
  const [loadingBottleneck, setLoadingBottleneck] = useState(false);
  const [bottleneckError, setBottleneckError] = useState<string | null>(null);

  // PSU suggestion states
  const [aiPsuWattage, setAiPsuWattage] = useState<number | null>(null);
  const [aiPsuExplanation, setAiPsuExplanation] = useState<string | null>(null);
  const [loadingPsu, setLoadingPsu] = useState(false);

  // CPU Advice state
  const [cpuAdvice, setCpuAdvice] = useState<string | null>(null);

  // Pending selections (for incompatibilities check modal)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<{
    slotKey: string;
    product: Product;
    incompatibleSlots: string[];
  } | null>(null);

  // Static spec parsing
  const getProductSpecs = (p?: Product | null) => {
    if (!p || !p.specsJson) return {};
    try {
      return JSON.parse(p.specsJson);
    } catch {
      return {};
    }
  };

  const getComponentCategory = (p: Product): string => {
    const slug = (p.category?.slug || "").toLowerCase().replace(/[-_]/g, "");
    const catName = (p.category?.name || "").toLowerCase();

    if (slug.includes("cpu") || slug.includes("processor") || catName.includes("cpu") || catName.includes("vi xu ly"))
      return "cpu";
    if (slug.includes("mainboard") || slug.includes("motherboard") || slug.includes("bo-mach") || catName.includes("main") || catName.includes("bo mach"))
      return "mainboard";
    if (slug.includes("vga") || slug.includes("graphic") || slug.includes("card") || catName.includes("vga") || catName.includes("card do hoa") || catName.includes("card man hinh"))
      return "vga";
    if (slug.includes("ram") || slug.includes("memory") || catName.includes("ram") || catName.includes("bo nho"))
      return "ram";
    if (slug.includes("psu") || slug.includes("power") || slug.includes("nguon") || catName.includes("nguon") || catName.includes("psu"))
      return "psu";
    if (slug.includes("ssd") || slug.includes("storage") || slug.includes("hdd") || slug.includes("ocung") || catName.includes("ssd") || catName.includes("o cung") || catName.includes("storage"))
      return "ssd";
    if (slug.includes("case") || slug.includes("vomay") || catName.includes("case") || catName.includes("vo may"))
      return "case";
    if (slug.includes("cooler") || slug.includes("tannhiet") || catName.includes("tan nhiet") || catName.includes("cool"))
      return "cooler";
    if (slug.includes("fan") || slug.includes("quat") || catName.includes("fan") || catName.includes("quat"))
      return "fan";

    return "other";
  };

  // Load static lists
  useEffect(() => {
    adminAPI.getBrands(0, 200).then((r) => setBrands(r.content || []));
    adminAPI.getCategories(0, 200).then((r) => setCategories(r.content || []));

    adminAPI.getProducts(0, 1000).then((r) => {
      const componentProducts = (r.content || []).filter((p) => {
        const catSlug = p.category?.slug || "";
        return (
          catSlug !== "pc-system" &&
          catSlug !== "monitor" &&
          catSlug !== "man-hinh" &&
          String(p.id) !== String(editingProduct?.id)
        );
      });
      setProductList(componentProducts);
    });
  }, [editingProduct, isOpen]);

  // Click outside listener for AI smart builder
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

  // Initialize/Load configuration
  useEffect(() => {
    const init = async () => {
      if (!isOpen) return;
      await Promise.resolve();

      if (editingProduct) {
        setName(editingProduct.name);
        setBrandId(String(editingProduct.brandId || editingProduct.brand?.id || ""));
        setPrice(String(editingProduct.price));
        setStock(String(editingProduct.stock));
        setDescription(editingProduct.description || "");
        setThumbnailPreview(editingProduct.thumbnailUrl || "");

        const specs = getProductSpecs(editingProduct);
        const editingUsageNeeds: string[] = specs.usage_need
          ? Array.isArray(specs.usage_need)
            ? specs.usage_need
            : String(specs.usage_need)
                .split(",")
                .map((s: string) => s.trim())
          : [];
        setUsageNeeds(editingUsageNeeds);

        const newBuild: BuildState = Object.fromEntries(SLOTS.map((s) => [s.key, null]));
        const newQtys: Record<string, number> = Object.fromEntries(SLOTS.map((s) => [s.key, 1]));

        if (editingProduct.pcComponents && productList.length > 0) {
          const prodMap = productList.reduce(
            (acc, p) => {
              acc[Number(p.id)] = p;
              return acc;
            },
            {} as Record<number, Product>,
          );

          let storageCount = 0;

          editingProduct.pcComponents.forEach((c) => {
            const prod = prodMap[Number(c.componentProductId)];
            if (prod) {
              const cat = getComponentCategory(prod);
              if (cat !== "other") {
                if (cat === "ssd") {
                  if (storageCount === 0) {
                    newBuild["storage"] = prod;
                    newQtys["storage"] = c.quantity;
                  } else {
                    const key = `storage_extra_${storageCount}`;
                    newBuild[key] = prod;
                    newQtys[key] = c.quantity;
                  }
                  storageCount++;
                } else {
                  newBuild[cat] = prod;
                  newQtys[cat] = c.quantity;
                }
              }
            }
          });
        }

        setBuild(newBuild);
        setCompQtys(newQtys);
      } else {
        setName("");
        setBrandId("");
        setPrice("0");
        setStock("0");
        setDescription("");
        setThumbnailPreview("");
        setThumbnailFile(null);
        setUsageNeeds([]);
        setBuild(Object.fromEntries(SLOTS.map((s) => [s.key, null])));
        setCompQtys(Object.fromEntries(SLOTS.map((s) => [s.key, 1])));
        setAiBuildNote(null);
        setBottleneckResult(null);
        setAiPsuWattage(null);
        setCpuAdvice(null);
      }
      setSubmitError("");
      setErrors({});
    };
    init();
  }, [editingProduct, isOpen, productList]);

  // Clean-up extra slots when mainboard changes
  useEffect(() => {
    const mbSpecsObj = build.mainboard ? getProductSpecs(build.mainboard) : {};
    const currentM2Slots = Number(mbSpecsObj.m2_slots) || 0;

    Promise.resolve().then(() => {
      setBuild((prevBuild) => {
        let hasChanges = false;
        const newBuild = { ...prevBuild };
        Object.keys(prevBuild).forEach((key) => {
          if (key.startsWith("storage_extra_")) {
            const index = parseInt(key.replace("storage_extra_", ""), 10);
            if (isNaN(index) || index > currentM2Slots) {
              delete newBuild[key];
              hasChanges = true;
            }
          }
        });

        if (hasChanges) {
          setCompQtys((prevQtys) => {
            const newQtys = { ...prevQtys };
            Object.keys(prevBuild).forEach((key) => {
              if (key.startsWith("storage_extra_")) {
                const index = parseInt(key.replace("storage_extra_", ""), 10);
                if (isNaN(index) || index > currentM2Slots) {
                  delete newQtys[key];
                }
              }
            });
            return newQtys;
          });
          return newBuild;
        }
        return prevBuild;
      });
    });
  }, [build.mainboard]);

  // AI PSU Recommendation hook
  useEffect(() => {
    const loadPsu = async () => {
      const cpu = build.cpu;
      const vga = build.vga;
      const ram = build.ram;

      if (!cpu || !vga || !ram) {
        await Promise.resolve();
        setAiPsuWattage(null);
        setAiPsuExplanation(null);
        return;
      }

      setLoadingPsu(true);
      aiBuildAPI
        .getPsuRecommendation(cpu.name, vga.name, ram.name)
        .then((data) => {
          setAiPsuWattage(data.recommendedWattage);
          setAiPsuExplanation(data.explanation);
        })
        .catch((err) => {
          console.error("Error fetching AI PSU recommendation:", err);
          const cpuTdp = Number(getProductSpecs(cpu).tdp_w) || 100;
          const gpuTdp = Number(getProductSpecs(vga).tdp_w) || 200;
          const wattage = Math.ceil((cpuTdp + gpuTdp + 150) / 50) * 50;
          setAiPsuWattage(wattage);
          setAiPsuExplanation(
            `Đề xuất nguồn công suất tối thiểu ${wattage}W dựa trên tổng TDP của CPU (${cpuTdp}W) và GPU (${gpuTdp}W) kèm 150W biên an toàn.`,
          );
        })
        .finally(() => setLoadingPsu(false));
    };
    loadPsu();
  }, [build.cpu, build.vga, build.ram]);

  // CPU Advice hook
  useEffect(() => {
    const loadCpuAdvice = async () => {
      if (!build.cpu) {
        await Promise.resolve();
        setCpuAdvice(null);
        return;
      }
      aiBuildAPI
        .getCpuAdvice(build.cpu.name)
        .then((data) => setCpuAdvice(data.advice))
        .catch((err) => {
          console.error("Error fetching CPU advice:", err);
          setCpuAdvice(null);
        });
    };
    loadCpuAdvice();
  }, [build.cpu]);

  // AI ML Bottleneck Prediction hook
  useEffect(() => {
    const loadBottleneck = async () => {
      const cpu = build.cpu;
      const vga = build.vga;
      const ram = build.ram;

      if (!cpu || !vga || !ram) {
        await Promise.resolve();
        setBottleneckResult(null);
        setBottleneckError(null);
        return;
      }

      setLoadingBottleneck(true);
      setBottleneckError(null);

      const cpuName = normalizeHardwareName(cpu.name, "cpu");
      const gpuName = normalizeHardwareName(vga.name, "gpu");
      const { capacity: ramCapacity, busSpeed: ramBusSpeed } = getRamCapacityAndBus(ram);

      fetch("http://localhost:5000/api/predict", {
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
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Status: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (data.success) {
            setBottleneckResult(data.predictions);
          } else {
            setBottleneckError(data.error || "Lỗi phân tích không xác định");
          }
        })
        .catch((err) => {
          console.error("Bottleneck API error:", err);
          setBottleneckError("Không thể liên kết với server phân tích nghẽn AI (Port 5000).");
        })
        .finally(() => setLoadingBottleneck(false));
    };
    loadBottleneck();
  }, [build.cpu, build.vga, build.ram]);

  const pcSystemCategoryId = categories.find((c) => c.slug === "pc-system")?.id || "";

  // Dynamic extra storage slots
  const extraStorageSlots: SlotDef[] = [];
  const mbSpecsObj = build.mainboard ? getProductSpecs(build.mainboard) : {};
  const m2Slots = Number(mbSpecsObj.m2_slots) || 0;
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

  // Component limits & stock bottlenecks
  const activeSelections = Object.entries(build)
    .filter(([, p]) => !!p)
    .map(([key, p]) => ({
      id: Number(p!.id),
      name: p!.name,
      stock: p!.stock,
      quantity: compQtys[key] || 1,
    }));

  const componentBuildLimits = activeSelections.map((item) => {
    const limit = item.quantity > 0 ? Math.floor(item.stock / item.quantity) : 999999;
    return { id: item.id, name: item.name, limit, stock: item.stock };
  });

  const maxBuildableQuantity =
    activeSelections.length > 0
      ? Math.min(...componentBuildLimits.map((c) => c.limit))
      : 0;

  const stockBottleneck = componentBuildLimits.find((c) => c.limit === maxBuildableQuantity);

  // Total cost of selected components
  const costPerPc = activeSelections.reduce((sum, item) => {
    return sum + (productList.find((p) => Number(p.id) === item.id)?.price || 0) * item.quantity;
  }, 0);

  // Total TDP wattage
  const cpuSpecs = getProductSpecs(build.cpu);
  const vgaSpecs = getProductSpecs(build.vga);
  const totalTdp = (Number(cpuSpecs.tdp_w) || 0) + (Number(vgaSpecs.tdp_w) || 0);

  // Compatibility Notes calculation
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
          text: `Cần chọn Bo mạch chủ hỗ trợ socket ${cpuSocket} để tương thích với CPU [${cpu.name}].`,
        });
      } else if (mbSocket && mbSocket.toLowerCase() !== cpuSocket.toLowerCase()) {
        notes.push({
          type: "warning",
          text: `⚠️ Vi xử lý [${cpu.name}] (${cpuSocket}) không lắp vừa Bo mạch chủ [${mb.name}] (${mbSocket}).`,
        });
      }
    }

    if (mb) {
      if (mbSocket && !cpu) {
        notes.push({
          type: "info",
          text: `Cần chọn CPU có Socket ${mbSocket} để cắm vào Bo mạch chủ [${mb.name}].`,
        });
      }
      if (mbRamType && !ram) {
        notes.push({
          type: "info",
          text: `Nên chọn RAM chuẩn ${mbRamType} cho Bo mạch chủ [${mb.name}].`,
        });
      } else if (ramType && mbRamType.toLowerCase() !== ramType.toLowerCase()) {
        notes.push({
          type: "warning",
          text: `⚠️ Bo mạch chủ [${mb.name}] (${mbRamType}) không tương thích với RAM [${ram?.name}] (${ramType}).`,
        });
      }
      if (mbFormFactor && !caseProd) {
        notes.push({
          type: "info",
          text: `Cần chọn Vỏ máy hỗ trợ kích cỡ Bo mạch chủ ${mbFormFactor}.`,
        });
      } else if (mbFormFactor && caseProd) {
        const isCompatible = isCaseCompatibleWithMb(caseProd, mbFormFactor);
        if (!isCompatible) {
          notes.push({
            type: "warning",
            text: `⚠️ Kích cỡ Mainboard [${mb.name}] (${mbFormFactor}) không vừa hoặc không hỗ trợ bởi vỏ máy [${caseProd.name}].`,
          });
        }
      }
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

  const handleSelect = (slotKey: string, product: Product) => {
    const specs = getProductSpecs(product);
    const incompatibleSlots: string[] = [];

    const cpuSocket = getProductSpecs(build.cpu).socket;
    const mainboardSocket = getProductSpecs(build.mainboard).socket;
    const mainboardRamType = getProductSpecs(build.mainboard).ram_type;
    const ramType = getProductSpecs(build.ram).ram_type;
    const mainboardFormFactor = getProductSpecs(build.mainboard).form_factor;

    const isCoolerCompatible = (coolerProd: Product, socket: string) => {
      const coolerSpecs = getProductSpecs(coolerProd);
      const supported = coolerSpecs.cpu_socket_support || coolerSpecs.supported_sockets;
      if (!supported) return true;
      if (Array.isArray(supported)) {
        return supported.some((s) => String(s).toLowerCase().includes(socket.toLowerCase()));
      }
      return String(supported).toLowerCase().includes(socket.toLowerCase());
    };

    if (slotKey === "cpu") {
      const socket = specs.socket;
      if (build.mainboard && mainboardSocket && socket && mainboardSocket.toLowerCase() !== socket.toLowerCase()) {
        incompatibleSlots.push("mainboard");
      }
      if (build.cooler && socket && !isCoolerCompatible(build.cooler, socket)) {
        incompatibleSlots.push("cooler");
      }
    }

    if (slotKey === "mainboard") {
      const mbSocket = specs.socket;
      const mbRamType = specs.ram_type;
      const mbFormFactor = specs.form_factor;

      if (build.cpu && cpuSocket && mbSocket && cpuSocket.toLowerCase() !== mbSocket.toLowerCase()) {
        incompatibleSlots.push("cpu");
      }
      if (build.ram && ramType && mbRamType && ramType.toLowerCase() !== mbRamType.toLowerCase()) {
        incompatibleSlots.push("ram");
      }
      if (build.case && mbFormFactor && !isCaseCompatibleWithMb(build.case, mbFormFactor)) {
        incompatibleSlots.push("case");
      }
      if (build.cooler && mbSocket && !isCoolerCompatible(build.cooler, mbSocket)) {
        incompatibleSlots.push("cooler");
      }
    }

    if (slotKey === "ram") {
      const pRamType = specs.ram_type;
      if (build.mainboard && mainboardRamType && pRamType && mainboardRamType.toLowerCase() !== pRamType.toLowerCase()) {
        incompatibleSlots.push("mainboard");
      }
    }

    if (slotKey === "case") {
      if (build.mainboard && mainboardFormFactor && !isCaseCompatibleWithMb(product, mainboardFormFactor)) {
        incompatibleSlots.push("mainboard");
      }
    }

    if (slotKey === "cooler") {
      if (build.cpu && cpuSocket && !isCoolerCompatible(product, cpuSocket)) {
        incompatibleSlots.push("cpu");
      } else if (!build.cpu && build.mainboard && mainboardSocket && !isCoolerCompatible(product, mainboardSocket)) {
        incompatibleSlots.push("mainboard");
      }
    }

    if (incompatibleSlots.length > 0) {
      setPendingSelection({ slotKey, product, incompatibleSlots });
      setShowConfirmModal(true);
      return;
    }

    setBuild((prev) => ({ ...prev, [slotKey]: product }));
    setCompQtys((prev) => ({ ...prev, [slotKey]: 1 }));
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

    setCompQtys((prev) => {
      const nextQtys = { ...prev, [slotKey]: 1 };
      incompatibleSlots.forEach((s) => {
        nextQtys[s] = 1;
      });
      return nextQtys;
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
    setCompQtys((prev) => ({ ...prev, [slotKey]: 1 }));
    toast.success("Đã gỡ linh kiện khỏi cấu hình!");
  };

  const handleQuantityChange = (slotKey: string, qty: number) => {
    setCompQtys((prev) => ({ ...prev, [slotKey]: Math.max(1, qty) }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  // Smart AI build submit matching BuildPage implementation
  const handleSmartBuildSubmit = async () => {
    if (productList.length === 0) {
      toast.error("Đang tải danh sách linh kiện. Vui lòng thử lại sau.");
      return;
    }

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
      const getComponentList = (cat: string) => {
        return productList.filter((p) => getComponentCategory(p) === cat && p.stock > 0);
      };

      const cpus = getComponentList("cpu");
      const mainboards = getComponentList("mainboard");
      const rams = getComponentList("ram");
      const vgas = getComponentList("vga");
      const ssds = getComponentList("ssd");
      const psus = getComponentList("psu");
      const cases = getComponentList("case");
      const coolers = getComponentList("cooler");
      const fans = getComponentList("fan");

      if (cpus.length === 0 || mainboards.length === 0 || rams.length === 0) {
        toast.error("Không đủ linh kiện cốt lõi còn hàng trong kho để tự động tạo cấu hình!");
        setIsGeneratingSmartBuild(false);
        setSmartBuildStatus(null);
        return;
      }

      setSmartBuildStatus("Đang tính toán ngân sách và tỷ lệ phần cứng...");
      await new Promise((resolve) => setTimeout(resolve, 300));

      let targetBudget = 25000000;
      if (smartBuildBudget === "under-10") targetBudget = 9000000;
      else if (smartBuildBudget === "10-15") targetBudget = 13000000;
      else if (smartBuildBudget === "15-20") targetBudget = 18000000;
      else if (smartBuildBudget === "20-30") targetBudget = 25000000;
      else if (smartBuildBudget === "30-50") targetBudget = 40000000;
      else if (smartBuildBudget === "over-50") targetBudget = 60000000;

      const isGamingOrGraphics = smartBuildNeed === "gaming" || smartBuildNeed === "graphics";

      const cpuShare = isGamingOrGraphics ? 0.2 : 0.28;
      const mbShare = isGamingOrGraphics ? 0.12 : 0.16;
      const ramShare = isGamingOrGraphics ? 0.08 : 0.1;
      const vgaShare = isGamingOrGraphics ? 0.35 : 0.12;

      const cpuBudget = targetBudget * cpuShare;
      const mbBudget = targetBudget * mbShare;
      const ramBudget = targetBudget * ramShare;
      const vgaBudget = targetBudget * vgaShare;

      const sortedCpus = [...cpus].sort((a, b) => a.price - b.price);
      const sortedMbs = [...mainboards].sort((a, b) => a.price - b.price);
      const sortedRams = [...rams].sort((a, b) => a.price - b.price);
      const sortedVgas = [...vgas].sort((a, b) => a.price - b.price);

      const findClosestIndex = (arr: Product[], targetPrice: number): number => {
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

      const findCompatibleCpuAndMainboard = (startCpuIdx: number, targetMbBudget: number) => {
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
          const cpuSocket = getProductSpecs(cpu).socket;
          if (!cpuSocket) continue;

          const compatibleMbs = sortedMbs.filter((mb) => {
            const mbSocket = getProductSpecs(mb).socket;
            return mbSocket && mbSocket.toLowerCase() === cpuSocket.toLowerCase();
          });

          if (compatibleMbs.length > 0) {
            const bestMb = [...compatibleMbs].sort(
              (a, b) => Math.abs(a.price - targetMbBudget) - Math.abs(b.price - targetMbBudget)
            )[0];
            return { cpu, mb: bestMb, cpuIdx: idx };
          }
        }
        return null;
      };

      const getCompatibleRam = (mbProduct: Product, targetRamBudget: number): Product | null => {
        const mbRamType = getProductSpecs(mbProduct).ram_type || "DDR4";
        const compatibleRams = sortedRams.filter((ram) => {
          const ramType = getProductSpecs(ram).ram_type;
          return ramType && ramType.toLowerCase() === mbRamType.toLowerCase();
        });
        if (compatibleRams.length === 0) return null;
        return [...compatibleRams].sort(
          (a, b) => Math.abs(a.price - targetRamBudget) - Math.abs(b.price - targetRamBudget)
        )[0];
      };

      setSmartBuildStatus("Đang ghép nối CPU và Mainboard tương thích socket...");
      await new Promise((resolve) => setTimeout(resolve, 400));
      let currentCpuIdx = findClosestIndex(sortedCpus, cpuBudget);
      const initialCore = findCompatibleCpuAndMainboard(currentCpuIdx, mbBudget);
      if (!initialCore) {
        toast.error("Không tìm thấy cấu hình CPU + Mainboard tương thích!");
        setIsGeneratingSmartBuild(false);
        setSmartBuildStatus(null);
        return;
      }

      let currCpu = initialCore.cpu;
      let currMb = initialCore.mb;
      currentCpuIdx = initialCore.cpuIdx;

      setSmartBuildStatus(`Đã khớp CPU [${currCpu.name}] với Mainboard [${currMb.name}]. Đang chọn RAM & VGA...`);
      await new Promise((resolve) => setTimeout(resolve, 400));

      let currRam = getCompatibleRam(currMb, ramBudget);
      if (!currRam && sortedRams.length > 0) {
        currRam = [...sortedRams].sort(
          (a, b) => Math.abs(a.price - ramBudget) - Math.abs(b.price - ramBudget)
        )[0];
      }

      let currentVgaIdx = findClosestIndex(sortedVgas, vgaBudget);
      let currVga = sortedVgas.length > 0 ? sortedVgas[currentVgaIdx] : null;

      const checkStaticBottleneck = (cpuName: string, gpuName: string): number => {
        const cpuL = cpuName.toLowerCase();
        const gpuL = gpuName.toLowerCase();
        const isCpuH = cpuL.includes("i9") || cpuL.includes("ryzen 9") || cpuL.includes("9900") || cpuL.includes("14900") || cpuL.includes("13900");
        const isCpuM = cpuL.includes("i7") || cpuL.includes("ryzen 7") || cpuL.includes("i5") || cpuL.includes("ryzen 5");
        const isGpuH = gpuL.includes("4090") || gpuL.includes("4080") || gpuL.includes("3090") || gpuL.includes("3080") || gpuL.includes("7900");
        const isGpuM = gpuL.includes("4070") || gpuL.includes("3070") || gpuL.includes("4060") || gpuL.includes("3060");

        if (isCpuH && !isGpuH && !isGpuM) return 2;
        if (!isCpuH && !isCpuM && isGpuH) return 1;
        return 0;
      };

      const queryBottleneck = async (cpu: Product, gpu: Product, ram: Product): Promise<number> => {
        const cpuName = normalizeHardwareName(cpu.name, "cpu");
        const gpuName = normalizeHardwareName(gpu.name, "gpu");
        const { capacity: ramCapacity, busSpeed: ramBusSpeed } = getRamCapacityAndBus(ram);

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
            if (data?.success && data.predictions?.length > 0) {
              const pred1080 = data.predictions.find((p: any) => p.resolution === "1080");
              if (pred1080) return Number(pred1080.predicted_type);
            }
          }
        } catch (err) {
          console.error("ML predict error in admin smart build:", err);
        }
        return checkStaticBottleneck(cpu.name, gpu.name);
      };

      let loopCount = 0;
      let bestConfig = { cpu: currCpu, mb: currMb, ram: currRam, vga: currVga, bottleneck: 999 };
      const triedConfigs = new Set<string>();

      while (loopCount < 6) {
        if (!currCpu || !currRam) break;
        const configKey = `${currCpu.id}-${currMb.id}-${currRam.id}-${currVga ? currVga.id : "none"}`;
        if (triedConfigs.has(configKey)) break;
        triedConfigs.add(configKey);

        setSmartBuildStatus(`[Vòng lặp ${loopCount + 1}] Đang kiểm tra hiệu năng nghẽn cổ chai (AI)...`);
        await new Promise((resolve) => setTimeout(resolve, 350));

        let bottleneckVal = 0;
        if (currVga) {
          bottleneckVal = await queryBottleneck(currCpu, currVga, currRam);
        }

        if (bottleneckVal === 0) {
          setSmartBuildStatus("Cấu hình đã cân bằng hiệu năng!");
          bestConfig = { cpu: currCpu, mb: currMb, ram: currRam, vga: currVga, bottleneck: 0 };
          break;
        }

        if (bestConfig.bottleneck === 999 || bestConfig.bottleneck > 0) {
          bestConfig = { cpu: currCpu, mb: currMb, ram: currRam, vga: currVga, bottleneck: bottleneckVal };
        }

        if (bottleneckVal === 1 && currVga) {
          if (currentCpuIdx < sortedCpus.length - 1) {
            const newCore = findCompatibleCpuAndMainboard(currentCpuIdx + 1, mbBudget);
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
          if (currentVgaIdx < sortedVgas.length - 1) {
            currentVgaIdx = currentVgaIdx + 1;
            currVga = sortedVgas[currentVgaIdx];
          } else {
            const newCpuIdx = Math.max(0, currentCpuIdx - 1);
            if (newCpuIdx !== currentCpuIdx) {
              const newCore = findCompatibleCpuAndMainboard(newCpuIdx, mbBudget);
              if (newCore) {
                currCpu = newCore.cpu;
                currMb = newCore.mb;
                currentCpuIdx = newCore.cpuIdx;
                const newRam = getCompatibleRam(currMb, ramBudget);
                if (newRam) currRam = newRam;
              }
            }
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
        toast.error("Không tìm thấy cấu hình cốt lõi phù hợp!");
        setIsGeneratingSmartBuild(false);
        setSmartBuildStatus(null);
        return;
      }

      setSmartBuildStatus("Đang đề xuất công suất nguồn PSU tối ưu bằng AI...");
      await new Promise((resolve) => setTimeout(resolve, 400));

      const corePrice = finalCpu.price + finalMb.price + finalRam.price + (finalVga ? finalVga.price : 0);
      const leftoverBudget = targetBudget - corePrice;

      let psuWattageNeeded = 500;
      try {
        const psuRec = await aiBuildAPI.getPsuRecommendation(
          finalCpu.name,
          finalVga ? finalVga.name : "None",
          finalRam.name
        );
        psuWattageNeeded = psuRec.recommendedWattage;
      } catch {
        const cpuTdp = Number(getProductSpecs(finalCpu).tdp_w) || 100;
        const gpuTdp = finalVga ? Number(getProductSpecs(finalVga).tdp_w) || 200 : 0;
        psuWattageNeeded = Math.ceil((cpuTdp + gpuTdp + 150) / 50) * 50;
      }

      const compatiblePsus = psus.filter((psu) => {
        const specs = getProductSpecs(psu);
        const watt = Number(specs.wattage) || Number(specs.watt) || 500;
        return watt >= psuWattageNeeded;
      });
      const selectedPsu = compatiblePsus.length > 0
        ? [...compatiblePsus].sort((a, b) => a.price - b.price)[0]
        : psus[0];

      const mbFormFactor = getProductSpecs(finalMb).form_factor || "ATX";
      const compatibleCases = cases.filter((c) => isCaseCompatibleWithMb(c, mbFormFactor));
      const selectedCase = compatibleCases.length > 0
        ? [...compatibleCases].sort((a, b) => a.price - b.price)[0]
        : cases[0];

      const selectedStorage = ssds.length > 0
        ? [...ssds].sort((a, b) => Math.abs(a.price - leftoverBudget * 0.4) - Math.abs(b.price - leftoverBudget * 0.4))[0]
        : null;

      const cpuSocket = getProductSpecs(finalCpu).socket || "";
      const compatibleCoolers = coolers.filter((col) => {
        const sockets = getProductSpecs(col).supported_sockets || getProductSpecs(col).cpu_socket_support || "";
        if (!sockets) return true;
        return String(sockets).toLowerCase().includes(cpuSocket.toLowerCase());
      });
      const selectedCooler = compatibleCoolers.length > 0
        ? [...compatibleCoolers].sort((a, b) => a.price - b.price)[0]
        : coolers[0];

      const selectedFan = fans.length > 0
        ? fans.sort((a, b) => a.price - b.price)[0]
        : null;

      const newBuildState: BuildState = {
        cpu: finalCpu,
        mainboard: finalMb,
        ram: finalRam,
        vga: finalVga,
        psu: selectedPsu || null,
        case: selectedCase || null,
        storage: selectedStorage || null,
        cooler: selectedCooler || null,
        fan: selectedFan || null,
      };

      setBuild(newBuildState);
      setCompQtys(Object.fromEntries(allSlots.map((s) => [s.key, 1])));

      const calculatedCost =
        finalCpu.price +
        finalMb.price +
        finalRam.price +
        (finalVga ? finalVga.price : 0) +
        (selectedPsu ? selectedPsu.price : 0) +
        (selectedCase ? selectedCase.price : 0) +
        (selectedStorage ? selectedStorage.price : 0) +
        (selectedCooler ? selectedCooler.price : 0) +
        (selectedFan ? selectedFan.price : 0);

      // Markup retail price by 10% automatically for profit margin
      setPrice(String(Math.ceil((calculatedCost * 1.1) / 10000) * 10000));

      setSmartBuildStatus("Đang hỏi ý kiến trợ lý AI để tạo mô tả PC...");
      const promptMessage = `Bạn là chuyên gia PCMaster. Tôi đã tự động build cấu hình PC sau:
- CPU: ${finalCpu.name}
- Mainboard: ${finalMb.name}
- RAM: ${finalRam.name}
- VGA: ${finalVga ? finalVga.name : "Chưa chọn"}
- Storage: ${selectedStorage ? selectedStorage.name : "Chưa chọn"}
- Nguồn (PSU): ${selectedPsu ? selectedPsu.name : "Chưa chọn"}
- Vỏ máy (Case): ${selectedCase ? selectedCase.name : "Chưa chọn"}

Hãy viết nhận xét ngắn gọn khoảng 3-4 câu bằng tiếng Việt giải thích tại sao cấu hình này cực kỳ phù hợp cho nhu cầu ${selectedNeed} trong tầm giá ${selectedBudget} VNĐ, đảm bảo hiệu năng tối ưu và không bị nghẽn cổ chai. Hãy viết dưới dạng mô tả sản phẩm hấp dẫn.`;

      try {
        const response = await chatbotAPI.chat(promptMessage, [], "consult");
        if (response?.message) {
          setDescription(response.message);
          setAiBuildNote(response.message);
        }
      } catch {
        const fallbackAdvice = `Cấu hình PC được chọn lọc tối ưu tương thích: CPU [${finalCpu.name}] đi kèm Bo mạch chủ [${finalMb.name}] và RAM [${finalRam.name}]. Card đồ họa [${finalVga ? finalVga.name : "Onboard"}] đảm bảo sức mạnh xử lý ổn định, mượt mà và không gây nghẽn cổ chai trong phân khúc.`;
        setDescription(fallbackAdvice);
        setAiBuildNote(fallbackAdvice);
      }

      toast.success("Cấu hình thông minh bằng AI đã hoàn tất!");
      setShowSmartBuildDropdown(false);
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi chạy thuật toán xây dựng cấu hình AI!");
    } finally {
      setIsGeneratingSmartBuild(false);
      setSmartBuildStatus(null);
    }
  };

  // Submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Tên cấu hình PC không được để trống";
    }
    if (!brandId) {
      newErrors.brandId = "Vui lòng chọn thương hiệu lắp ráp";
    }

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      newErrors.price = "Giá bán lẻ phải lớn hơn 0";
    }

    const pcStock = Number(stock);
    if (isNaN(pcStock) || pcStock < 0) {
      newErrors.stock = "Số lượng lắp ráp phải lớn hơn hoặc bằng 0";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitError("Vui lòng kiểm tra lại thông tin bị thiếu hoặc sai.");
      return;
    }

    if (!pcSystemCategoryId) {
      setSubmitError("Không tìm thấy danh mục PC_SYSTEM trong hệ thống.");
      return;
    }

    // Map selected slots back to pcComponents payload list
    const componentQtysMap: Record<number, number> = {};

    Object.entries(build).forEach(([key, p]) => {
      if (p) {
        const id = Number(p.id);
        const qty = compQtys[key] || 1;
        componentQtysMap[id] = (componentQtysMap[id] || 0) + qty;
      }
    });

    const validComponents = Object.entries(componentQtysMap).map(([id, qty]) => ({
      componentProductId: Number(id),
      quantity: qty,
    }));

    if (validComponents.length === 0) {
      setSubmitError("Vui lòng chọn ít nhất 1 linh kiện để cấu hình PC.");
      return;
    }

    if (!isEditing && pcStock > maxBuildableQuantity) {
      setSubmitError(
        `Số lượng lắp ráp vượt quá giới hạn linh kiện trong kho (Tối đa ${maxBuildableQuantity} sản phẩm).`,
      );
      return;
    }

    setLoading(true);

    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    const specsObj: Record<string, unknown> = {
      brand: brands.find((b) => String(b.id) === brandId)?.name || "",
      component_type: "PC_SYSTEM",
      cpu: build.cpu?.name || "N/A",
      vga: build.vga?.name || "N/A",
      ram: build.ram?.name || "N/A",
      usage_need: usageNeeds,
    };

    const dataPayload = {
      name,
      slug,
      categoryId: Number(pcSystemCategoryId),
      brandId: Number(brandId),
      price: Number(price),
      stock: pcStock,
      description,
      thumbnailUrl: isEditing ? editingProduct?.thumbnailUrl : undefined,
      specsJson: JSON.stringify(specsObj),
      pcComponents: validComponents,
    };

    try {
      if (isEditing && editingProduct) {
        await adminAPI.updateProduct(editingProduct.id, dataPayload);
        toast.success("Cập nhật cấu hình PC thành công!");
        onSuccess();
        onClose();
      } else {
        const formData = new FormData();
        formData.append(
          "data",
          new Blob([JSON.stringify(dataPayload)], { type: "application/json" }),
        );
        if (thumbnailFile) {
          formData.append("thumbnail", thumbnailFile);
        }
        await adminAPI.createProduct(formData);
        toast.success("Lắp ráp & Tạo sản phẩm PC thành công!");
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || "Có lỗi xảy ra khi lưu cấu hình.";
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const showCompatAlerts = compatNotes.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[#f8fafc] rounded-[24px] shadow-2xl w-full max-w-7xl max-h-[92vh] overflow-y-auto mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200/60 sticky top-0 bg-white/95 backdrop-blur-md rounded-t-[24px] z-20">
          <div>
            <h3 className="text-[#0f172a] text-[20px] font-black flex items-center gap-2 tracking-tight">
              <Cpu className="size-6 text-[#0058be]" />
              {isEditing ? "Cập nhật cấu hình PC lắp sẵn" : "Thiết kế & Lắp ráp PC mới"}
            </h3>
            <p className="text-[#94a3b8] text-[13px] mt-0.5 font-medium">
              Chỉnh sửa thông tin, lựa chọn linh kiện tương thích tồn kho và phân tích bằng AI.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#94a3b8] hover:text-[#475569] hover:bg-[#f1f5f9] rounded-full transition-all cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
          {submitError && (
            <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-[16px] px-5 py-4 text-[13.5px] font-semibold">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-500" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Rebuilt Layout Grid: Form Content (Left) & AI Reports (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
            
            {/* Left Column (Forms & Slots list) */}
            <div className="flex flex-col gap-6">
              
              {/* Product Info Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-sm">
                
                {/* Inputs Info */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-extrabold text-[#334155] uppercase tracking-wide">
                      Tên sản phẩm PC <span className="text-red-500">*</span>
                    </label>
                    {errors.name && (
                      <span className="text-red-500 text-[11px] font-bold">⚠️ {errors.name}</span>
                    )}
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrors((prev) => ({ ...prev, name: "" }));
                      }}
                      placeholder="VD: PC Gaming Master Extreme v1"
                      className={`bg-white border rounded-[12px] px-4 py-2.5 text-[14px] focus:outline-none transition-all ${
                        errors.name
                          ? "border-red-500 focus:ring-1 focus:ring-red-500"
                          : "border-[#e2e8f0] focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be]"
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-extrabold text-[#334155] uppercase tracking-wide">
                      Thương hiệu lắp ráp <span className="text-red-500">*</span>
                    </label>
                    {errors.brandId && (
                      <span className="text-red-500 text-[11px] font-bold">⚠️ {errors.brandId}</span>
                    )}
                    <select
                      required
                      value={brandId}
                      onChange={(e) => {
                        setBrandId(e.target.value);
                        setErrors((prev) => ({ ...prev, brandId: "" }));
                      }}
                      className={`bg-white border rounded-[12px] px-4 py-2.5 text-[14px] focus:outline-none transition-all ${
                        errors.brandId
                          ? "border-red-500"
                          : "border-[#e2e8f0] focus:border-[#0058be]"
                      }`}
                    >
                      <option value="">-- Chọn thương hiệu --</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-extrabold text-[#334155] uppercase tracking-wide">
                        Giá bán lẻ (VNĐ) <span className="text-red-500">*</span>
                      </label>
                      {errors.price && (
                        <span className="text-red-500 text-[11px] font-bold">⚠️ {errors.price}</span>
                      )}
                      <input
                        type="number"
                        min={0}
                        required
                        value={price}
                        onChange={(e) => {
                          setPrice(e.target.value);
                          setErrors((prev) => ({ ...prev, price: "" }));
                        }}
                        className="bg-white border border-[#e2e8f0] rounded-[12px] px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#0058be]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-extrabold text-[#334155] uppercase tracking-wide">
                        Số lượng lắp ráp <span className="text-red-500">*</span>
                      </label>
                      {errors.stock && (
                        <span className="text-red-500 text-[11px] font-bold">⚠️ {errors.stock}</span>
                      )}
                      <input
                        type="number"
                        min={0}
                        required
                        disabled={isEditing}
                        value={stock}
                        onChange={(e) => {
                          setStock(e.target.value);
                          setErrors((prev) => ({ ...prev, stock: "" }));
                        }}
                        className={`border rounded-[12px] px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#0058be] ${
                          isEditing ? "bg-[#f1f5f9] text-[#64748b] cursor-not-allowed border-[#e2e8f0]" : "bg-white"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Product Image Upload */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-extrabold text-[#334155] uppercase tracking-wide">
                    Ảnh sản phẩm bộ PC
                  </label>
                  <div
                    className="flex-1 min-h-[180px] border-2 border-dashed border-slate-200 hover:border-[#0058be] rounded-[16px] p-5 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer bg-slate-50/40 hover:bg-blue-50/10 group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {thumbnailPreview ? (
                      <div className="flex flex-col items-center gap-2 w-full justify-center">
                        <img
                          src={thumbnailPreview}
                          alt="preview"
                          className="h-28 object-contain rounded-[12px] border border-slate-100 bg-white p-1"
                        />
                        <p className="text-[11px] text-[#94a3b8] font-bold truncate max-w-[200px]">
                          {thumbnailFile?.name || "Ảnh hiện tại"}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-blue-50 text-[#0058be] rounded-full group-hover:bg-blue-100 transition-colors">
                          <ImageIcon className="size-6" />
                        </div>
                        <div className="text-center">
                          <p className="text-[13px] font-bold text-[#374151] group-hover:text-[#0058be] transition-colors">
                            Tải ảnh lên
                          </p>
                          <p className="text-[11px] text-[#94a3b8] mt-0.5">
                            PNG, JPG, WEBP dung lượng thấp
                          </p>
                        </div>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Usage Needs Selection */}
              <div className="flex flex-col gap-3 bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-sm">
                <label className="text-[13px] font-extrabold text-[#334155] uppercase tracking-wide">
                  Nhu cầu sử dụng (Chọn nhiều)
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {["Gaming", "Đồ họa", "Văn phòng", "Lập trình"].map((need) => {
                    const isSelected = usageNeeds.includes(need);
                    return (
                      <button
                        key={need}
                        type="button"
                        onClick={() => {
                          setUsageNeeds((prev) =>
                            prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need],
                          );
                        }}
                        className={`px-4.5 py-2.5 rounded-[12px] border text-[13px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#0058be] border-[#0058be] text-white shadow-sm"
                            : "bg-white border-[#cbd5e1] text-[#475569] hover:border-[#0058be] hover:text-[#0058be]"
                        }`}
                      >
                        {need}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description box */}
              <div className="flex flex-col gap-1.5 bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-sm">
                <label className="text-[13px] font-extrabold text-[#334155] uppercase tracking-wide">
                  Mô tả bộ PC
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập nhận xét / mô tả chi tiết về cấu hình bộ PC..."
                  rows={3}
                  className="bg-[#f8fafc] border border-slate-200 rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#0058be] transition-all resize-none"
                />
              </div>

              {/* PC Components list title & AI build trigger */}
              <div className="flex items-center justify-between gap-4 flex-wrap mt-2">
                <h4 className="text-[14px] font-black text-[#0058be] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-green-600 animate-bounce" />
                  Danh sách linh kiện cấu thành
                </h4>
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

              {/* Warnings on assembly bottleneck limit */}
              {!isEditing && maxBuildableQuantity < 999999 && stockBottleneck && stockBottleneck.id > 0 && (
                <div className="flex items-center gap-2.5 bg-[#fff7ed] border border-[#ffedd5] text-[#c2410c] px-4.5 py-3 rounded-[16px] text-[13px] font-semibold shadow-sm">
                  <ShieldAlert className="size-4 shrink-0 text-amber-600" />
                  <span>
                    Giới hạn lắp ráp tối đa: <strong>{maxBuildableQuantity} bộ</strong>. Bị nghẽn do linh kiện{" "}
                    <strong>{stockBottleneck.name}</strong> (Còn <strong>{stockBottleneck.stock}</strong> cái trong kho).
                  </span>
                </div>
              )}

              {/* Slot render lists */}
              <div className="flex flex-col gap-3">
                {/* Core components */}
                <p className="text-[11px] font-black text-[#94a3b8] uppercase tracking-[1.5px] px-1">
                  🔧 Linh kiện cốt lõi
                </p>
                <div className="flex flex-col gap-3.5">
                  {SLOTS.filter((s) => s.required).map((slot) => (
                    <AdminBuildSlot
                      key={slot.key}
                      label={slot.label}
                      description={slot.description}
                      Icon={slot.Icon}
                      product={build[slot.key]}
                      qty={compQtys[slot.key] || 1}
                      onPick={() => setActiveSlot(slot.key)}
                      onRemove={() => handleRemove(slot.key)}
                      onQtyChange={(qty) => handleQuantityChange(slot.key, qty)}
                    />
                  ))}
                </div>

                {/* Optional components */}
                <p className="text-[11px] font-black text-[#94a3b8] uppercase tracking-[1.5px] px-1 mt-4">
                  ✨ Linh kiện tùy chọn
                </p>
                <div className="flex flex-col gap-3.5">
                  {SLOTS.filter((s) => !s.required).map((slot) => (
                    <AdminBuildSlot
                      key={slot.key}
                      label={slot.label}
                      description={slot.description}
                      Icon={slot.Icon}
                      product={build[slot.key]}
                      qty={compQtys[slot.key] || 1}
                      onPick={() => setActiveSlot(slot.key)}
                      onRemove={() => handleRemove(slot.key)}
                      onQtyChange={(qty) => handleQuantityChange(slot.key, qty)}
                    />
                  ))}
                  {extraStorageSlots.map((slot) => (
                    <AdminBuildSlot
                      key={slot.key}
                      label={slot.label}
                      description={slot.description}
                      Icon={slot.Icon}
                      product={build[slot.key]}
                      qty={compQtys[slot.key] || 1}
                      onPick={() => setActiveSlot(slot.key)}
                      onRemove={() => handleRemove(slot.key)}
                      onQtyChange={(qty) => handleQuantityChange(slot.key, qty)}
                    />
                  ))}
                </div>

              </div>

            </div>

            {/* Right Column (AI Panel, PSU Advice, Cost Details) */}
            <div className="flex flex-col gap-4 sticky top-24">
              
              {/* Cost Summary Card */}
              <div className="bg-white rounded-[24px] border border-slate-200/60 p-6 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <p className="text-[11px] font-bold text-[#0058be] uppercase tracking-[1.5px] mb-1.5">
                    Tài chính & Ước tính
                  </p>
                  
                  {/* Retail PC price vs Cost per PC warning */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-[#64748b] font-medium">Giá bán lẻ đề xuất:</span>
                    <p className="text-[28px] font-black text-[#0f172a] tracking-tight leading-none">
                      {Number(price).toLocaleString("vi-VN")}
                      <span className="text-[16px] font-extrabold text-[#0058be] ml-1">₫</span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 mt-3.5 border-t border-slate-100 pt-3">
                    <span className="text-[11px] text-[#64748b] font-medium">Tổng vốn linh kiện:</span>
                    <p className="text-[20px] font-bold text-slate-800 tracking-tight leading-none">
                      {costPerPc.toLocaleString("vi-VN")}
                      <span className="text-[13px] font-bold text-slate-500 ml-1">₫</span>
                    </p>
                  </div>

                  {costPerPc > Number(price) && costPerPc > 0 && (
                    <div className="mt-3 flex items-start gap-1.5 bg-rose-50 border border-rose-100 rounded-[12px] p-3 text-[11px] text-rose-700 font-semibold leading-relaxed">
                      <span>⚠️ Cảnh báo: Giá bán lẻ đang thấp hơn tổng giá trị linh kiện cấu thành!</span>
                    </div>
                  )}

                  {costPerPc <= Number(price) && costPerPc > 0 && (
                    <div className="mt-3 flex items-start gap-1.5 bg-emerald-50 border border-emerald-100 rounded-[12px] p-3 text-[11px] text-emerald-700 font-semibold leading-relaxed">
                      <span>💰 Lợi nhuận gộp ước tính: {((Number(price) - costPerPc) / Number(price) * 100).toFixed(1)}% ({(Number(price) - costPerPc).toLocaleString("vi-VN")}₫)</span>
                    </div>
                  )}
                </div>

                <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0058be] to-[#2563eb] rounded-full transition-all duration-500"
                    style={{ width: `${(selectedCount / allSlots.length) * 100}%` }}
                  />
                </div>

                {/* AI PSU recommendation block */}
                {(loadingPsu || aiPsuWattage) && (
                  <div className="flex flex-col gap-1.5 bg-blue-50/30 border border-blue-100/40 p-4 rounded-[16px]">
                    {loadingPsu ? (
                      <div className="flex items-center gap-1.5 animate-pulse text-[#0058be] text-[11px] font-bold uppercase tracking-[0.5px]">
                        <Loader2 className="size-3.5 animate-spin" />
                        Đang phân tích nguồn (AI)...
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 text-left">
                        <div className="flex items-center gap-1.5 font-black text-[#0058be] text-[11px] uppercase tracking-[0.5px]">
                          <span>🤖</span> Nguồn AI khuyên dùng: {aiPsuWattage}W
                        </div>
                        <p className="text-[10.5px] text-[#475569] font-medium leading-relaxed mt-0.5">
                          {aiPsuExplanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* AI Bottleneck Report Panel */}
              <BottleneckReport
                build={build}
                bottleneckResult={bottleneckResult}
                loadingBottleneck={loadingBottleneck}
                bottleneckError={bottleneckError}
              />

              {/* Compatibility notes alert panel */}
              {showCompatAlerts && (
                <div className="bg-white border border-slate-200/60 rounded-[24px] p-5 flex flex-col gap-3.5 shadow-sm">
                  <div className="flex items-center gap-2 text-[#0058be] font-extrabold text-[13.5px] uppercase tracking-[0.5px]">
                    <span>💡</span>
                    Linh kiện không tương thích
                  </div>
                  <div className="flex flex-col gap-2">
                    {compatNotes.map((note, idx) => (
                      <div
                        key={idx}
                        className={`text-[12px] px-3.5 py-2.5 rounded-[12px] border font-semibold leading-relaxed ${
                          note.type === "warning"
                            ? "bg-rose-50/40 border-rose-100 text-rose-700"
                            : "bg-blue-50/20 border-blue-100 text-[#0058be]"
                        }`}
                      >
                        {note.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Build consult notes */}
              {aiBuildNote && (
                <div className="bg-white border border-violet-100 rounded-[24px] p-5 flex flex-col gap-3 shadow-sm">
                  <div className="flex items-center gap-2 text-violet-700 font-extrabold text-[13px] uppercase tracking-[0.5px]">
                    <Sparkles className="size-4 text-violet-600 animate-pulse" />
                    Nhận xét Trợ lý AI
                  </div>
                  <div className="text-[12px] text-slate-700 leading-relaxed font-semibold bg-slate-50/60 p-3.5 border border-slate-200/50 rounded-[16px] max-h-[200px] overflow-y-auto">
                    <MarkdownText text={aiBuildNote} />
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200/60 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-[14px] font-semibold text-[#475569] border border-slate-200 rounded-[12px] hover:bg-[#f8fafc] transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-[14px] font-bold text-white bg-[#0058be] rounded-[12px] hover:bg-[#0047a3] transition-colors flex items-center gap-2 disabled:opacity-70 cursor-pointer shadow-md hover:shadow-lg shadow-blue-100"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isEditing ? "Lưu cấu hình PC" : "Xác nhận Lắp ráp"}
            </button>
          </div>

        </form>
      </div>

      {/* Item Selector drawer */}
      {activeSlot && (
        <BuildPickerModal
          slotKey={activeSlot}
          slotLabel={allSlots.find((s) => s.key === activeSlot)?.label ?? activeSlot}
          build={build}
          onSelect={(p) => handleSelect(activeSlot, p)}
          onClose={() => setActiveSlot(null)}
          aiPsuWattage={aiPsuWattage}
        />
      )}

      {/* Compatibility Conflict Resolver Modal */}
      <ConfirmSelectionModal
        showConfirmModal={showConfirmModal}
        pendingSelection={pendingSelection}
        cancelPendingSelection={cancelPendingSelection}
        confirmPendingSelection={confirmPendingSelection}
        build={build}
      />
    </div>
  );
}

interface AdminBuildSlotProps {
  label: string;
  description: string;
  Icon: any;
  product: Product | null;
  qty: number;
  onPick: () => void;
  onRemove: () => void;
  onQtyChange: (newQty: number) => void;
}

function AdminBuildSlot({
  label,
  description,
  Icon,
  product,
  qty,
  onPick,
  onRemove,
  onQtyChange,
}: AdminBuildSlotProps) {
  const imgSrc = product?.thumbnailUrl?.startsWith("http")
    ? product.thumbnailUrl
    : product?.thumbnailUrl
      ? `http://localhost:8080${product.thumbnailUrl}`
      : null;

  const isOutOfStock = product && product.stock === 0;

  const specs = (() => {
    try {
      return product?.specsJson ? JSON.parse(product.specsJson) : {};
    } catch {
      return {};
    }
  })();

  const highlights: string[] = [];
  if (specs.cores) highlights.push(`${specs.cores} nhân`);
  if (specs.threads) highlights.push(`${specs.threads} luồng`);
  if (specs.socket) highlights.push(specs.socket);
  if (specs.vram) highlights.push(`${specs.vram}GB VRAM`);
  if (specs.capacity_gb && !specs.vram)
    highlights.push(`${specs.capacity_gb}GB`);
  if (specs.wattage) highlights.push(`${specs.wattage}W`);
  if (specs.ram_type && !specs.vram && !specs.cores)
    highlights.push(specs.ram_type);

  return (
    <div
      className={`group flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-[20px] border transition-all duration-300 ${
        product
          ? isOutOfStock
            ? "border-red-200 bg-red-50/30"
            : "border-[#0058be]/10 bg-[#eff6ff]/20 hover:border-[#0058be]/30 hover:shadow-[0_8px_30px_rgba(0,88,190,0.08)] hover:-translate-y-0.5"
          : "border-[#cbd5e1]/50 bg-white hover:border-[#0058be]/30 hover:shadow-[0_8px_30px_rgba(0,88,190,0.04)] hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Icon */}
        <div
          className={`size-11 rounded-[12px] flex items-center justify-center shrink-0 border transition-all duration-300 ${
            product
              ? isOutOfStock
                ? "bg-red-100 border-red-200 text-red-500"
                : "bg-[#0058be] border-[#0058be] text-white shadow-sm"
              : "bg-[#f8fafc] border-[#cbd5e1]/40 text-[#94a3b8] group-hover:bg-[#eff6ff] group-hover:border-[#0058be]/30 group-hover:text-[#0058be]"
          }`}
        >
          <Icon className="size-5" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[1px]">
              {label}
            </p>
            {isOutOfStock && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded-full">
                Hết hàng
              </span>
            )}
          </div>

          {product ? (
            <div className="flex items-center gap-2.5">
              {imgSrc ? (
                <div className="size-9 rounded-[8px] bg-white border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                  <img
                    src={imgSrc}
                    alt={product.name}
                    className="size-full object-contain"
                  />
                </div>
              ) : (
                <div className="size-9 rounded-[8px] bg-white border border-slate-100 flex items-center justify-center shrink-0">
                  <Package className="size-3.5 text-slate-300" />
                </div>
              )}
              <div className="min-w-0">
                {product.brand && (
                  <p className="text-[9px] font-bold text-[#0058be] uppercase tracking-[0.8px] leading-none mb-0.5">
                    {product.brand.name}
                  </p>
                )}
                <p className="text-[13px] font-semibold text-[#0f172a] leading-snug line-clamp-1">
                  {product.name}
                </p>
                {highlights.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {highlights.slice(0, 3).map((h, i) => (
                      <span
                        key={i}
                        className="text-[8.5px] bg-white border border-[#cbd5e1]/40 text-[#64748b] px-1 py-0.5 rounded-[4px] font-medium leading-none"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-[#94a3b8]">{description}</p>
          )}
        </div>
      </div>

      {/* Actions & Quantity */}
      <div className="flex items-center justify-between md:justify-end gap-4 border-t border-slate-100/60 pt-2.5 md:pt-0 md:border-t-0 shrink-0">
        {product && (
          <div className="flex items-center gap-3">
            {/* Quantity control */}
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-[10px] border border-[#cbd5e1]/60 shadow-sm">
              <span className="text-[10px] text-[#64748b] font-medium pr-1">SL:</span>
              <button
                type="button"
                onClick={() => onQtyChange(qty - 1)}
                className="size-5 rounded-[4px] flex items-center justify-center hover:bg-slate-100 text-[12px] font-bold text-[#475569] cursor-pointer"
              >
                -
              </button>
              <span className="text-[12px] font-bold text-[#0f172a] w-5 text-center">{qty}</span>
              <button
                type="button"
                onClick={() => onQtyChange(qty + 1)}
                className="size-5 rounded-[4px] flex items-center justify-center hover:bg-slate-100 text-[12px] font-bold text-[#475569] cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Price display */}
            <div className="text-right">
              <p className="text-[14px] font-extrabold text-[#0058be]">
                {(product.price * qty).toLocaleString("vi-VN")}
                <span className="text-[10px] font-normal ml-0.5">₫</span>
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {product ? (
            <>
              <button
                type="button"
                onClick={onPick}
                className="p-1.5 rounded-[8px] bg-white border border-[#cbd5e1]/60 text-[#64748b] hover:border-[#0058be] hover:text-[#0058be] hover:shadow-sm transition-all cursor-pointer"
                title="Đổi linh kiện"
              >
                <Package className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="p-1.5 rounded-[8px] bg-white border border-[#cbd5e1]/60 text-[#64748b] hover:border-red-200 hover:bg-red-50 hover:text-red-500 hover:shadow-sm transition-all cursor-pointer"
                title="Gỡ bỏ"
              >
                <Trash2 className="size-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onPick}
              className="flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-white border border-[#cbd5e1] text-[#0f172a] text-[12px] font-bold shadow-sm hover:border-[#0058be] hover:text-[#0058be] hover:bg-[#eff6ff]/35 transition-all cursor-pointer"
            >
              <Plus className="size-3.5" />
              Chọn linh kiện
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
