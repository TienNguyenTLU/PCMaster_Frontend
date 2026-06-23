"use client";

export default function CartSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex gap-4 p-4 bg-white rounded-[16px] border border-[#e8ecf2]"
        >
          <div className="w-[88px] h-[88px] bg-[#f1f5f9] rounded-[12px] shrink-0" />
          <div className="flex-1 flex flex-col gap-2.5 py-1">
            <div className="h-4 bg-[#e2e8f0] rounded w-3/4" />
            <div className="h-3 bg-[#e2e8f0] rounded w-1/2" />
            <div className="flex justify-between items-center mt-auto">
              <div className="h-8 bg-[#e2e8f0] rounded w-24" />
              <div className="h-5 bg-[#e2e8f0] rounded w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
