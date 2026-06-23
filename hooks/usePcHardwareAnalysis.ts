"use client";

import { useState, useEffect } from "react";
import { Product, aiBuildAPI } from "@/lib/api";
import {
  normalizeHardwareName,
  getRamCapacityAndBus,
  BuildState,
} from "@/hooks/usePcBuildState";

interface UsePcHardwareAnalysisProps {
  build: BuildState;
}

// ==========================================
// HOOK PHÂN TÍCH HIỆU NĂNG PHẦN CỨNG (PSU & BOTTLENECK)
// ==========================================

export function usePcHardwareAnalysis({ build }: UsePcHardwareAnalysisProps) {
  // Trạng thái phân tích nghẽn cổ chai
  const [bottleneckResult, setBottleneckResult] = useState<any>(null);
  const [loadingBottleneck, setLoadingBottleneck] = useState(false);
  const [bottleneckError, setBottleneckError] = useState<string | null>(null);

  // Trạng thái gợi ý nâng cấp CPU & công suất nguồn PSU
  const [cpuAdvice, setCpuAdvice] = useState<string | null>(null);
  const [aiPsuWattage, setAiPsuWattage] = useState<number | null>(null);
  const [aiPsuExplanation, setAiPsuExplanation] = useState<string | null>(null);
  const [loadingPsu, setLoadingPsu] = useState(false);

  const getProductSpecs = (p?: Product | null) => {
    if (!p || !p.specsJson) return {};
    try {
      return JSON.parse(p.specsJson);
    } catch {
      return {};
    }
  };

  // Tự động gọi API dự đoán Bottleneck khi thay đổi CPU, VGA, hoặc RAM
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
      const cpuName = normalizeHardwareName(cpu.name, "cpu");
      const gpuName = normalizeHardwareName(vga.name, "gpu");
      const { capacity: ramCapacity, busSpeed: ramBusSpeed } = getRamCapacityAndBus(ram);

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
        setBottleneckError(err.message || "Không thể kết nối tới dịch vụ phân tích AI.");
      } finally {
        setLoadingBottleneck(false);
      }
    };
    calculateBottleneck();
  }, [build.cpu, build.vga, build.ram]);

  // Tự động lấy lời khuyên nâng cấp CPU từ AI
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

  // Tự động lấy đề xuất công suất PSU từ AI
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
        const cpuSpecs = getProductSpecs(cpu);
        const vgaSpecs = getProductSpecs(vga);
        const totalTdp = (Number(cpuSpecs.tdp_w) || 0) + (Number(vgaSpecs.tdp_w) || 0);
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

  return {
    bottleneckResult,
    loadingBottleneck,
    bottleneckError,
    cpuAdvice,
    aiPsuWattage,
    aiPsuExplanation,
    loadingPsu,
  };
}
