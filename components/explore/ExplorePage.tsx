'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, ChevronDown, X, ShoppingCart, Package, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { adminAPI, Product, Category, Brand } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import { CldImage } from 'next-cloudinary';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
type SpecFilterType = 'text' | 'number' | 'multiselect' | 'select' | 'boolean' | 'range';
interface SpecFilterDef {
  key: string;
  label: string;
  type: SpecFilterType;
  options?: string[];
  placeholder?: string;
}

// ─── Full SPECS_BY_CATEGORY (mirrors ProductFormModal exactly) ────────────────
const SPECS_BY_CATEGORY: Record<string, SpecFilterDef[]> = {
  case: [
    { key: 'size', label: 'Kích thước', type: 'select', options: ['Mini-ITX Desktop', 'Mini Tower', 'Mid Tower', 'Full Tower', 'Super Tower', 'HTPC / Desktop', 'Open Frame'] },
    { key: 'supported_mainboards', label: 'Bo mạch hỗ trợ', type: 'multiselect', options: ['Mini-ITX', 'Micro-ATX', 'ATX', 'E-ATX', 'SSI CEB', 'SSI EEB', 'XL-ATX'] },
    { key: 'max_gpu_length_mm', label: 'Độ dài GPU tối đa (mm)', type: 'range', placeholder: '365' },
    { key: 'max_cpu_cooler_height_mm', label: 'Chiều cao CPU Cooler tối đa (mm)', type: 'range', placeholder: '164' },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
  ],
  cooler: [
    { key: 'type', label: 'Loại tản nhiệt', type: 'select', options: ['Liquid Cooling', 'Air Cooling'] },
    { key: 'supported_sockets', label: 'Socket hỗ trợ', type: 'multiselect', options: [
      'AM5', 'AM4', 'AM3+', 'AM3', 'AM2+', 'AM2', 'FM2+', 'FM2', 'FM1', 'sTRX4', 'sTR4', 'sWRX8', 'SP3',
      'LGA1851', 'LGA1700', 'LGA1200', 'LGA1151', 'LGA1150', 'LGA1155', 'LGA1156', 'LGA2066', 'LGA2011', 'LGA1366', 'LGA775'
    ] },
    { key: 'tdp_rating_w', label: 'TDP hỗ trợ (W)', type: 'range', placeholder: '300' },
    { key: 'radiator_size_mm', label: 'Radiator (mm)', type: 'select', options: ['120', '140', '240', '280', '360', '420'] },
    { key: 'fan_size_mm', label: 'Kích thước quạt (mm)', type: 'select', options: ['80', '92', '120', '140', '200'] },
    { key: 'noise_level_db', label: 'Độ ồn (dB)', type: 'range', placeholder: '30' },
    { key: 'has_rgb', label: 'Có RGB', type: 'boolean' },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
  ],
  cpu: [
    { key: 'series', label: 'Series', type: 'select', options: [
      'Core i3', 'Core i5', 'Core i7', 'Core i9', 'Core Ultra 5', 'Core Ultra 7', 'Core Ultra 9', 
      'Ryzen 3', 'Ryzen 5', 'Ryzen 7', 'Ryzen 9', 'Ryzen Threadripper', 'Pentium', 'Celeron', 'Xeon'
    ] },
    { key: 'socket', label: 'Socket', type: 'select', options: [
      'AM5', 'AM4', 'AM3+', 'AM3', 'AM2+', 'AM2', 'FM2+', 'FM2', 'FM1', 'sTRX4', 'sTR4', 'sWRX8', 'SP3',
      'LGA1851', 'LGA1700', 'LGA1200', 'LGA1151', 'LGA1150', 'LGA1155', 'LGA1156', 'LGA2066', 'LGA2011', 'LGA1366', 'LGA775'
    ] },
    { key: 'cores', label: 'Số nhân', type: 'select', options: ['2', '4', '6', '8', '10', '12', '14', '16', '20', '24', '32', '64'] },
    { key: 'threads', label: 'Số luồng', type: 'select', options: ['2', '4', '8', '12', '16', '20', '24', '28', '32', '48', '64', '128'] },
    { key: 'performance_score', label: 'Điểm hiệu năng', type: 'range', placeholder: '21000' },
    { key: 'base_clock_ghz', label: 'Xung cơ bản (GHz)', type: 'range', placeholder: '3.5' },
    { key: 'boost_clock_ghz', label: 'Xung tối đa (GHz)', type: 'range', placeholder: '5.0' },
    { key: 'cache_mb', label: 'Bộ nhớ đệm (MB)', type: 'range', placeholder: '16' },
    { key: 'tdp_w', label: 'TDP (W)', type: 'range', placeholder: '65' },
    { key: 'integrated_gpu', label: 'GPU tích hợp', type: 'boolean' },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
  ],
  fan: [
    { key: 'size_mm', label: 'Kích thước (mm)', type: 'select', options: ['80', '92', '120', '140', '200'] },
    { key: 'fan_speed_rpm', label: 'Tốc độ quay (RPM)', type: 'range', placeholder: '2100' },
    { key: 'airflow_cfm', label: 'Lưu lượng gió (CFM)', type: 'range', placeholder: '72.8' },
    { key: 'noise_level_db', label: 'Độ ồn (dB)', type: 'range', placeholder: '36' },
    { key: 'connection_type', label: 'Chuẩn cắm', type: 'text', placeholder: '4-pin PWM' },
    { key: 'bearing_type', label: 'Loại trục', type: 'text', placeholder: 'Magnetic Dome' },
    { key: 'has_rgb', label: 'Có RGB', type: 'boolean' },
    { key: 'is_addressable_rgb', label: 'LED ARGB', type: 'boolean' },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
  ],
  mainboard: [
    { key: 'chipset', label: 'Chipset', type: 'select', options: [
      'Z890', 'Z790', 'Z690', 'Z590', 'Z490', 'B860', 'B760', 'B660', 'B560', 'B460', 'H610', 'H510', 'H410', 
      'X870E', 'X870', 'X670E', 'X670', 'X570', 'X470', 'B850', 'B650E', 'B650', 'B550', 'B450', 'A620', 'A520', 'A320'
    ] },
    { key: 'socket', label: 'Socket', type: 'select', options: [
      'AM5', 'AM4', 'AM3+', 'AM3', 'AM2+', 'AM2', 'FM2+', 'FM2', 'FM1', 'sTRX4', 'sTR4', 'sWRX8', 'SP3',
      'LGA1851', 'LGA1700', 'LGA1200', 'LGA1151', 'LGA1150', 'LGA1155', 'LGA1156', 'LGA2066', 'LGA2011', 'LGA1366', 'LGA775'
    ] },
    { key: 'form_factor', label: 'Form factor', type: 'select', options: ['Mini-ITX', 'Micro-ATX', 'ATX', 'E-ATX', 'Flex-ATX', 'SSI CEB', 'SSI EEB'] },
    { key: 'ram_type', label: 'Loại RAM', type: 'select', options: ['DDR3', 'DDR4', 'DDR5', 'LPDDR4', 'LPDDR5', 'LPDDR5X'] },
    { key: 'ram_slots', label: 'Số khe RAM', type: 'select', options: ['2', '4', '8'] },
    { key: 'max_ram_gb', label: 'RAM tối đa (GB)', type: 'select', options: ['16', '32', '64', '128', '192', '256', '512'] },
    { key: 'm2_slots', label: 'Số khe M.2', type: 'range', placeholder: '4' },
    { key: 'has_wifi', label: 'Có Wifi', type: 'boolean' },
    { key: 'mainboard_type', label: 'Phân khúc bo mạch', type: 'select', options: ['Workstation', 'Gaming', 'Phổ thông'] },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
  ],
  monitor: [
    { key: 'size_inch', label: 'Kích thước (inch)', type: 'range', placeholder: '27' },
    { key: 'resolution', label: 'Độ phân giải', type: 'select', options: ['1920x1080', '2560x1440', '3440x1440', '3840x2160', '5120x2880'] },
    { key: 'refresh_rate_hz', label: 'Tần số quét (Hz)', type: 'range', placeholder: '240' },
    { key: 'panel_type', label: 'Loại tấm nền', type: 'select', options: ['IPS', 'VA', 'TN', 'OLED', 'QD-OLED', 'Mini-LED'] },
    { key: 'aspect_ratio', label: 'Tỉ lệ màn hình', type: 'select', options: ['16:9', '16:10', '21:9', '32:9', '4:3'] },
    { key: 'response_time_ms', label: 'Thời gian phản hồi (ms)', type: 'range', placeholder: '1' },
    { key: 'brightness_cdm2', label: 'Độ sáng (cd/m2)', type: 'range', placeholder: '1000' },
    { key: 'ports', label: 'Cổng kết nối', type: 'multiselect', options: ['HDMI 2.0', 'HDMI 2.1', 'DisplayPort 1.4', 'DisplayPort 2.1', 'Type-C', 'VGA', 'DVI'] },
    { key: 'color_accuracy', label: 'Độ chuẩn màu', type: 'text', placeholder: '99% DCI-P3' },
    { key: 'has_hdr', label: 'Hỗ trợ HDR', type: 'boolean' },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
  ],
  psu: [
    { key: 'wattage', label: 'Công suất (W)', type: 'select', options: ['450', '500', '550', '600', '650', '700', '750', '800', '850', '1000', '1200', '1300', '1500', '1600'] },
    { key: 'efficiency_rating', label: 'Hiệu suất', type: 'select', options: ['80 Plus', '80 Plus Bronze', '80 Plus Silver', '80 Plus Gold', '80 Plus Platinum', '80 Plus Titanium'] },
    { key: 'modularity', label: 'Dạng dây (Modularity)', type: 'select', options: ['Full Modular', 'Semi Modular', 'Non Modular'] },
    { key: 'form_factor', label: 'Form factor', type: 'select', options: ['ATX', 'SFX', 'SFX-L', 'TFX', 'Flex-ATX', 'EPS12V'] },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
  ],
  ram: [
    { key: 'type', label: 'Loại RAM', type: 'select', options: ['DDR3', 'DDR4', 'DDR5', 'LPDDR4', 'LPDDR5', 'LPDDR5X'] },
    { key: 'capacity_gb', label: 'Dung lượng tổng (GB)', type: 'select', options: ['8', '16', '24', '32', '48', '64', '96', '128', '256'] },
    { key: 'kit', label: 'Kit RAM', type: 'select', options: ['1x8GB', '2x8GB', '1x16GB', '2x16GB', '2x32GB', '4x16GB', '2x24GB', '2x48GB', '4x32GB'] },
    { key: 'bus_speed_mhz', label: 'Tốc độ Bus (MHz)', type: 'range', placeholder: '4000' },
    { key: 'latency_cl', label: 'CAS Latency (CL)', type: 'range', placeholder: '18' },
    { key: 'has_rgb', label: 'Có RGB', type: 'boolean' },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
  ],
  ssd: [
    { key: 'capacity_gb', label: 'Dung lượng (GB)', type: 'select', options: ['120', '240', '250', '256', '480', '500', '512', '1000', '2000', '4000', '8000', '16000'] },
    { key: 'type', label: 'Loại', type: 'select', options: ['SSD', 'HDD'] },
    { key: 'interface', label: 'Giao tiếp', type: 'select', options: ['NVMe PCIe Gen3', 'NVMe PCIe Gen4', 'NVMe PCIe Gen5', 'SATA III', 'SATA II', 'SAS'] },
    { key: 'read_speed_mbps', label: 'Tốc độ đọc (MB/s)', type: 'range', placeholder: '3500' },
    { key: 'write_speed_mbps', label: 'Tốc độ ghi (MB/s)', type: 'range', placeholder: '2300' },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
  ],
  vga: [
    { key: 'chipset', label: 'Chipset', type: 'select', options: [
      'GeForce RTX 5090', 'GeForce RTX 5080', 'GeForce RTX 5070', 'GeForce RTX 4090', 'GeForce RTX 4080 Super', 
      'GeForce RTX 4080', 'GeForce RTX 4070 Ti Super', 'GeForce RTX 4070 Ti', 'GeForce RTX 4070 Super', 
      'GeForce RTX 4070', 'GeForce RTX 4060 Ti', 'GeForce RTX 4060', 'GeForce RTX 3090 Ti', 'GeForce RTX 3090', 
      'GeForce RTX 3080 Ti', 'GeForce RTX 3080', 'GeForce RTX 3070 Ti', 'GeForce RTX 3070', 'GeForce RTX 3060 Ti', 
      'GeForce RTX 3060', 'GeForce RTX 3050', 'GeForce GTX 1660 Super', 'GeForce GTX 1660 Ti', 'GeForce GTX 1660', 
      'GeForce GTX 1650 Super', 'GeForce GTX 1650', 'Radeon RX 7900 XTX', 'Radeon RX 7900 XT', 'Radeon RX 7800 XT', 
      'Radeon RX 7700 XT', 'Radeon RX 7600 XT', 'Radeon RX 7600', 'Radeon RX 6950 XT', 'Radeon RX 6900 XT', 
      'Radeon RX 6800 XT', 'Radeon RX 6800', 'Radeon RX 6750 XT', 'Radeon RX 6700 XT', 'Radeon RX 6600 XT', 
      'Radeon RX 6600', 'Intel Arc A770', 'Intel Arc A750', 'Intel Arc A580', 'Intel Arc A380'
    ] },
    { key: 'vram_gb', label: 'VRAM (GB)', type: 'select', options: ['2', '4', '6', '8', '10', '12', '16', '20', '24', '32', '48'] },
    { key: 'vram_type', label: 'Loại VRAM', type: 'select', options: ['DDR3', 'GDDR5', 'GDDR5X', 'GDDR6', 'GDDR6X', 'GDDR7', 'HBM', 'HBM2', 'HBM2e', 'HBM3'] },
    { key: 'performance_score', label: 'Điểm hiệu năng', type: 'range', placeholder: '9000' },
    { key: 'length_mm', label: 'Chiều dài (mm)', type: 'range', placeholder: '248' },
    { key: 'min_psu_w', label: 'Nguồn tối thiểu (W)', type: 'range', placeholder: '350' },
    { key: 'tdp_w', label: 'TDP (W)', type: 'range', placeholder: '100' },
    { key: 'base_clock_mhz', label: 'Xung cơ bản (MHz)', type: 'range', placeholder: '1530' },
    { key: 'boost_clock_mhz', label: 'Xung boost (MHz)', type: 'range', placeholder: '1755' },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
  ],
};

function getSpecFiltersForCategory(catName: string): SpecFilterDef[] {
  const slug = catName.toLowerCase().replace(/\s+/g, '');
  if (slug.includes('graphic') || slug.includes('vga') || slug.includes('video')) return SPECS_BY_CATEGORY.vga;
  if (slug.includes('memory') || slug.includes('ram')) return SPECS_BY_CATEGORY.ram;
  if (slug.includes('power') || slug.includes('nguon') || slug.includes('psu')) return SPECS_BY_CATEGORY.psu;
  if (slug.includes('board') || slug.includes('mainboard') || slug.includes('mother')) return SPECS_BY_CATEGORY.mainboard;
  if (slug.includes('processor') || slug.includes('vi xu ly') || slug.includes('cpu')) return SPECS_BY_CATEGORY.cpu;
  if (slug.includes('cool') || slug.includes('tan nhiet')) return SPECS_BY_CATEGORY.cooler;
  if (slug.includes('fan') || slug.includes('quat')) return SPECS_BY_CATEGORY.fan;
  if (slug.includes('storage') || slug.includes('ssd') || slug.includes('hdd') || slug.includes('o cung')) return SPECS_BY_CATEGORY.ssd;
  if (slug.includes('monitor') || slug.includes('man hinh')) return SPECS_BY_CATEGORY.monitor;
  if (slug.includes('case') || slug.includes('vo may')) return SPECS_BY_CATEGORY.case;
  for (const key of Object.keys(SPECS_BY_CATEGORY)) {
    if (slug.includes(key)) return SPECS_BY_CATEGORY[key];
  }
  return [];
}

const SORT_OPTIONS = [
  { value: 'default', label: 'Mặc định' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'name_asc', label: 'Tên A–Z' },
];

// ─── Dual Range Slider Component ──────────────────────────────────────────────
function DualRangeSlider({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (val: [number, number]) => void;
}) {
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

// ─── Brand Logo Swiper ────────────────────────────────────────────────────────
function BrandSwiper({
  brands,
  selectedBrands,
  onToggle,
}: {
  brands: Brand[];
  selectedBrands: string[];
  onToggle: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -160 : 160, behavior: 'smooth' });
  };

  if (brands.length === 0) {
    return <div className="h-8 bg-[#f1f5f9] rounded animate-pulse" />;
  }

  return (
    <div className="relative group/swiper">
      {/* Left arrow */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white border border-[#e2e8f0] rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover/swiper:opacity-100 transition-opacity cursor-pointer hover:bg-[#f8fafc] -translate-x-3"
        aria-label="Scroll left"
      >
        <ChevronLeft className="size-3.5 text-[#475569]" />
      </button>

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scroll-smooth pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* "All brands" chip */}
        <button
          onClick={() => onToggle('')}
          className={`shrink-0 flex items-center justify-center h-[52px] px-3 rounded-[10px] border text-[12px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
            selectedBrands.length === 0
              ? 'bg-[#0058be] border-[#0058be] text-white shadow-[0_2px_8px_rgba(0,88,190,0.25)]'
              : 'bg-white border-[#e2e8f0] text-[#475569] hover:border-[#0058be] hover:text-[#0058be]'
          }`}
        >
          Tất cả
        </button>

        {brands.map((brand) => {
          const isSelected = selectedBrands.includes(String(brand.id));
          const logoSrc = brand.logoUrl?.startsWith('http')
            ? brand.logoUrl
            : brand.logoUrl
              ? `http://localhost:8080${brand.logoUrl}`
              : null;

          return (
            <button
              key={brand.id}
              onClick={() => onToggle(String(brand.id))}
              title={brand.name}
              className={`shrink-0 flex flex-col items-center justify-center gap-1 h-[52px] min-w-[64px] px-3 rounded-[10px] border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#eff6ff] border-[#0058be] shadow-[0_2px_8px_rgba(0,88,190,0.15)]'
                  : 'bg-white border-[#e2e8f0] hover:border-[#0058be]'
              }`}
            >
              {logoSrc ? (
                <CldImage
                  src={logoSrc}
                  alt={brand.name}
                  width={52}
                  height={24}
                  crop="fit"
                  className="h-6 max-w-[52px] object-contain"
                />
              ) : null}
              <span
                className={`text-[10px] font-bold leading-none truncate max-w-[56px] ${
                  !logoSrc ? '' : 'hidden'
                } ${isSelected ? 'text-[#0058be]' : 'text-[#475569]'}`}
              >
                {brand.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white border border-[#e2e8f0] rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover/swiper:opacity-100 transition-opacity cursor-pointer hover:bg-[#f8fafc] translate-x-3"
        aria-label="Scroll right"
      >
        <ChevronRight className="size-3.5 text-[#475569]" />
      </button>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
export function ProductCard({ product }: { product: Product }) {
  const [imgErr, setImgErr] = useState(false);
  const [adding, setAdding] = useState(false);
  const { addItem } = useCartStore();
  const specs = (() => {
    try { return product.specsJson ? JSON.parse(product.specsJson) : {}; } catch { return {}; }
  })();

  const highlights: string[] = [];
  if (specs.cores) highlights.push(`${specs.cores} nhân`);
  if (specs.threads) highlights.push(`${specs.threads} luồng`);
  if (specs.socket) highlights.push(specs.socket);
  if (specs.vram_gb) highlights.push(`${specs.vram_gb}GB VRAM`);
  if (specs.capacity_gb && !specs.vram_gb) highlights.push(`${specs.capacity_gb}GB`);
  if (specs.wattage) highlights.push(`${specs.wattage}W`);
  if (specs.refresh_rate_hz) highlights.push(`${specs.refresh_rate_hz}Hz`);
  if (specs.panel_type) highlights.push(specs.panel_type);
  if (specs.type && !specs.vram_gb && !specs.cores) highlights.push(specs.type);

  const imgSrc = product.thumbnailUrl?.startsWith('http')
    ? product.thumbnailUrl
    : product.thumbnailUrl
      ? `http://localhost:8080${product.thumbnailUrl}`
      : null;

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (product.stock === 0) return;
    setAdding(true);
    try {
      await addItem(Number(product.id), 1);
      toast.success('Đã thêm vào giỏ hàng!');
    } catch {
      toast.error('Không thể thêm. Vui lòng đăng nhập trước.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <Link
      href={`/explore/${product.id}`}
      className="group bg-white rounded-[16px] border border-[#e8ecf2] hover:border-[#0058be] hover:shadow-[0_8px_32px_rgba(0,88,190,0.12)] transition-all duration-300 flex flex-col overflow-hidden relative"
    >
      <div className={`absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 transition-opacity ${product.stock === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

      {/* Image */}
      <div className="relative bg-[#f7f9fb] h-[192px] flex items-center justify-center overflow-hidden">
        {imgSrc && !imgErr ? (
          imgSrc.startsWith('http://localhost') ? (
            <img
              src={imgSrc}
              alt={product.name}
              className={`h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 ${product.stock === 0 ? 'grayscale opacity-60' : ''}`}
              onError={() => setImgErr(true)}
            />
          ) : (
            <CldImage
              src={imgSrc}
              alt={product.name}
              width={240}
              height={192}
              crop="fill"
              className={`h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 ${product.stock === 0 ? 'grayscale opacity-60' : ''}`}
              onError={() => setImgErr(true)}
            />
          )
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#cbd5e1]">
            <Package className="size-10" />
            <span className="text-[11px]">Chưa có ảnh</span>
          </div>
        )}
        {product.stock === 0 && (
          <span className="absolute top-2.5 left-2.5 bg-red-100 text-red-600 text-[10px] font-bold px-2.5 py-1 rounded-full z-20">
            Hết hàng
          </span>
        )}
        {product.stock > 0 && product.discountPercent && product.discountPercent > 0 ? (
          <span className="absolute top-2.5 right-2.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-[6px] shadow-sm z-20 animate-pulse">
            SALE -{product.discountPercent}%
          </span>
        ) : null}
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute top-2.5 left-2.5 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full z-20">
            Còn {product.stock} SP
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2.5 z-0">
        {product.brand && (
          <span className="text-[10px] font-bold text-[#0058be] uppercase tracking-[0.8px]">
            {product.brand.name}
          </span>
        )}
        <h3 className={`text-[13px] font-semibold leading-snug line-clamp-2 transition-colors ${product.stock === 0 ? 'text-[#94a3b8]' : 'text-[#0f172a] group-hover:text-[#0058be]'}`}>
          {product.name}
        </h3>
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-1 relative z-20">
            {highlights.slice(0, 3).map((h, i) => (
              <span key={i} className="text-[10px] bg-[#f1f5f9] text-[#64748b] px-2 py-0.5 rounded-full font-medium">
                {h}
              </span>
            ))}
          </div>
        )}
        <div className="flex-1" />
        <div className="flex items-center justify-between pt-2.5 border-t border-[#f1f5f9] relative z-20">
          {product.discountPrice ? (
            <div className="flex flex-col gap-0.5">
              <p className={`text-[16px] font-bold ${product.stock === 0 ? 'text-[#94a3b8]' : 'text-red-500'}`}>
                {product.discountPrice.toLocaleString('vi-VN')}
                <span className="text-[11px] font-normal ml-0.5 opacity-70">₫</span>
              </p>
              <p className="text-[11px] text-[#94a3b8] line-through font-medium leading-none">
                {product.price.toLocaleString('vi-VN')}₫
              </p>
            </div>
          ) : (
            <p className={`text-[16px] font-bold ${product.stock === 0 ? 'text-[#94a3b8]' : 'text-[#0058be]'}`}>
              {product.price.toLocaleString('vi-VN')}
              <span className="text-[11px] font-normal ml-1 opacity-70">₫</span>
            </p>
          )}
          <button
            type="button"
            disabled={product.stock === 0 || adding}
            onClick={handleAddToCart}
            className="p-2 rounded-[8px] bg-[#f1f5f9] hover:bg-[#0058be] text-[#64748b] hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Thêm vào giỏ"
          >
            {adding
              ? <div className="size-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              : <ShoppingCart className="size-4" />}
          </button>
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-[16px] border border-[#e8ecf2] flex flex-col overflow-hidden animate-pulse">
      <div className="h-[192px] bg-[#f1f5f9]" />
      <div className="p-4 flex flex-col gap-2.5">
        <div className="h-3 bg-[#e2e8f0] rounded w-16" />
        <div className="h-4 bg-[#e2e8f0] rounded w-full" />
        <div className="h-4 bg-[#e2e8f0] rounded w-3/4" />
        <div className="flex gap-1">
          <div className="h-4 bg-[#e2e8f0] rounded-full w-12" />
          <div className="h-4 bg-[#e2e8f0] rounded-full w-14" />
        </div>
        <div className="flex justify-between items-center pt-2.5 border-t border-[#f1f5f9] mt-auto">
          <div className="h-5 bg-[#e2e8f0] rounded w-24" />
          <div className="h-8 w-8 bg-[#e2e8f0] rounded-[8px]" />
        </div>
      </div>
    </div>
  );
}

// ─── Collapsible filter section ───────────────────────────────────────────────
function FilterSection({ title, children, defaultOpen = true }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#f1f5f9] last:border-0 pb-3">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full py-2.5 text-[12px] font-bold text-[#374151] uppercase tracking-[0.6px] cursor-pointer"
      >
        {title}
        <ChevronDown className={`size-3.5 text-[#94a3b8] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}

// ─── Range Specification Slider Definitions ──────────────────────────────────
const RANGE_SPEC_DEFS: Record<string, { min: number; max: number; step: number; suffix: string }> = {
  tdp_w: { min: 0, max: 500, step: 5, suffix: 'W' },
  tdp_rating_w: { min: 0, max: 500, step: 5, suffix: 'W' },
  base_clock_ghz: { min: 0, max: 8, step: 0.1, suffix: 'GHz' },
  boost_clock_ghz: { min: 0, max: 8, step: 0.1, suffix: 'GHz' },
  performance_score: { min: 0, max: 60000, step: 500, suffix: 'đ' },
  cache_mb: { min: 0, max: 256, step: 4, suffix: 'MB' },
  max_gpu_length_mm: { min: 0, max: 500, step: 5, suffix: 'mm' },
  length_mm: { min: 0, max: 500, step: 5, suffix: 'mm' },
  max_cpu_cooler_height_mm: { min: 0, max: 250, step: 5, suffix: 'mm' },
  noise_level_db: { min: 0, max: 60, step: 1, suffix: 'dB' },
  airflow_cfm: { min: 0, max: 150, step: 2, suffix: 'CFM' },
  fan_speed_rpm: { min: 0, max: 4000, step: 50, suffix: 'RPM' },
  m2_slots: { min: 0, max: 8, step: 1, suffix: 'khe' },
  size_inch: { min: 10, max: 60, step: 0.5, suffix: '"' },
  brightness_cdm2: { min: 0, max: 2000, step: 50, suffix: 'nits' },
  refresh_rate_hz: { min: 0, max: 540, step: 10, suffix: 'Hz' },
  response_time_ms: { min: 0, max: 10, step: 0.1, suffix: 'ms' },
  bus_speed_mhz: { min: 0, max: 10000, step: 100, suffix: 'MHz' },
  latency_cl: { min: 0, max: 50, step: 1, suffix: 'CL' },
  read_speed_mbps: { min: 0, max: 15000, step: 100, suffix: 'MB/s' },
  write_speed_mbps: { min: 0, max: 15000, step: 100, suffix: 'MB/s' },
  min_psu_w: { min: 0, max: 2000, step: 50, suffix: 'W' },
};

function SpecRangeSlider({
  min,
  max,
  step,
  suffix,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  suffix: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [minVal, maxVal] = value
    ? value.split(',').map(Number)
    : [min, max];

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value), maxVal - step);
    onChange(`${v},${maxVal}`);
  };
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value), minVal + step);
    onChange(`${minVal},${v}`);
  };

  const leftPercent = ((minVal - min) / (max - min)) * 100;
  const rightPercent = 100 - ((maxVal - min) / (max - min)) * 100;

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
          value={minVal}
          onChange={handleMinChange}
          className="absolute w-full -top-1.5 h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0058be] [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={handleMaxChange}
          className="absolute w-full -top-1.5 h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0058be] [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="number"
            value={minVal}
            onChange={e => onChange(`${Number(e.target.value)},${maxVal}`)}
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-2 pr-10 py-1.5 text-[11px] font-medium text-[#374151] focus:outline-none focus:border-[#0058be] transition-all"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#94a3b8]">{suffix}</span>
        </div>
        <span className="text-[#94a3b8] text-[12px] font-medium">-</span>
        <div className="flex-1 relative">
          <input
            type="number"
            value={maxVal}
            onChange={e => onChange(`${minVal},${Number(e.target.value)}`)}
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-2 pr-10 py-1.5 text-[11px] font-medium text-[#374151] focus:outline-none focus:border-[#0058be] transition-all"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#94a3b8]">{suffix}</span>
        </div>
      </div>
      {value && (
        <button onClick={() => onChange('')} className="text-[11px] text-[#0058be] hover:underline text-left cursor-pointer font-medium mt-1">
          Bỏ lọc khoảng này
        </button>
      )}
    </div>
  );
}

// ─── Spec filter input renderer ───────────────────────────────────────────────
function SpecFilterInput({
  filter,
  value,
  onChange,
  dynamicOptions,
}: {
  filter: SpecFilterDef;
  value: string;
  onChange: (v: string) => void;
  dynamicOptions?: string[];
}) {
  if (filter.type === 'range') {
    const rangeDef = RANGE_SPEC_DEFS[filter.key] || { min: 0, max: 10000, step: 1, suffix: '' };
    return (
      <SpecRangeSlider
        min={rangeDef.min}
        max={rangeDef.max}
        step={rangeDef.step}
        suffix={rangeDef.suffix}
        value={value}
        onChange={onChange}
      />
    );
  }

  if (filter.type === 'boolean') {
    return (
      <div className="flex gap-1.5">
        {(['', 'true', 'false'] as const).map(v => {
          const label = v === '' ? 'Tất cả' : v === 'true' ? 'Có' : 'Không';
          const isSelected = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={`flex-1 text-[11px] py-1.5 rounded-[6px] border transition-all cursor-pointer font-medium ${
                isSelected
                  ? 'bg-[#eff6ff] border-[#0058be] text-[#0058be] font-bold'
                  : 'bg-white border-[#cbd5e1] text-[#475569] hover:border-[#0058be]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  if (filter.type === 'select') {
    const options = (filter.options && filter.options.length > 0) ? filter.options : (dynamicOptions || []);
    return (
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-[8px] pl-2.5 pr-8 py-1.5 text-[12px] font-medium text-[#374151] focus:outline-none focus:border-[#0058be] transition-all cursor-pointer appearance-none"
        >
          <option value="">Tất cả</option>
          {options.map(opt => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-[#cbd5e1] pointer-events-none" />
      </div>
    );
  }

  // multiselect / text / number treated as multiselect checkboxes based on dynamic options or static options
  const options = (filter.options && filter.options.length > 0) ? filter.options : (dynamicOptions || []);
  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  const toggle = (opt: string) => {
    const next = selected.includes(opt)
      ? selected.filter(v => v !== opt)
      : [...selected, opt];
    onChange(next.join(', '));
  };

  if (options.length === 0) {
    return <div className="text-[11px] text-[#94a3b8] italic">Đang tải...</div>;
  }

  return (
    <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer group/chk py-0.5 select-none">
          <div
            className={`shrink-0 w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center transition-colors ${
              selected.includes(opt)
                ? 'bg-[#0058be] border-[#0058be]'
                : 'border-[#cbd5e1] group-hover/chk:border-[#0058be]'
            }`}
            onClick={(e) => { e.preventDefault(); toggle(opt); }}
          >
            {selected.includes(opt) && (
              <svg width="8" height="6" viewBox="0 0 10 7" fill="none">
                <path d="M1 3L4 6L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span
            className="text-[12px] text-[#475569] group-hover/chk:text-[#0f172a] transition-colors truncate"
            onClick={(e) => { e.preventDefault(); toggle(opt); }}
            title={opt}
          >
            {opt}
          </span>
        </label>
      ))}
      {selected.length > 0 && (
        <button onClick={() => onChange('')} className="text-[11px] text-[#0058be] hover:underline mt-1 text-left cursor-pointer font-medium">
          Bỏ chọn tất cả
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 150_000_000]);
  const [specFilters, setSpecFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState('default');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [availableSpecs, setAvailableSpecs] = useState<Record<string, string[]>>({});

  const PAGE_SIZE = 12;
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCategoryName = categories.find(c => String(c.id) === selectedCategory)?.name ?? '';
  const activeSpecFilters = getSpecFiltersForCategory(activeCategoryName);

  // ── Fetch unique specs in background ───────────────────────────────────────
  useEffect(() => {
    if (!selectedCategory) {
      const timer = setTimeout(() => {
        setAvailableSpecs({});
      }, 0);
      return () => clearTimeout(timer);
    }
    // Fetch up to 1000 items silently to map existing specs
    adminAPI.getProducts(0, 1000, '', selectedCategory, '').then(res => {
      const specsMap: Record<string, Set<string>> = {};
      const prods = res.content || [];
      prods.forEach(p => {
        if (!p.specsJson) return;
        try {
          const s = JSON.parse(p.specsJson);
          Object.entries(s).forEach(([k, v]) => {
            if (v === null || v === undefined || v === '') return;
            if (!specsMap[k]) specsMap[k] = new Set();
            if (Array.isArray(v)) {
              v.forEach(item => specsMap[k].add(String(item)));
            } else {
              specsMap[k].add(String(v));
            }
          });
        } catch {}
      });
      
      const newSpecs: Record<string, string[]> = {};
      Object.keys(specsMap).forEach(k => {
        newSpecs[k] = Array.from(specsMap[k]).sort((a, b) => {
           const na = parseFloat(a); const nb = parseFloat(b);
           if (!isNaN(na) && !isNaN(nb)) return na - nb;
           return a.localeCompare(b);
         });
       });
      setAvailableSpecs(newSpecs);
    });
  }, [selectedCategory]);

  // ── Load refs ──────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      adminAPI.getCategories(0, 200),
      adminAPI.getBrands(0, 200),
    ]).then(([cats, brs]) => {
      setCategories(cats.content || []);
      setBrands(brs.content || []);
    });
  }, []);

  // Synchronize category selection with URL parameters dynamically
  useEffect(() => {
    if (categories.length === 0) return;
    
    const timer = setTimeout(() => {
      if (categoryParam) {
        if (!isNaN(Number(categoryParam))) {
          setSelectedCategory(categoryParam);
        } else {
          const matched = categories.find(c => 
            c.slug?.toLowerCase() === categoryParam.toLowerCase() ||
            c.name.toLowerCase() === categoryParam.toLowerCase() ||
            c.name.replace(/\s+/g, '-').toLowerCase() === categoryParam.toLowerCase()
          );
          if (matched) {
            setSelectedCategory(String(matched.id));
          } else {
            setSelectedCategory('');
          }
        }
      } else {
        setSelectedCategory('');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [categoryParam, categories]);

  // ── Fetch products (All matching category & search to filter/paginate client-side) ─────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getProducts(
        0,
        1000,
        search || undefined,
        selectedCategory || undefined,
        undefined
      );
      setProducts(res.content || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // Reset page to 0 when any filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
    }, 0);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedBrands, priceRange, specFilters, showOutOfStock, sortBy]);

  // ── Client-side filtering (price + specs + stock) + sort ───────────────────
  const filtered = products
    .filter(p => {
      // Stock filter
      if (!showOutOfStock && p.stock === 0) return false;

      // Price filter
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;

      // Brand filter
      if (selectedBrands.length > 0 && !selectedBrands.includes(String(p.brandId))) return false;

      // Spec filters
      const activeKeys = Object.entries(specFilters).filter(([, v]) => v !== '');
      if (activeKeys.length === 0) return true;

      try {
        const specs = p.specsJson ? JSON.parse(p.specsJson) : {};
        for (const [key, val] of activeKeys) {
          const def = activeSpecFilters.find(f => f.key === key);
          const specVal = specs[key];
          if (specVal === undefined || specVal === null) return false;

          if (def?.type === 'boolean') {
            if (String(specVal) !== val) return false;
          } else if (def?.type === 'select') {
            if (String(specVal) !== val) return false;
          } else if (def?.type === 'range') {
            const [minStr, maxStr] = val.split(',');
            const minVal = parseFloat(minStr);
            const maxVal = parseFloat(maxStr);
            const num = parseFloat(String(specVal));
            if (!isNaN(num)) {
              if (!isNaN(minVal) && num < minVal) return false;
              if (!isNaN(maxVal) && num > maxVal) return false;
            }
          } else {
            // multiselect / text / number treated as sets of selected values
            const wanted = val.split(',').map(v => v.trim()).filter(Boolean);
            const has = Array.isArray(specVal) ? specVal : [String(specVal)];
            if (!wanted.some(w => has.some((h: string) => String(h) === w))) return false;
          }
        }
      } catch { return true; }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name, 'vi');
      return 0;
    });

  const totalElements = filtered.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE) || 1;
  const displayedProducts = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const activeFilterCount = [
    selectedCategory,
    ...selectedBrands,
    (priceRange[0] > 0 || priceRange[1] < 150_000_000) ? 'p' : '',
    ...Object.values(specFilters).filter(Boolean),
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedCategory(''); setSelectedBrands([]);
    setPriceRange([0, 150_000_000]); setSpecFilters({});
    setSearch(''); setPage(0);
  };

  // ── Sidebar JSX (shared for desktop + mobile) ──────────────────────────────
  const sidebar = (
    <aside className="flex flex-col gap-0.5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-3.5 text-[#0058be]" />
          <span className="text-[13px] font-bold text-[#0f172a]">Bộ lọc</span>
          {activeFilterCount > 0 && (
            <span className="bg-[#0058be] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button onClick={clearAllFilters} className="text-[11px] text-[#0058be] hover:underline cursor-pointer font-medium">
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Category */}
      <FilterSection title="Danh mục">
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => { setSelectedCategory(''); setSpecFilters({}); setPage(0); }}
            className={`w-full text-left px-2.5 py-2 rounded-[8px] text-[12px] transition-colors cursor-pointer font-medium ${
              !selectedCategory ? 'bg-[#eff6ff] text-[#0058be]' : 'text-[#475569] hover:bg-[#f8fafc]'
            }`}
          >
            Tất cả danh mục
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(String(cat.id)); setSpecFilters({}); setPage(0); }}
              className={`w-full text-left px-2.5 py-2 rounded-[8px] text-[12px] transition-colors cursor-pointer truncate ${
                selectedCategory === String(cat.id) ? 'bg-[#eff6ff] text-[#0058be] font-semibold' : 'text-[#475569] hover:bg-[#f8fafc]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Khoảng giá">
        <DualRangeSlider
          min={0}
          max={150_000_000}
          step={500_000}
          value={priceRange}
          onChange={setPriceRange}
        />
      </FilterSection>

      {/* Dynamic spec filters */}
      {activeSpecFilters.length > 0 && (
        <FilterSection title={`Thông số — ${activeCategoryName}`}>
          <div className="flex flex-col gap-3.5">
            {activeSpecFilters.map(filter => (
              <div key={filter.key} className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-[0.4px]">
                  {filter.label}
                </label>
                <SpecFilterInput
                  filter={filter}
                  value={specFilters[filter.key] ?? ''}
                  dynamicOptions={availableSpecs[filter.key]}
                  onChange={v => setSpecFilters(prev => ({ ...prev, [filter.key]: v }))}
                />
              </div>
            ))}
          </div>
        </FilterSection>
      )}
    </aside>
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #f7f9fb 0%, #f0f4fa 100%)' }}>

      {/* Plain Breadcrumb */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-1">
        <div className="flex items-center gap-1.5 text-[13px] text-[#64748b]">
          <Link href="/home" className="hover:text-[#0058be] transition-colors">Trang chủ</Link>
          <span className="text-[#cbd5e1] font-normal">/</span>
          <span className="text-[#0f172a] font-medium">Khám phá linh kiện</span>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
            <input
              type="search"
              placeholder="Tìm kiếm sản phẩm..."
              value={search}
              onChange={e => {
                const v = e.target.value;
                if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                setSearch(v);
                searchDebounceRef.current = setTimeout(() => setPage(0), 400);
              }}
              className="w-full bg-white border border-[#e2e8f0] rounded-[12px] pl-10 pr-10 py-2.5 text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0058be] focus:ring-2 focus:ring-[#0058be]/10 shadow-sm transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569] cursor-pointer">
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="relative hidden sm:block">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-[#e2e8f0] rounded-[12px] pl-4 pr-9 py-2.5 text-[13px] text-[#374151] focus:outline-none focus:border-[#0058be] shadow-sm cursor-pointer font-medium"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8] pointer-events-none" />
          </div>

          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden flex items-center gap-2 bg-white border border-[#e2e8f0] rounded-[12px] px-4 py-2.5 text-[13px] font-medium text-[#374151] shadow-sm cursor-pointer"
          >
            <SlidersHorizontal className="size-4" />
            Lọc
            {activeFilterCount > 0 && (
              <span className="bg-[#0058be] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Brand Swiper Row */}
        <div className="mb-5 bg-white border border-[#e2e8f0] rounded-[16px] p-2.5 shadow-sm">
          <BrandSwiper
            brands={brands}
            selectedBrands={selectedBrands}
            onToggle={(id) => {
              if (id === '') {
                setSelectedBrands([]);
              } else {
                setSelectedBrands(prev =>
                  prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
                );
              }
              setPage(0);
            }}
          />
        </div>

        {/* Result row + chips + toggle out of stock */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-[13px] text-[#475569]">
              <span className="font-bold text-[#0f172a]">{totalElements}</span> sản phẩm
              {filtered.length !== products.length && (
                <span className="text-[#94a3b8]"> (trong tổng số {products.length})</span>
              )}
            </p>

            {/* Out of stock toggle switch */}
            <div className="flex items-center gap-2 border-l border-[#e2e8f0] pl-3 ml-1">
              <label className="text-[12px] font-medium text-[#475569] cursor-pointer flex items-center gap-2 select-none">
                <div className="relative inline-block w-8 h-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={showOutOfStock}
                    onChange={(e) => setShowOutOfStock(e.target.checked)}
                  />
                  <div className="w-full h-full bg-[#cbd5e1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#0058be]"></div>
                </div>
                Hiển thị SP hết hàng
              </label>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap ml-2">
              {activeCategoryName && selectedCategory && (
                <span className="inline-flex items-center gap-1.5 bg-[#eff6ff] text-[#0058be] text-[11px] font-medium px-2 py-0.5 rounded-full">
                  {activeCategoryName}
                  <button onClick={() => { setSelectedCategory(''); setSpecFilters({}); }} className="cursor-pointer"><X className="size-3" /></button>
                </span>
              )}
              {selectedBrands.map((brandId) => (
                <span key={brandId} className="inline-flex items-center gap-1.5 bg-[#eff6ff] text-[#0058be] text-[11px] font-medium px-2 py-0.5 rounded-full">
                  {brands.find(b => String(b.id) === brandId)?.name}
                  <button
                    onClick={() => setSelectedBrands(prev => prev.filter(id => id !== brandId))}
                    className="cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              {(priceRange[0] > 0 || priceRange[1] < 150_000_000) && (
                <span className="inline-flex items-center gap-1.5 bg-[#eff6ff] text-[#0058be] text-[11px] font-medium px-2 py-0.5 rounded-full">
                  {priceRange[0] > 0 ? (priceRange[0] / 1_000_000).toFixed(1) + 'M' : '0'} - {priceRange[1] < 150_000_000 ? (priceRange[1] / 1_000_000).toFixed(1) + 'M' : 'Max'}
                  <button onClick={() => setPriceRange([0, 150_000_000])} className="cursor-pointer"><X className="size-3" /></button>
                </span>
              )}
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="text-[12px] text-[#94a3b8] hover:text-[#475569] transition-colors cursor-pointer">
              Xóa tất cả
            </button>
          )}
        </div>

        {/* Layout */}
        <div className="flex gap-5 items-start">
          {/* Desktop sidebar */}
          <div className="hidden lg:block w-[232px] shrink-0 bg-white rounded-[16px] border border-[#e8ecf2] p-4 shadow-sm sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {sidebar}
          </div>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center">
                  <Search className="size-7 text-[#cbd5e1]" />
                </div>
                <p className="text-[15px] font-semibold text-[#0f172a]">Không tìm thấy sản phẩm</p>
                <p className="text-[13px] text-[#94a3b8]">Thử thay đổi bộ lọc hoặc từ khóa</p>
                <button onClick={clearAllFilters} className="mt-1 px-5 py-2 bg-[#0058be] text-white rounded-[10px] text-[13px] font-medium hover:bg-[#0047a3] transition-colors cursor-pointer">
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {displayedProducts.map(p => <ProductCard key={p.id} product={p} />)}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      className="px-4 py-2 rounded-[10px] border border-[#e2e8f0] bg-white text-[13px] font-medium text-[#475569] hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Trước
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                      const pn = totalPages <= 7 ? i : Math.max(0, Math.min(totalPages - 7, page - 3)) + i;
                      return (
                        <button key={pn} onClick={() => setPage(pn)}
                          className={`w-9 h-9 rounded-[8px] text-[13px] font-medium cursor-pointer ${pn === page ? 'bg-[#0058be] text-white' : 'bg-white border border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc]'}`}
                        >
                          {pn + 1}
                        </button>
                      );
                    })}
                    <button
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      className="px-4 py-2 rounded-[10px] border border-[#e2e8f0] bg-white text-[13px] font-medium text-[#475569] hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative ml-auto w-[300px] bg-white h-full overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[15px] text-[#0f172a]">Bộ lọc</h2>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1.5 rounded-[8px] hover:bg-[#f1f5f9] cursor-pointer">
                <X className="size-5 text-[#475569]" />
              </button>
            </div>
            {sidebar}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="mt-5 w-full py-3 bg-[#0058be] text-white rounded-[12px] font-semibold text-[14px] hover:bg-[#0047a3] transition-colors cursor-pointer"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
