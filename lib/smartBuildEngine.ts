import { Product } from "./api";
import {
  BuildState,
  normalizeHardwareName,
  getRamCapacityAndBus,
  isCaseCompatibleWithMb,
  getProductSpecs,
  isCoolerCompatibleWithCpu,
  SLOTS,
} from "./hardwareUtils";

export interface SmartBuildInputs {
  smartBuildNeed: string;
  smartBuildBudget: string;
  cpus: Product[];
  mainboards: Product[];
  rams: Product[];
  vgas: Product[];
  storages: Product[];
  psus: Product[];
  cases: Product[];
  coolers: Product[];
  monitors: Product[];
  fans: Product[];
  queryBottleneck: (cpu: Product, gpu: Product, ram: Product) => Promise<number>;
  statusCallback?: (status: string) => Promise<void>;
}

export interface SmartBuildResult {
  newBuild: BuildState;
  finalCpu: Product;
  finalMb: Product;
  finalRam: Product;
  finalVga: Product | null;
  selectedStorage: Product | null;
  selectedCase: Product | null;
}

export async function generateSmartBuild(inputs: SmartBuildInputs): Promise<SmartBuildResult> {
  const {
    smartBuildNeed,
    smartBuildBudget,
    cpus,
    mainboards,
    rams,
    vgas,
    storages,
    psus,
    cases,
    coolers,
    monitors,
    fans,
    queryBottleneck,
    statusCallback,
  } = inputs;

  const updateStatus = async (status: string, delay = 0) => {
    if (statusCallback) {
      await statusCallback(status);
    }
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  };

  
  await updateStatus("Đang cân đối ngân sách cho từng linh kiện...", 300);

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

  
  const safeQueryBottleneck = async (
    cpu: Product,
    gpu: Product,
    ram: Product,
  ): Promise<number> => {
    try {
      return await queryBottleneck(cpu, gpu, ram);
    } catch {
      return checkStaticBottleneck(cpu.name, gpu.name);
    }
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

  
  const getCompatibleRam = (
    mbProduct: Product,
    targetRamBudget: number,
  ): Product | null => {
    const mbRamType = getProductSpecs(mbProduct).ram_type || "DDR4";
    const compatibleRams = sortedRams.filter((ram) => {
      const ramType = getProductSpecs(ram).ram_type;
      return ramType && ramType.toLowerCase() === mbRamType.toLowerCase();
    });
    if (compatibleRams.length === 0) return null;
    return [...compatibleRams].sort(
      (a, b) =>
        Math.abs(a.price - targetRamBudget) -
        Math.abs(b.price - targetRamBudget),
    )[0];
  };

  
  await updateStatus("Đang ghép nối CPU và Mainboard tương thích socket...", 400);

  let currentCpuIdx = findClosestIndex(sortedCpus, cpuBudget);
  const initialCore = findCompatibleCpuAndMainboard(currentCpuIdx, mbBudget);
  if (!initialCore) {
    throw new Error("Không tìm thấy tổ hợp CPU + Mainboard tương thích nào trong cửa hàng!");
  }

  let currCpu = initialCore.cpu;
  let currMb = initialCore.mb;
  currentCpuIdx = initialCore.cpuIdx;

  await updateStatus(
    `Đã khớp CPU [${currCpu.name}] với Mainboard [${currMb.name}]. Đang chọn RAM & VGA...`,
    400,
  );

  let currRam = getCompatibleRam(currMb, ramBudget);
  if (!currRam && sortedRams.length > 0) {
    currRam = [...sortedRams].sort(
      (a, b) => Math.abs(a.price - ramBudget) - Math.abs(b.price - ramBudget),
    )[0];
  }

  let currentVgaIdx = findClosestIndex(sortedVgas, vgaBudget);
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

    await updateStatus(
      `[Vòng lặp ${loopCount + 1}] Đang kiểm tra bottleneck tương quan hiệu năng...`,
      350,
    );

    let bottleneckVal = 0;
    if (currVga) {
      bottleneckVal = await safeQueryBottleneck(currCpu, currVga, currRam);
    }

    if (bottleneckVal === 0) {
      await updateStatus("Cấu hình đã cân bằng tuyệt đối! Không phát hiện nghẽn cổ chai.", 300);
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
      await updateStatus("Nghẽn CPU! Đang điều chỉnh cấu hình nâng CPU hoặc hạ VGA...", 400);
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
      await updateStatus("Nghẽn GPU! Đang điều chỉnh cấu hình nâng VGA hoặc hạ CPU...", 400);
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
    } else if (bottleneckVal === 3) {
      await updateStatus("Nghẽn RAM! Đang tìm RAM chất lượng hoặc bus cao hơn...", 400);
      const mbRamType = getProductSpecs(currMb).ram_type || "DDR4";
      const compatibleRams = sortedRams.filter((ram) => {
        const ramType = getProductSpecs(ram).ram_type;
        return ramType && ramType.toLowerCase() === mbRamType.toLowerCase();
      });
      const currRamIdx = compatibleRams.findIndex((r) => r.id === currRam?.id);
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
    throw new Error("Không tìm thấy cấu hình tối thiểu phù hợp!");
  }

  
  await updateStatus("Đang phân bổ các linh kiện phụ (SSD, Vỏ máy, Tản nhiệt)...", 400);
  const corePrice =
    finalCpu.price +
    finalMb.price +
    finalRam.price +
    (finalVga ? finalVga.price : 0);
  const leftoverBudget = targetBudget - corePrice;

  
  await updateStatus("Đang tính toán công suất PSU đề xuất...", 0);
  const cpuTdp = Number(getProductSpecs(finalCpu).tdp_w) || 100;
  const gpuTdp = finalVga ? (Number(getProductSpecs(finalVga).tdp_w) || 200) : 0;
  const calculatedWattage = cpuTdp + gpuTdp + 200;

  const PSU_WATTAGES = [250, 350, 450, 550, 650, 750, 850, 1000, 1200, 1300, 1600];
  const psuWattageNeeded = PSU_WATTAGES.reduce((prev, curr) => {
    const diffCurr = Math.abs(curr - calculatedWattage);
    const diffPrev = Math.abs(prev - calculatedWattage);
    if (diffCurr === diffPrev) {
      return curr > prev ? curr : prev;
    }
    return diffCurr < diffPrev ? curr : prev;
  });

  const compatiblePsus = psus.filter((psu) => {
    const specs = getProductSpecs(psu);
    const watt = Number(specs.wattage) || Number(specs.watt) || 500;
    return watt >= psuWattageNeeded;
  });
  const selectedPsu =
    compatiblePsus.length > 0
      ? [...compatiblePsus].sort((a, b) => a.price - b.price)[0]
      : psus.sort((a, b) => b.price - a.price)[0];

  
  const mbFormFactor = getProductSpecs(finalMb).form_factor || "ATX";
  const compatibleCases = cases.filter((c) =>
    isCaseCompatibleWithMb(c, mbFormFactor),
  );
  const caseBudget = leftoverBudget * 0.3;
  const selectedCase =
    compatibleCases.length > 0
      ? [...compatibleCases].sort(
          (a, b) => Math.abs(a.price - caseBudget) - Math.abs(b.price - caseBudget),
        )[0]
      : cases.sort((a, b) => a.price - b.price)[0];

  
  const selectedStorage =
    storages.length > 0
      ? [...storages].sort(
          (a, b) =>
            Math.abs(a.price - leftoverBudget * 0.4) -
            Math.abs(b.price - leftoverBudget * 0.4),
        )[0]
      : null;

  
  const mbSocket = getProductSpecs(finalMb).socket || "";
  const cpuSocket = getProductSpecs(finalCpu).socket || mbSocket;
  const compatibleCoolers = coolers.filter((col) =>
    isCoolerCompatibleWithCpu(col, cpuSocket)
  );

  
  const cpuNameLower = finalCpu.name.toLowerCase();
  const isHighEndCpu =
    cpuNameLower.includes("i9") ||
    cpuNameLower.includes("i7") ||
    cpuNameLower.includes("ryzen 9") ||
    cpuNameLower.includes("ryzen 7") ||
    Number(getProductSpecs(finalCpu).tdp_w) >= 125;

  const isLiquidCooler = (cooler: Product) => {
    const name = cooler.name.toLowerCase();
    const specs = getProductSpecs(cooler);
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

  const coolerBudget = leftoverBudget * 0.3;
  const selectedCooler =
    candidateCoolers.length > 0
      ? [...candidateCoolers].sort(
          (a, b) => Math.abs(a.price - coolerBudget) - Math.abs(b.price - coolerBudget),
        )[0]
      : coolers.sort((a, b) => a.price - b.price)[0];

  
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

  
  await updateStatus("Đang kiểm tra công suất nguồn PSU cuối cùng...", 500);

  const finalPsuWattageNeeded = psuWattageNeeded;
  const currentPsu = newBuild.psu;
  const currentPsuSpecs = currentPsu ? getProductSpecs(currentPsu) : {};
  const currentPsuWattage =
    Number(currentPsuSpecs.wattage) || Number(currentPsuSpecs.watt) || 0;

  if (!currentPsu || currentPsuWattage < finalPsuWattageNeeded) {
    await updateStatus(
      `Công suất nguồn (${currentPsuWattage}W) không đủ! Đang tìm nguồn tối thiểu ${finalPsuWattageNeeded}W...`,
      800,
    );

    const strongerPsus = psus
      .filter((psu) => {
        const specs = getProductSpecs(psu);
        const watt = Number(specs.wattage) || Number(specs.watt) || 0;
        return watt >= finalPsuWattageNeeded;
      })
      .sort((a, b) => a.price - b.price);

    if (strongerPsus.length > 0) {
      newBuild.psu = strongerPsus[0];
      await updateStatus(
        `Đã đổi nguồn sang: ${strongerPsus[0].name} (${Number(getProductSpecs(strongerPsus[0]).wattage) || Number(getProductSpecs(strongerPsus[0]).watt)}W)`,
        600,
      );
    } else {
      await updateStatus("Không tìm thấy bộ nguồn công suất cao hơn trong kho.", 600);
    }
  } else {
    await updateStatus(
      `Nguồn hiện tại đạt yêu cầu: ${currentPsuWattage}W (Cần tối thiểu ${finalPsuWattageNeeded}W)`,
      600,
    );
  }

  return {
    newBuild,
    finalCpu,
    finalMb,
    finalRam,
    finalVga,
    selectedStorage,
    selectedCase,
  };
}
