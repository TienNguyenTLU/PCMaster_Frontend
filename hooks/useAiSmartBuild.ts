"use client";

import { useState } from "react";
import { Product, adminAPI, chatbotAPI } from "@/lib/api";
import {
  SLOTS,
  normalizeHardwareName,
  getRamCapacityAndBus,
  isCaseCompatibleWithMb,
  BuildState,
} from "@/hooks/usePcBuildState";
import toast from "react-hot-toast";

interface UseAiSmartBuildProps {
  build: BuildState;
  setBuild: React.Dispatch<React.SetStateAction<BuildState>>;
  showSmartBuildDropdown: boolean;
  setShowSmartBuildDropdown: React.Dispatch<React.SetStateAction<boolean>>;
}





export function useAiSmartBuild({
  build,
  setBuild,
  showSmartBuildDropdown,
  setShowSmartBuildDropdown,
}: UseAiSmartBuildProps) {
  
  const [smartBuildNeed, setSmartBuildNeed] = useState("gaming");
  const [smartBuildBudget, setSmartBuildBudget] = useState("20-30");
  const [isGeneratingSmartBuild, setIsGeneratingSmartBuild] = useState(false);
  const [smartBuildStatus, setSmartBuildStatus] = useState<string | null>(null);
  const [aiBuildNote, setAiBuildNote] = useState<string | null>(null);

  const getProductSpecs = (p?: Product | null) => {
    if (!p || !p.specsJson) return {};
    try {
      return JSON.parse(p.specsJson);
    } catch {
      return {};
    }
  };

  
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

      
      setSmartBuildStatus("Đang tải danh sách linh kiện khả dụng từ cửa hàng...");
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
      const storages = (storageRes.content || []).filter((p: any) => p.stock > 0);
      const psus = (psuRes.content || []).filter((p: any) => p.stock > 0);
      const cases = (caseRes.content || []).filter((p: any) => p.stock > 0);
      const coolers = (coolerRes.content || []).filter((p: any) => p.stock > 0);
      const monitors = (monitorRes.content || []).filter((p: any) => p.stock > 0);
      const fans = (fanRes.content || []).filter((p: any) => p.stock > 0);

      if (cpus.length === 0 || mainboards.length === 0 || rams.length === 0) {
        toast.error("Cửa hàng không đủ linh kiện cốt lõi (CPU, Mainboard, RAM) để tự động xây dựng cấu hình!");
        setIsGeneratingSmartBuild(false);
        setSmartBuildStatus(null);
        return;
      }

      
      setSmartBuildStatus("Đang cân đối ngân sách cho từng linh kiện...");
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

      const getSpecs = (p: Product) => {
        if (!p || !p.specsJson) return {};
        try {
          return JSON.parse(p.specsJson);
        } catch {
          return {};
        }
      };

      
      const checkStaticBottleneck = (cpuName: string, gpuName: string): number => {
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
        if (isCpuH && !isGpuH && !isGpuM) return 2;
        if (!isCpuH && !isCpuM && isGpuH) return 1;
        if (!isCpuH && !isCpuM && isGpuM) return 1;
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
            if (data && data.success && data.predictions && data.predictions.length > 0) {
              const pred1080 = data.predictions.find((p: any) => p.resolution === "1080");
              if (pred1080) return Number(pred1080.predicted_type);
            }
          }
        } catch (err) {
          console.error("Bottleneck ML predict failed during smart build:", err);
        }
        return checkStaticBottleneck(cpu.name, gpu.name);
      };

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

      const findCompatibleCpuAndMainboard = (
        startCpuIdx: number,
        targetMbBudget: number,
      ): { cpu: Product; mb: Product; cpuIdx: number } | null => {
        const queue: number[] = [startCpuIdx];
        const visited = new Set<number>();
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
            return mbSocket && mbSocket.toLowerCase() === cpuSocket.toLowerCase();
          });
          if (compatibleMbs.length > 0) {
            const bestMb = [...compatibleMbs].sort(
              (a, b) =>
                Math.abs(a.price - targetMbBudget) - Math.abs(b.price - targetMbBudget),
            )[0];
            return { cpu, mb: bestMb, cpuIdx: idx };
          }
        }
        return null;
      };

      const getCompatibleRam = (mbProduct: Product, targetRamBudget: number): Product | null => {
        const mbRamType = getSpecs(mbProduct).ram_type || "DDR4";
        const compatibleRams = sortedRams.filter((ram) => {
          const ramType = getSpecs(ram).ram_type;
          return ramType && ramType.toLowerCase() === mbRamType.toLowerCase();
        });
        if (compatibleRams.length === 0) return null;
        return [...compatibleRams].sort(
          (a, b) =>
            Math.abs(a.price - targetRamBudget) - Math.abs(b.price - targetRamBudget),
        )[0];
      };

      
      setSmartBuildStatus("Đang ghép nối CPU và Mainboard tương thích socket...");
      await new Promise((resolve) => setTimeout(resolve, 400));
      let currentCpuIdx = findClosestIndex(sortedCpus, cpuBudget);
      const initialCore = findCompatibleCpuAndMainboard(currentCpuIdx, mbBudget);
      if (!initialCore) {
        toast.error("Không tìm thấy tổ hợp CPU + Mainboard tương thích nào trong cửa hàng!");
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
          (a, b) => Math.abs(a.price - ramBudget) - Math.abs(b.price - ramBudget),
        )[0];
      }
      const currentVgaIdx = findClosestIndex(sortedVgas, vgaBudget);
      let currVga = sortedVgas.length > 0 ? sortedVgas[currentVgaIdx] : null;

      
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
        setSmartBuildStatus(`[Vòng lặp ${loopCount + 1}] Đang kiểm tra bottleneck tương quan hiệu năng...`);
        await new Promise((resolve) => setTimeout(resolve, 350));
        let bottleneckVal = 0;
        if (currVga) {
          bottleneckVal = await queryBottleneck(currCpu, currVga, currRam);
        }
        if (bottleneckVal === 0) {
          setSmartBuildStatus("Cấu hình đã cân bằng tuyệt đối! Không phát hiện nghẽn cổ chai.");
          await new Promise((resolve) => setTimeout(resolve, 300));
          bestConfig = {
            cpu: currCpu,
            mb: currMb,
            ram: currRam,
            vga: currVga,
            bottleneck: 0,
          };
          break;
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
        if (bottleneckVal === 1 && currVga) {
          setSmartBuildStatus("Nghẽn CPU! Đang điều chỉnh cấu hình nâng CPU hoặc hạ VGA...");
          await new Promise((resolve) => setTimeout(resolve, 400));
          const cpuPriceIndex = sortedCpus.findIndex((p) => p.id === currCpu.id);
          if (cpuPriceIndex < sortedCpus.length - 1) {
            const nextCpu = sortedCpus[cpuPriceIndex + 1];
            const mbCompatible = getSpecs(currMb).socket === getSpecs(nextCpu).socket;
            if (mbCompatible) {
              currCpu = nextCpu;
            } else {
              const newCore = findCompatibleCpuAndMainboard(cpuPriceIndex + 1, mbBudget);
              if (newCore) {
                currCpu = newCore.cpu;
                currMb = newCore.mb;
                currRam = getCompatibleRam(currMb, ramBudget) || currRam;
              }
            }
          } else {
            const vgaPriceIndex = sortedVgas.findIndex((p) => p.id === currVga!.id);
            if (vgaPriceIndex > 0) {
              currVga = sortedVgas[vgaPriceIndex - 1];
            } else {
              break;
            }
          }
        } else if (bottleneckVal === 2 && currVga) {
          setSmartBuildStatus("Nghẽn GPU! Đang điều chỉnh cấu hình nâng VGA hoặc hạ CPU...");
          await new Promise((resolve) => setTimeout(resolve, 400));
          const vgaPriceIndex = sortedVgas.findIndex((p) => p.id === currVga!.id);
          if (vgaPriceIndex < sortedVgas.length - 1) {
            currVga = sortedVgas[vgaPriceIndex + 1];
          } else {
            const cpuPriceIndex = sortedCpus.findIndex((p) => p.id === currCpu.id);
            if (cpuPriceIndex > 0) {
              const prevCpu = sortedCpus[cpuPriceIndex - 1];
              const mbCompatible = getSpecs(currMb).socket === getSpecs(prevCpu).socket;
              if (mbCompatible) {
                currCpu = prevCpu;
              } else {
                const newCore = findCompatibleCpuAndMainboard(cpuPriceIndex - 1, mbBudget);
                if (newCore) {
                  currCpu = newCore.cpu;
                  currMb = newCore.mb;
                  currRam = getCompatibleRam(currMb, ramBudget) || currRam;
                }
              }
            } else {
              break;
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

      
      setSmartBuildStatus("Đang tự động lựa chọn các linh kiện còn lại...");
      await new Promise((resolve) => setTimeout(resolve, 400));
      const getOptimalComponent = (pool: Product[], targetPrice: number): Product | null => {
        if (pool.length === 0) return null;
        return [...pool].sort(
          (a, b) => Math.abs(a.price - targetPrice) - Math.abs(b.price - targetPrice),
        )[0];
      };

      const mbFormFactor = getSpecs(finalMb).form_factor || "ATX";
      const compatibleCases = cases.filter((c) => isCaseCompatibleWithMb(c, mbFormFactor));
      const selectedCase = getOptimalComponent(compatibleCases, targetBudget * 0.05) || cases[0];
      const cpuTdp = Number(getSpecs(finalCpu).tdp_w) || 65;
      const gpuTdp = finalVga ? Number(getProductSpecs(finalVga).tdp_w) || 200 : 0;
      const psuWattageNeeded = cpuTdp + gpuTdp + 150;

      const compatiblePsus = psus.filter((p) => {
        const w = Number(getProductSpecs(p).wattage) || Number(getProductSpecs(p).watt) || 0;
        return w >= psuWattageNeeded;
      });
      const selectedPsu = getOptimalComponent(compatiblePsus, targetBudget * 0.07) || psus[0];
      const selectedStorage = getOptimalComponent(storages, targetBudget * 0.08) || storages[0];
      const cpuSocket = getSpecs(finalCpu).socket;

      const compatibleCoolers = coolers.filter((col) => {
        const sockets =
          getSpecs(col).supported_sockets || getSpecs(col).supported_socket || getSpecs(col).socket;
        if (!sockets) return true;
        const cleanSocket = cpuSocket.toLowerCase().replace(/[^a-z0-9]/g, "");
        const isSocketMatch = (supportedSocketStr: string) => {
          const cleanSupported = supportedSocketStr.toLowerCase().replace(/[^a-z0-9]/g, "");
          return cleanSupported.includes(cleanSocket) || cleanSocket.includes(cleanSupported);
        };
        if (Array.isArray(sockets)) {
          return sockets.some((s) => isSocketMatch(String(s)));
        }
        return isSocketMatch(String(sockets));
      });

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

      const newBuild: BuildState = Object.fromEntries(SLOTS.map((s) => [s.key, null]));
      newBuild.cpu = finalCpu;
      newBuild.mainboard = finalMb;
      newBuild.ram = finalRam;
      if (finalVga) newBuild.vga = finalVga;
      if (selectedPsu) newBuild.psu = selectedPsu;
      if (selectedCase) newBuild.case = selectedCase;
      if (selectedStorage) newBuild.storage = selectedStorage;
      if (selectedCooler) newBuild.cooler = selectedCooler;

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

      
      setSmartBuildStatus("Đang kiểm tra công suất nguồn PSU cuối cùng...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      const finalPsuWattageNeeded = psuWattageNeeded;
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
          setSmartBuildStatus("Không tìm thấy bộ nguồn công suất cao hơn trong kho.");
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      } else {
        setSmartBuildStatus(
          `Nguồn hiện tại đạt yêu cầu: ${currentPsuWattage}W (Cần tối thiểu ${finalPsuWattageNeeded}W)`,
        );
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
      setBuild(newBuild);

      
      setSmartBuildStatus("Đang gửi cấu hình tới Trợ lý AI để lấy nhận xét chuyên gia...");
      const promptMessage = `Bạn là chuyên gia PCMaster. Tôi đã tự động build cấu hình PC sau:
- CPU: ${finalCpu.name}
- Mainboard: ${finalMb.name}
- RAM: ${finalRam?.name || "Chưa chọn"}
- VGA: ${finalVga ? finalVga.name : "Chưa chọn"}
- Storage: ${selectedStorage ? selectedStorage.name : "Chưa chọn"}
- Nguồn (PSU): ${newBuild.psu ? newBuild.psu.name : "Chưa chọn"}
- Vỏ máy (Case): ${selectedCase ? selectedCase.name : "Chưa chọn"}

Hãy viết nhận xét ngắn gọn khoảng 3-4 câu bằng tiếng Việt giải thích tại sao cấu hình này cực kỳ phù hợp cho nhu cầu ${selectedNeed} trong tầm giá ${selectedBudget} VNĐ, đảm bảo hiệu năng tối ưu và không bị nghẽn cổ chai.`;

      try {
        const response = await chatbotAPI.chat(promptMessage, [], "consult");
        const advice = response.message;
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
        const fallbackAdvice = `Cấu hình được chọn tự động dựa trên phân tích tương thích phần cứng: CPU [${finalCpu.name}] đi kèm Bo mạch chủ [${finalMb.name}] và RAM [${finalRam?.name || "Chưa chọn"}]. Card màn hình [${finalVga ? finalVga.name : "Onboard GPU"}] hoạt động mượt mà không gây nghẽn cổ chai trong phân khúc giá.`;
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

  return {
    smartBuildNeed,
    setSmartBuildNeed,
    smartBuildBudget,
    setSmartBuildBudget,
    isGeneratingSmartBuild,
    smartBuildStatus,
    aiBuildNote,
    setAiBuildNote,
    handleSmartBuildSubmit,
  };
}
