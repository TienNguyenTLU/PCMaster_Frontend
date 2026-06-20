"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  ChevronRight,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  ArrowLeft,
  Clock,
  ShoppingBag,
} from "lucide-react";
import { promotionAPI, PromotionResponseWithProducts } from "@/lib/api";
import HomeNavBar from "@/components/home/HomeNavBar";
import AuthFooter from "@/components/auth/AuthFooter";
import { ProductCard } from "@/components/explore/ExplorePage";

export default function PromotionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [promotion, setPromotion] =
    useState<PromotionResponseWithProducts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    status: "UPCOMING" | "ACTIVE" | "ENDED";
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, status: "ENDED" });

  useEffect(() => {
    if (!slug) return;
    const fetchPromotionDetail = async () => {
      try {
        const data = await promotionAPI.getBySlug(slug);
        if (data) {
          setPromotion(data);
        } else {
          setError("Không tìm thấy chương trình khuyến mãi");
        }
      } catch (err) {
        console.error("Lỗi khi tải chi tiết khuyến mãi:", err);
        setError(
          "Không thể tải thông tin chương trình khuyến mãi. Vui lòng thử lại sau.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchPromotionDetail();
  }, [slug]);

  
  useEffect(() => {
    if (!promotion) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const start = new Date(promotion.startDate).getTime();
      const end = new Date(promotion.endDate).getTime();

      let targetTime = end;
      let status: "UPCOMING" | "ACTIVE" | "ENDED" = "ACTIVE";

      if (now < start) {
        targetTime = start;
        status = "UPCOMING";
      } else if (now > end) {
        status = "ENDED";
      }

      const difference = targetTime - now;

      if (difference <= 0 || status === "ENDED") {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          status: "ENDED",
        });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60),
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds, status });
      }
    };

    calculateTimeLeft(); 
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [promotion]);

  const bannerSrc = promotion?.bannerUrl?.startsWith("http")
    ? promotion.bannerUrl
    : promotion?.bannerUrl
      ? `http://localhost:8080${promotion.bannerUrl}`
      : null;

  return (
    <div className="flex flex-col min-h-screen">
      <HomeNavBar />

      <main
        className="flex-1 pt-[72px]"
        style={{
          background: "linear-gradient(180deg, #f7f9fb 0%, #f0f4fa 100%)",
        }}
      >
        {}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <div className="flex items-center gap-2 text-[12px] text-[#64748b] font-medium">
            <Link
              href="/home"
              className="hover:text-[#0058be] transition-colors"
            >
              Trang chủ
            </Link>
            <ChevronRight className="size-3" />
            <Link
              href="/promotions"
              className="hover:text-[#0058be] transition-colors"
            >
              Khuyến mãi
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-[#0f172a] font-bold truncate max-w-[200px] md:max-w-[400px]">
              {loading ? "Đang tải..." : promotion?.name || "Chi tiết"}
            </span>
          </div>
        </div>

        {loading ? (
          
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
            <div className="h-[280px] bg-white border border-[#e8ecf2] rounded-[24px] animate-pulse flex items-center justify-center">
              <div className="flex items-center text-[#64748b] gap-2 font-medium">
                <Loader2 className="size-6 animate-spin text-[#0058be]" />
                <span>Đang tải thông tin chiến dịch ưu đãi...</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-[16px] border border-[#e8ecf2] h-[340px] animate-pulse p-4 flex flex-col justify-between"
                >
                  <div className="bg-[#f1f5f9] rounded-[12px] h-[160px] w-full" />
                  <div className="space-y-2 mt-4">
                    <div className="bg-[#f1f5f9] h-4 rounded w-1/3" />
                    <div className="bg-[#f1f5f9] h-5 rounded w-full" />
                    <div className="bg-[#f1f5f9] h-5 rounded w-2/3" />
                  </div>
                  <div className="flex justify-between items-center mt-6">
                    <div className="bg-[#f1f5f9] h-6 rounded w-24" />
                    <div className="bg-[#f1f5f9] h-8 w-8 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error || !promotion ? (
          
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="bg-white rounded-[24px] border border-[#e8ecf2] p-16 shadow-xs flex flex-col items-center gap-6 max-w-[500px] mx-auto">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <ImageIcon className="size-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-[20px] font-black text-[#0f172a] mb-2">
                  Đã xảy ra lỗi
                </h3>
                <p className="text-[14px] text-[#64748b] leading-relaxed">
                  {error || "Không thể tìm thấy chiến dịch khuyến mãi yêu cầu."}
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => router.back()}
                  className="px-5 py-2.5 bg-[#f1f5f9] text-[#334155] rounded-[12px] text-[13px] font-bold hover:bg-[#e2e8f0] transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="size-4" /> Quay lại
                </button>
                <Link
                  href="/promotions"
                  className="px-5 py-2.5 bg-[#0058be] text-white rounded-[12px] text-[13px] font-bold hover:bg-[#0047a3] transition-colors"
                >
                  Tất cả khuyến mãi
                </Link>
              </div>
            </div>
          </div>
        ) : (
          
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10">
            {}
            <div className="relative bg-white rounded-[24px] border border-[#e8ecf2] overflow-hidden shadow-sm flex flex-col md:flex-row min-h-[300px]">
              {}
              <div className="md:w-1/2 min-h-[220px] md:min-h-auto bg-[#f8fafc] relative overflow-hidden flex items-center justify-center border-b md:border-b-0 md:border-r border-[#f1f5f9]">
                {bannerSrc ? (
                  <img
                    src={bannerSrc}
                    alt={promotion.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[#cbd5e1] p-10">
                    <ImageIcon className="size-16 stroke-[1]" />
                    <span className="text-[13px] font-bold tracking-wide uppercase">
                      Chiến dịch ưu đãi PCMaster
                    </span>
                  </div>
                )}
                {}
                <div className="absolute top-6 left-6 bg-red-500 text-white font-black text-[24px] px-4.5 py-2 rounded-[16px] shadow-lg flex items-baseline gap-0.5">
                  -{promotion.discountPercent}
                  <span className="text-[14px] font-bold">%</span>
                </div>
              </div>

              {}
              <div className="md:w-1/2 p-8 flex flex-col justify-between gap-6 bg-gradient-to-br from-white to-[#fcfdfe]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {}
                    {timeLeft.status === "ACTIVE" ? (
                      <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5 animate-pulse">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        Đang diễn ra
                      </span>
                    ) : timeLeft.status === "UPCOMING" ? (
                      <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-amber-500" />
                        Sắp bắt đầu
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                        Đã kết thúc
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 text-[12px] text-[#64748b] font-semibold bg-[#f1f5f9] px-3 py-1 rounded-full border border-[#e2e8f0]">
                      <Calendar className="size-3.5 text-[#0058be]" />
                      <span>
                        {new Date(promotion.startDate).toLocaleDateString(
                          "vi-VN",
                        )}{" "}
                        -{" "}
                        {new Date(promotion.endDate).toLocaleDateString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
                  </div>

                  <h1 className="text-[26px] md:text-[32px] font-black tracking-[-1px] text-[#0f172a] leading-tight">
                    {promotion.name}
                  </h1>

                  <p className="text-[14px] text-[#475569] leading-relaxed">
                    {promotion.description ||
                      "Chương trình ưu đãi giảm giá sốc dành riêng cho khách hàng mua sắm linh kiện PC trực tuyến tại hệ thống PCMaster."}
                  </p>
                </div>

                {}
                <div className="bg-[#0f172a] rounded-[20px] p-5 text-white flex flex-col gap-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.15)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />

                  <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase text-blue-400">
                    <Clock className="size-4 text-blue-400 shrink-0" />
                    {timeLeft.status === "UPCOMING"
                      ? "Thời gian đếm ngược bắt đầu:"
                      : timeLeft.status === "ENDED"
                        ? "Chiến dịch đã khép lại"
                        : "Ưu đãi kết thúc sau:"}
                  </div>

                  {timeLeft.status !== "ENDED" ? (
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div className="bg-white/5 border border-white/10 rounded-[12px] p-2.5 flex flex-col">
                        <span className="text-[20px] md:text-[24px] font-black font-mono leading-none tracking-tight">
                          {String(timeLeft.days).padStart(2, "0")}
                        </span>
                        <span className="text-[9px] text-[#94a3b8] font-bold mt-1 uppercase">
                          Ngày
                        </span>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-[12px] p-2.5 flex flex-col">
                        <span className="text-[20px] md:text-[24px] font-black font-mono leading-none tracking-tight">
                          {String(timeLeft.hours).padStart(2, "0")}
                        </span>
                        <span className="text-[9px] text-[#94a3b8] font-bold mt-1 uppercase">
                          Giờ
                        </span>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-[12px] p-2.5 flex flex-col">
                        <span className="text-[20px] md:text-[24px] font-black font-mono leading-none tracking-tight">
                          {String(timeLeft.minutes).padStart(2, "0")}
                        </span>
                        <span className="text-[9px] text-[#94a3b8] font-bold mt-1 uppercase">
                          Phút
                        </span>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-[12px] p-2.5 flex flex-col">
                        <span className="text-[20px] md:text-[24px] font-black font-mono leading-none tracking-tight text-red-400 animate-pulse">
                          {String(timeLeft.seconds).padStart(2, "0")}
                        </span>
                        <span className="text-[9px] text-[#94a3b8] font-bold mt-1 uppercase">
                          Giây
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[14px] text-[#94a3b8] font-semibold italic text-center py-2 bg-white/5 border border-white/10 rounded-[12px]">
                      Cảm ơn quý khách đã đồng hành cùng chiến dịch ưu đãi này!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#e8ecf2] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-[12px] bg-[#eff6ff] flex items-center justify-center border border-blue-100">
                    <ShoppingBag className="size-5 text-[#0058be]" />
                  </div>
                  <div>
                    <h2 className="text-[20px] font-black text-[#0f172a]">
                      Sản Phẩm Khuyến Mãi
                    </h2>
                    <p className="text-[12px] text-[#64748b]">
                      Tổng số: {promotion.products?.length || 0} sản phẩm đang
                      có giá cực ưu đãi
                    </p>
                  </div>
                </div>
              </div>

              {!promotion.products || promotion.products.length === 0 ? (
                
                <div className="bg-white rounded-[24px] border border-[#e8ecf2] p-16 text-center shadow-xs flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center">
                    <Sparkles className="size-8 text-[#cbd5e1]" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold text-[#0f172a] mb-1">
                      Chưa có sản phẩm tham gia khuyến mãi
                    </h3>
                    <p className="text-[13px] text-[#94a3b8] max-w-[360px] mx-auto">
                      Sản phẩm được áp dụng trong chiến dịch này đang được chuẩn
                      bị. Hãy khám phá các chương trình sale khác nhé!
                    </p>
                  </div>
                  <Link
                    href="/explore"
                    className="px-6 py-2.5 bg-[#0058be] text-white rounded-[12px] text-[13px] font-bold hover:bg-[#0047a3] transition-colors mt-2"
                  >
                    Xem tất cả linh kiện
                  </Link>
                </div>
              ) : (
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {promotion.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <AuthFooter />
    </div>
  );
}
