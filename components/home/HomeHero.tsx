'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminAPI, Banner } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const imgPC = 'http://localhost:3845/assets/3fc0fbbb64b098f587482e466fbf7df039ea5484.png';

export default function HomeHero() {
  const [banners, setBanners] = useState<Banner[]>([]);

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

  // Fallback: If no banners are uploaded, render the default banner from public directory
  if (banners.length === 0) {
    return (
      <section className="w-full max-w-[1400px] mx-auto rounded-[24px] overflow-hidden relative shadow-lg bg-gray-50 border border-slate-100/60 aspect-[21/8] group">
        <Link
          href="/explore"
          className="block w-full h-full cursor-pointer overflow-hidden"
        >
          <div className="w-full h-full hover:scale-[1.015] transition-transform duration-700 ease-out">
            <img
              src="/Default banner.jpg"
              alt="Default Banner"
              className="w-full h-full object-cover select-none"
              fetchPriority="high"
              decoding="sync"
            />
          </div>
        </Link>
      </section>
    );
  }

  return (
    <section className="w-full max-w-[1400px] mx-auto rounded-[24px] overflow-hidden relative shadow-lg bg-gray-50 border border-slate-100/60 aspect-[21/8] group">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        loop={banners.length > 1}
        autoplay={banners.length > 1 ? {
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        } : false}
        pagination={banners.length > 1 ? {
          el: '.swiper-pagination-custom',
          clickable: true,
          bulletClass: 'swiper-pagination-bullet-custom',
          bulletActiveClass: 'swiper-pagination-bullet-active-custom',
        } : false}
        navigation={banners.length > 1 ? {
          prevEl: '.swiper-button-prev-custom',
          nextEl: '.swiper-button-next-custom',
        } : false}
        className="w-full h-full"
      >
        {banners.map((banner) => {
          const ImageElement = (
            <img
              src={banner.imageUrl}
              alt={`Banner ${banner.displayOrder}`}
              className="w-full h-full object-cover select-none"
              fetchPriority="high"
              decoding="sync"
            />
          );

          return (
            <SwiperSlide key={banner.id} className="w-full h-full overflow-hidden">
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
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Slide Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            className="swiper-button-prev-custom absolute left-6 top-1/2 -translate-y-1/2 z-20 size-12 bg-white/20 hover:bg-white/40 border border-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-300 shadow-md cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-6 text-slate-800" />
          </button>
          <button
            className="swiper-button-next-custom absolute right-6 top-1/2 -translate-y-1/2 z-20 size-12 bg-white/20 hover:bg-white/40 border border-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-300 shadow-md cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight className="size-6 text-slate-800" />
          </button>
        </>
      )}

      {/* Visual Dot Indicators */}
      {banners.length > 1 && (
        <div className="swiper-pagination-custom absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-3.5 py-2 bg-slate-900/10 backdrop-blur-md rounded-full border border-white/10 shadow-xs" />
      )}
    </section>
  );
}

