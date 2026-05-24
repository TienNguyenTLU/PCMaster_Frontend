'use client';

import React from 'react';

interface DualRangeSliderProps {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (val: [number, number]) => void;
}

export default function DualRangeSlider({
  min,
  max,
  step,
  value,
  onChange,
}: DualRangeSliderProps) {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value), value[1] - step);
    onChange([v, value[1]]);
  };
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value), value[0] + step);
    onChange([value[0], v]);
  };

  const leftPercent = ((value[0] - min) / (max - min)) * 100;
  const rightPercent = 100 - ((value[1] - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-4 px-1 py-1">
      <div className="relative h-1.5 bg-[#e2e8f0] rounded-full mt-2">
        <div
          className="absolute h-full bg-[#0058be] rounded-full pointer-events-none"
          style={{ left: `${leftPercent}%`, right: `${rightPercent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleMinChange}
          className="absolute w-full -top-1.5 h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0058be] [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={handleMaxChange}
          className="absolute w-full -top-1.5 h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0058be] [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="number"
            value={value[0]}
            onChange={e => onChange([Number(e.target.value), value[1]])}
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-2 pr-5 py-1.5 text-[11px] font-medium text-[#374151] focus:outline-none focus:border-[#0058be] transition-all"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#94a3b8]">₫</span>
        </div>
        <span className="text-[#94a3b8] text-[12px] font-medium">-</span>
        <div className="flex-1 relative">
          <input
            type="number"
            value={value[1]}
            onChange={e => onChange([value[0], Number(e.target.value)])}
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-2 pr-5 py-1.5 text-[11px] font-medium text-[#374151] focus:outline-none focus:border-[#0058be] transition-all"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#94a3b8]">₫</span>
        </div>
      </div>
    </div>
  );
}
