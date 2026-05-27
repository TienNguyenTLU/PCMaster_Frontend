'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { promotionAPI, Promotion } from '@/lib/api';
import HomeNavBar from '@/components/home/HomeNavBar';
import AuthFooter from '@/components/auth/AuthFooter';

export default function PromotionsListPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const data = await promotionAPI.listActive();
        setPromotions(data || []);
      } catch (err) {
        console.error('Lỗi khi tải danh sách khuyến mãi:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <HomeNavBar />
      <main className="flex-1 pt-[72px]" style={{ background: 'linear-gradient(180deg, #f7f9fb 0%, #f0f4fa 100%)' }}>
        
        {/* Banner Hero (Minimalist Modern Design) */}
        <div className="bg-white border-b border-[#e2e8f0]/60 py-10 px-8">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-[12px] text-[#64748b] font-semibold">
              <Link href="/home" className="hover:text-[#0058be] transition-colors">Trang chủ</Link>
              <ChevronRight className="size-3" />
              <span className="text-[#0f172a] font-bold">Khuyến mãi</span>
            </div>
            <h1 className="text-[30px] md:text-[36px] font-black tracking-[-0.8px] text-[#0f172a] flex items-center gap-2.5">
              <Sparkles className="size-7 text-[#0058be]" />
              Siêu Ưu Đãi Độc Quyền
            </h1>
            <p className="text-[#64748b] text-[14px] md:text-[15px] font-medium max-w-[700px] leading-relaxed">
              Khám phá các chiến dịch sale cực sốc, mã giảm giá độc quyền chỉ có tại PCMaster. Nâng cấp cấu hình PC của bạn với mức giá hời nhất!
            </p>
          </div>
        </div>

        {/* Content list */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-[#64748b]">
              <Loader2 className="size-8 animate-spin text-[#0058be] mr-2" /> Đang tải các chương trình ưu đãi...
            </div>
          ) : promotions.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-[#e8ecf2] p-16 text-center shadow-xs flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center">
                <Sparkles className="size-8 text-[#cbd5e1]" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-[#0f172a] mb-1">Hiện chưa có chương trình khuyến mãi nào</h3>
                <p className="text-[14px] text-[#94a3b8] max-w-[320px] mx-auto">Chúng tôi đang chuẩn bị những ưu đãi hấp dẫn tiếp theo. Hãy quay lại sau nhé!</p>
              </div>
              <Link href="/explore" className="px-6 py-2.5 bg-[#0058be] text-white rounded-[12px] text-[13px] font-bold hover:bg-[#0047a3] transition-colors mt-2">
                Khám phá linh kiện khác
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {promotions.map((p) => {
                const bannerSrc = p.bannerUrl?.startsWith('http')
                  ? p.bannerUrl
                  : p.bannerUrl
                    ? `http://localhost:8080${p.bannerUrl}`
                    : null;

                return (
                  <Link
                    key={p.id}
                    href={`/promotions/${p.slug}`}
                    className="bg-white rounded-[20px] border border-[#e8ecf2] overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 hover:border-[#0058be]/30 transition-all duration-300 group"
                  >
                    {/* Banner Area */}
                    <div className="h-[200px] bg-[#f8fafc] relative overflow-hidden flex items-center justify-center border-b border-[#f1f5f9]">
                      {bannerSrc ? (
                        <img
                          src={bannerSrc}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-[#cbd5e1]">
                          <ImageIcon className="size-10 stroke-[1.25]" />
                          <span className="text-[12px] font-medium">Chiến dịch ưu đãi</span>
                        </div>
                      )}
                      
                      {/* Discount Stamp */}
                      <div className="absolute bottom-4 left-4 bg-red-500 text-white font-black text-[20px] px-3.5 py-1.5 rounded-[12px] shadow-md flex items-baseline gap-0.5">
                        -{p.discountPercent}
                        <span className="text-[12px] font-bold">%</span>
                      </div>
                      
                      {/* Active tag */}
                      <span className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        Đang diễn ra
                      </span>
                    </div>

                    {/* Content Detail */}
                    <div className="p-6 flex flex-col gap-4 flex-1">
                      <h3 className="font-extrabold text-[18px] text-[#0f172a] leading-snug line-clamp-1 group-hover:text-[#0058be] transition-colors">
                        {p.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-[12px] text-[#64748b] font-medium bg-[#f8fafc] border border-[#f1f5f9] rounded-[10px] px-3 py-2">
                        <Calendar className="size-4 text-[#0058be] shrink-0" />
                        <span>Thời hạn: {new Date(p.startDate).toLocaleDateString('vi-VN')} - {new Date(p.endDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                      
                      <p className="text-[13px] text-[#64748b] leading-relaxed line-clamp-2">
                        {p.description || 'Chương trình giảm giá siêu khủng dành riêng cho các thành viên của PCMaster. Số lượng linh kiện có hạn!'}
                      </p>
                      
                      <div className="flex items-center justify-between text-[13px] font-bold text-[#0058be] border-t border-[#f1f5f9] pt-4 mt-auto">
                        <span>Xem chi tiết ưu đãi</span>
                        <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}
