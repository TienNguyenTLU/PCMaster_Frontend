import React from "react";

export default function SkeletonCard() {
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
