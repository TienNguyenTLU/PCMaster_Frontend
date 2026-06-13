import { LucideIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getCategoryLabel } from "@/lib/api";

interface CategoryCardProps {
  id: string | number;
  name: string;
  Icon: LucideIcon;
}

export default function HomeCategoryCard({
  id,
  name,
  Icon,
}: CategoryCardProps) {
  return (
    <Link
      href={`/explore?category=${id}`}
      className="group bg-white border border-[#e8ecf2] rounded-[20px] p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-[#0058be] hover:shadow-[0_12px_32px_rgba(0,88,190,0.08)] hover:-translate-y-1 transition-all duration-300 w-full"
    >
      {/* Icon Badge */}
      <div className="size-14 bg-[#eff6ff] group-hover:bg-[#0058be] text-[#0058be] group-hover:text-white rounded-[16px] flex items-center justify-center transition-all duration-300 shadow-sm">
        <Icon className="size-7 transition-transform duration-300 group-hover:scale-110" />
      </div>

      {/* Category Name */}
      <div className="flex flex-col items-center gap-1 min-h-[46px] justify-center">
        <h3
          className="text-[#191c1e] text-[15px] sm:text-[16px] font-semibold tracking-[-0.3px] leading-tight group-hover:text-[#0058be] transition-colors"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {getCategoryLabel(name)}
        </h3>

        {/* Subtle hover reveal element */}
        <span className="flex items-center gap-1 text-[11px] font-semibold text-[#0058be] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          Khám phá ngay
          <ArrowRight className="size-3" />
        </span>
      </div>
    </Link>
  );
}
