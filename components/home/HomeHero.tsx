"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { adminAPI, Banner } from "@/lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export default function HomeHero() {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    adminAPI
      .getBanners()
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => a.displayOrder - b.displayOrder,
        );
        setBanners(sorted);
      })
      .catch((err) => {
        console.error("Error fetching home banners:", err);
      });
  }, []);

  if (banners.length === 0) {
    return (
      <section className="w-full max-w-[1400px] mx-auto rounded-[24px] overflow-hidden relative shadow-lg bg-slate-100 border border-slate-200/50 h-[200px] sm:h-[300px] md:h-[380px] lg:h-[440px] xl:h-[480px] group">
        <Link
          href="/explore"
          className="block w-full h-full cursor-pointer overflow-hidden"
        >
          <div className="w-full h-full hover:scale-[1.012] transition-transform duration-700 ease-out">
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
    <section className="w-full max-w-[1400px] mx-auto rounded-[24px] overflow-hidden relative shadow-lg bg-slate-100 border border-slate-200/50 h-[200px] sm:h-[300px] md:h-[380px] lg:h-[440px] xl:h-[480px] group">
      <Swiper
        key={banners.length}
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        loop={banners.length > 1}
        autoplay={
          banners.length > 1
            ? {
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }
            : false
        }
        pagination={
          banners.length > 1
            ? {
                el: ".swiper-pagination-custom",
                clickable: true,
                bulletClass: "swiper-pagination-bullet-custom",
                bulletActiveClass: "swiper-pagination-bullet-active-custom",
              }
            : false
        }
        navigation={
          banners.length > 1
            ? {
                prevEl: ".swiper-button-prev-custom",
                nextEl: ".swiper-button-next-custom",
              }
            : false
        }
        className="w-full h-full"
      >
        {banners.map((banner) => (
          <SwiperSlide
            key={banner.id}
            className="w-full h-full overflow-hidden"
          >
            {banner.linkUrl ? (
              <a
                href={banner.linkUrl}
                target={
                  banner.linkUrl.startsWith("http") ? "_blank" : "_self"
                }
                rel="noopener noreferrer"
                className="block w-full h-full cursor-pointer overflow-hidden"
              >
                <div className="w-full h-full hover:scale-[1.012] transition-transform duration-700 ease-out">
                  <img
                    src={banner.imageUrl}
                    alt={`Banner ${banner.displayOrder}`}
                    className="w-full h-full object-cover select-none"
                    fetchPriority="high"
                    decoding="sync"
                  />
                </div>
              </a>
            ) : (
              <div className="w-full h-full overflow-hidden">
                <img
                  src={banner.imageUrl}
                  alt={`Banner ${banner.displayOrder}`}
                  className="w-full h-full object-cover select-none"
                  fetchPriority="high"
                  decoding="sync"
                />
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation Buttons */}
      {banners.length > 1 && (
        <>
          <button
            className="swiper-button-prev-custom absolute left-6 top-1/2 -translate-y-1/2 z-20 size-11 bg-white/80 hover:bg-white border border-slate-100 text-slate-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            className="swiper-button-next-custom absolute right-6 top-1/2 -translate-y-1/2 z-20 size-11 bg-white/80 hover:bg-white border border-slate-100 text-slate-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}

      {/* Pagination */}
      {banners.length > 1 && (
        <div className="swiper-pagination-custom absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-3.5 py-2 bg-black/30 backdrop-blur-md rounded-full border border-white/20 shadow-lg" />
      )}
    </section>
  );
}
