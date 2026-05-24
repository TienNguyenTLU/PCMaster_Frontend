'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Brand } from '@/lib/api';
import { CldImage } from 'next-cloudinary';

interface BrandSwiperProps {
  brands: Brand[];
  selectedBrands: string[];
  onToggle: (id: string) => void;
}

export default function BrandSwiper({
  brands,
  selectedBrands,
  onToggle,
}: BrandSwiperProps) {
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
        type="button"
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
          type="button"
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
              type="button"
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
        type="button"
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white border border-[#e2e8f0] rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover/swiper:opacity-100 transition-opacity cursor-pointer hover:bg-[#f8fafc] translate-x-3"
        aria-label="Scroll right"
      >
        <ChevronRight className="size-3.5 text-[#475569]" />
      </button>
    </div>
  );
}
