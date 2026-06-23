"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { adminAPI, Category } from "@/lib/api";
import HomeCategoryCard from "./HomeCategoryCard";
import {
  Cpu,
  Gamepad2,
  HardDrive,
  Layers,
  Zap,
  Fan,
  Server,
  Monitor,
  CircuitBoard,
  HelpCircle,
  Laptop,
  Keyboard,
  Mouse,
  Headphones,
  ChevronRight,
} from "lucide-react";

function getCategoryIcon(name: string) {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (
    slug.includes("pc_system") ||
    slug.includes("pc-system") ||
    slug.includes("pc system") ||
    slug.includes("nguyen bo")
  ) {
    return Laptop;
  }
  if (
    slug.includes("pc_gear") ||
    slug.includes("pc-gear") ||
    slug.includes("pc gear") ||
    slug.includes("gaming")
  ) {
    return Gamepad2;
  }
  if (
    slug.includes("cpu") ||
    slug.includes("vi xu ly") ||
    slug.includes("processor")
  ) {
    return Cpu;
  }
  if (
    slug.includes("vga") ||
    slug.includes("graphics") ||
    slug.includes("do hoa") ||
    slug.includes("card man hinh")
  ) {
    return Gamepad2;
  }
  if (
    slug.includes("ram") ||
    slug.includes("bo nho") ||
    slug.includes("memory")
  ) {
    return Layers;
  }
  if (
    slug.includes("main") ||
    slug.includes("board") ||
    slug.includes("bo mach")
  ) {
    return CircuitBoard;
  }
  if (
    slug.includes("storage") ||
    slug.includes("ssd") ||
    slug.includes("hdd") ||
    slug.includes("o cung")
  ) {
    return HardDrive;
  }
  if (
    slug.includes("psu") ||
    slug.includes("power") ||
    slug.includes("nguon")
  ) {
    return Zap;
  }
  if (slug.includes("case") || slug.includes("vo may")) {
    return Server;
  }
  if (
    slug.includes("cool") ||
    slug.includes("tan nhiet") ||
    slug.includes("fan") ||
    slug.includes("quat")
  ) {
    return Fan;
  }
  if (slug.includes("monitor") || slug.includes("man hinh")) {
    return Monitor;
  }
  if (slug.includes("laptop")) {
    return Laptop;
  }
  if (slug.includes("ban phim") || slug.includes("keyboard")) {
    return Keyboard;
  }
  if (slug.includes("chuot") || slug.includes("mouse")) {
    return Mouse;
  }
  if (
    slug.includes("tai nghe") ||
    slug.includes("headphone") ||
    slug.includes("audio")
  ) {
    return Headphones;
  }
  return HelpCircle;
}

function CategorySkeleton() {
  return (
    <div className="bg-white border border-[#e8ecf2] rounded-[20px] p-6 flex flex-col items-center justify-center text-center gap-4 animate-pulse w-full">
      <div className="size-14 bg-[#f1f5f9] rounded-[16px]" />
      <div className="h-4 bg-[#e2e8f0] rounded w-2/3" />
    </div>
  );
}

export default function HomeCategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI
      .getCategories(0, 100)
      .then((res) => {
        setCategories(res.content || []);
      })
      .catch((err) => {
        console.error("Failed to load categories on homepage:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <section className="flex flex-col gap-10 max-w-[1536px] w-full px-8">
      {}
      <div className="flex items-end justify-between w-full">
        <div className="flex flex-col gap-2">
          <p
            className="text-[#0058be] text-[14px] tracking-[1.4px] uppercase font-semibold leading-[20px]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            DANH MỤC SẢN PHẨM
          </p>
        </div>

        {}
        <div className="flex-1 mx-12">
          <div className="bg-[rgba(194,198,214,0.2)] h-px w-full" />
        </div>

        {}
        <Link
          href="/explore"
          className="flex items-center gap-2 text-[#424754] text-[14px] leading-[20px] hover:text-[#0058be] transition-colors"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Xem tất cả danh mục
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-5 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <CategorySkeleton key={idx} />
          ))
        ) : categories.length === 0 ? (
          <div className="col-span-full py-8 text-center text-[#64748b] text-[14px]">
            Không tìm thấy danh mục nào.
          </div>
        ) : (
          categories.map((cat) => {
            const Icon = getCategoryIcon(cat.name);
            return (
              <HomeCategoryCard
                key={cat.id}
                id={cat.id}
                name={cat.name}
                Icon={Icon}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
