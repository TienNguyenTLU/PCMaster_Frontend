import React, { useState, useEffect } from "react";

interface DualRangeSliderProps {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (val: [number, number]) => void;
}

const formatNumber = (val: number) => {
  return new Intl.NumberFormat("vi-VN").format(val);
};

const parseNumber = (val: string) => {
  const clean = val.replace(/\D/g, "");
  return clean ? parseInt(clean, 10) : 0;
};

export default function DualRangeSlider({
  min,
  max,
  step,
  value,
  onChange,
}: DualRangeSliderProps) {
  const [minInput, setMinInput] = useState(formatNumber(value[0]));
  const [maxInput, setMaxInput] = useState(formatNumber(value[1]));

  const val0 = value[0];
  const val1 = value[1];

  useEffect(() => {
    Promise.resolve().then(() => {
      setMinInput(formatNumber(val0));
    });
  }, [val0]);

  useEffect(() => {
    Promise.resolve().then(() => {
      setMaxInput(formatNumber(val1));
    });
  }, [val1]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value), value[1] - step);
    onChange([v, value[1]]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value), value[0] + step);
    onChange([value[0], v]);
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setMinInput(rawVal);
    const parsed = parseNumber(rawVal);
    if (parsed <= value[1]) {
      onChange([parsed, value[1]]);
    }
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setMaxInput(rawVal);
    const parsed = parseNumber(rawVal);
    if (parsed >= value[0]) {
      onChange([value[0], parsed]);
    }
  };

  const handleMinBlur = () => {
    const parsed = parseNumber(minInput);
    const capped = Math.min(Math.max(parsed, min), value[1] - step);
    onChange([capped, value[1]]);
    setMinInput(formatNumber(capped));
  };

  const handleMaxBlur = () => {
    const parsed = parseNumber(maxInput);
    const capped = Math.max(Math.min(parsed, max), value[0] + step);
    onChange([value[0], capped]);
    setMaxInput(formatNumber(capped));
  };

  const leftPercent = ((value[0] - min) / (max - min)) * 100;
  const rightPercent = 100 - ((value[1] - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-5 px-1 py-1">
      {}
      <div className="relative h-2 bg-[#f1f5f9] rounded-full mt-3">
        <div
          className="absolute h-full bg-gradient-to-r from-[#0058be] to-[#3b82f6] rounded-full pointer-events-none shadow-sm"
          style={{ left: `${leftPercent}%`, right: `${rightPercent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleMinChange}
          className="absolute w-full top-0 h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[#0058be] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-95 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-[#0058be] [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:active:scale-95"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={handleMaxChange}
          className="absolute w-full top-0 h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[#0058be] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-95 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-[#0058be] [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:active:scale-95"
        />
      </div>

      {}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.5px]">Giá tối thiểu</span>
          <div className="relative">
            <input
              type="text"
              value={minInput}
              onChange={handleMinInputChange}
              onBlur={handleMinBlur}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] pl-3 pr-7 py-2 text-[12px] font-bold text-[#1e293b] focus:outline-none focus:border-[#0058be] focus:ring-2 focus:ring-[#0058be]/10 transition-all shadow-sm"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#94a3b8]">
              ₫
            </span>
          </div>
        </div>

        <span className="text-[#cbd5e1] text-[14px] font-bold mt-5">-</span>

        <div className="flex-1 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.5px]">Giá tối đa</span>
          <div className="relative">
            <input
              type="text"
              value={maxInput}
              onChange={handleMaxInputChange}
              onBlur={handleMaxBlur}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] pl-3 pr-7 py-2 text-[12px] font-bold text-[#1e293b] focus:outline-none focus:border-[#0058be] focus:ring-2 focus:ring-[#0058be]/10 transition-all shadow-sm"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#94a3b8]">
              ₫
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
