'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { adminAPI, Banner } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const imgPC = 'http://localhost:3845/assets/3fc0fbbb64b098f587482e466fbf7df039ea5484.png';

export default function HomeHero() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    adminAPI.getBanners()
      .then(data => {
        // Sort by displayOrder ascending
        const sorted = [...data].sort((a, b) => a.displayOrder - b.displayOrder);
        setBanners(sorted);
      })
      .catch(err => {
        console.error('Error fetching home banners:', err);
      });
  }, []);

  // Autoplay functionality
  useEffect(() => {
    if (banners.length <= 1) return;

    if (!isHovered) {
      autoplayTimerRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % banners.length);
      }, 5000);
    }

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [banners.length, isHovered]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % banners.length);
  };

  const handleDotClick = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(idx);
  };

  // Fallback: If no banners are uploaded, render the original gorgeous hero design
  if (banners.length === 0) {
    return (
      <section className="bg-[#f2f4f6] rounded-[16px] overflow-hidden relative h-[860px] w-full max-w-[1536px] mx-auto">
        {/* Background image – right half */}
        <div className="absolute right-0 top-0 h-full w-[573px]">
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={imgPC}
              alt="High-end custom PC workstation"
              className="absolute h-full max-w-none"
              style={{ left: '-110.83%', width: '270.08%', top: '0.01%' }}
            />
            <div className="absolute inset-0 bg-[rgba(255,255,255,0.2)] mix-blend-saturation" />
          </div>
          {/* Fade gradient left */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#f2f4f6] via-[rgba(242,244,246,0)] to-[rgba(242,244,246,0)]" />
        </div>

        {/* Text content – left half */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-[446px] p-20 flex flex-col gap-6">
          {/* Badge */}
          <div className="inline-flex">
            <span
              className="bg-[rgba(0,88,190,0.1)] text-[#0058be] text-[12px] tracking-[1.2px] uppercase px-3 py-1 rounded-[4px] font-semibold"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              BỘ SƯU TẬP 2026
            </span>
          </div>

          {/* Headline */}
          <div>
            <p
              className="text-[#191c1e] text-[64px] tracking-[-4.8px] leading-[96px] font-normal"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Thiết Kế Cấu Hình
            </p>
            <p
              className="text-[#0b82d2] text-[64px] tracking-[-4.8px] leading-[96px] font-bold"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              PC Cực Mạnh
            </p>
          </div>

          {/* Description */}
          <div className="max-w-[512px] pt-2">
            <p
              className="text-[#424754] text-[18px] leading-[29.25px] font-normal"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Trải nghiệm kỹ nghệ lắp ráp PC chính xác tuyệt đối với cấu hình workstation chuyên nghiệp.
              Từng linh kiện được tuyển chọn kỹ lưỡng để đạt độ tương thích tối đa và hiệu năng tản nhiệt tối ưu.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-4 pt-4">
            <Link
              href="/builds"
              className="
                relative bg-gradient-to-r from-[#0058be] to-[#2170e4]
                text-white text-[16px] leading-[24px] font-normal
                px-8 py-[17px] rounded-[8px]
                shadow-[0px_10px_15px_-3px_rgba(0,88,190,0.2),0px_4px_6px_-4px_rgba(0,88,190,0.2)]
                hover:opacity-90 transition-opacity
              "
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Tự Build PC Ngay
            </Link>
            <Link
              href="/explore"
              className="
                border border-[rgba(194,198,214,0.3)] text-[#191c1e] text-[16px] leading-[24px] font-normal
                px-[33px] py-[17px] rounded-[8px]
                hover:border-[rgba(194,198,214,0.8)] transition-colors
              "
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Khám Phá
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      className="w-full max-w-[1536px] mx-auto rounded-[24px] overflow-hidden relative shadow-lg bg-gray-50 border border-slate-100/60 aspect-[21/9] group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slides Container */}
      <div className="w-full h-full relative">
        {banners.map((banner, idx) => {
          const isActive = idx === currentIndex;
          const ImageElement = (
            <img
              src={banner.imageUrl}
              alt={`Banner ${banner.displayOrder}`}
              className="w-full h-full object-cover select-none"
            />
          );

          return (
            <div
              key={banner.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-[800ms] ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {banner.linkUrl ? (
                <a
                  href={banner.linkUrl}
                  target={banner.linkUrl.startsWith('http') ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="block w-full h-full cursor-pointer overflow-hidden"
                >
                  <div className="w-full h-full hover:scale-[1.015] transition-transform duration-700 ease-out">
                    {ImageElement}
                  </div>
                </a>
              ) : (
                <div className="w-full h-full overflow-hidden">
                  {ImageElement}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Slide Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-20 size-12 bg-white/20 hover:bg-white/40 border border-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-300 shadow-md cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-6 text-slate-800" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-20 size-12 bg-white/20 hover:bg-white/40 border border-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-300 shadow-md cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight className="size-6 text-slate-800" />
          </button>
        </>
      )}

      {/* Visual Dot Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-3.5 py-2 bg-slate-900/10 backdrop-blur-md rounded-full border border-white/10 shadow-xs">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => handleDotClick(idx, e)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex 
                  ? 'w-6 bg-[#0058be]' 
                  : 'w-2 bg-slate-700/40 hover:bg-slate-700/60'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

