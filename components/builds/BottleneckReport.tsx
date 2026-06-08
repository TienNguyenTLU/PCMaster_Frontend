'use client';

import { Loader2 } from 'lucide-react';
import { BuildState } from './BuildPage';

interface BottleneckReportProps {
  build: BuildState;
  bottleneckResult: any;
  loadingBottleneck: boolean;
  bottleneckError: string | null;
}

export default function BottleneckReport({
  build,
  bottleneckResult,
  loadingBottleneck,
  bottleneckError
}: BottleneckReportProps) {
  if (!build.cpu && !build.vga && !build.ram && !loadingBottleneck && !bottleneckResult && !bottleneckError) {
    return null;
  }

  return (
    <div className="bg-white border border-[#e8ecf2] rounded-[24px] p-6 flex flex-col gap-5 shadow-sm mb-3">
      <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
        <div className="flex items-center gap-2 text-[#0058be] font-extrabold text-[14px] uppercase tracking-[0.5px]">
          <span className="flex items-center justify-center size-6 rounded-full bg-[#eff6ff] text-[12px] shadow-sm">🤖</span>
          Báo cáo nghẽn cổ chai (AI Bottleneck Report)
        </div>
        {loadingBottleneck && (
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#0058be] uppercase tracking-[0.5px] animate-pulse">
            <Loader2 className="size-3.5 animate-spin" /> Đang phân tích...
          </span>
        )}
      </div>

      {/* Missing components warning */}
      {(!build.cpu || !build.vga || !build.ram) && !loadingBottleneck && (
        <div className="text-[12.5px] text-[#64748b] font-medium py-2 flex items-center gap-2">
          <span className="text-[16px]">💡</span> 
          Hãy chọn đầy đủ <strong>Vi xử lý (CPU)</strong>, <strong>Card đồ họa (GPU)</strong> và <strong>RAM</strong> để hệ thống AI tự động phân tích và đưa ra báo cáo tương quan hiệu năng.
        </div>
      )}

      {/* Error state */}
      {bottleneckError && !loadingBottleneck && (
        <div className="bg-rose-50 border border-rose-100 rounded-[16px] p-4 text-[12.5px] text-rose-700 font-semibold flex items-start gap-2.5">
          <span className="text-[16px] shrink-0">⚠️</span>
          <div>
            <p className="font-bold mb-1">Không thể phân tích cấu hình hiện tại</p>
            <p className="text-[11.5px] text-rose-600 font-medium leading-relaxed">{bottleneckError}</p>
          </div>
        </div>
      )}

      {/* Report Content */}
      {bottleneckResult && !loadingBottleneck && !bottleneckError && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bottleneckResult.map((res: any) => {
              const classNames: Record<number, string> = {
                0: "Cân bằng",
                1: "Nghẽn CPU",
                2: "Nghẽn GPU",
                3: "Nghẽn RAM"
              };
              
              const colors: Record<number, { text: string, bg: string, border: string, stroke: string }> = {
                0: { text: "text-[#10b981]", bg: "bg-[#10b981]/10", border: "border-[#10b981]/20", stroke: "#10b981" },
                1: { text: "text-[#06b6d4]", bg: "bg-[#06b6d4]/10", border: "border-[#06b6d4]/20", stroke: "#06b6d4" },
                2: { text: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10", border: "border-[#f59e0b]/20", stroke: "#f59e0b" },
                3: { text: "text-[#ef4444]", bg: "bg-[#ef4444]/10", border: "border-[#ef4444]/20", stroke: "#ef4444" }
              };

              const type = res.predicted_type as number;
              const currentStyle = colors[type] || colors[0];
              const currentLabel = classNames[type] || "Không rõ";
              const confidence = Math.round(res.probability * 100);
              const circumference = 2 * Math.PI * 34; // r = 34 -> ~213.6
              const strokeDashoffset = circumference - (confidence / 100) * circumference;

              return (
                <div 
                  key={res.resolution}
                  className={`bg-[#f8fafc] border border-[#e2e8f0] rounded-[20px] p-4 flex flex-col items-center text-center transition-all hover:shadow-sm hover:border-[#cbd5e1]`}
                >
                  <div className="mb-2">
                    <p className="text-[15px] font-black text-[#0f172a] tracking-tight">{res.resolution}p</p>
                    <p className="text-[10px] text-[#64748b] font-semibold">{res.resolution_label}</p>
                  </div>

                  {/* Radial Gauge */}
                  <div className="relative w-20 h-20 my-3">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                      <circle 
                        className="text-[#e2e8f0]" 
                        strokeWidth="5" 
                        stroke="currentColor" 
                        fill="none" 
                        r="34" 
                        cx="40" 
                        cy="40" 
                      />
                      <circle 
                        strokeWidth="5" 
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        stroke={currentStyle.stroke}
                        fill="none" 
                        r="34" 
                        cx="40" 
                        cy="40" 
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold text-[#0f172a]">
                      {confidence}%
                    </div>
                  </div>

                  <span className={`text-[11px] font-extrabold px-3 py-1 rounded-[20px] ${currentStyle.bg} ${currentStyle.text} ${currentStyle.border} border uppercase tracking-[0.5px]`}>
                    {currentLabel}
                  </span>
                </div>
              );
            })}
          </div>


        </div>
      )}
    </div>
  );
}
