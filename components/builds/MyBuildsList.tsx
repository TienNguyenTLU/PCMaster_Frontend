'use client';

import React from 'react';
import { Cpu, Calendar, Trash2, Loader2, Heart, FolderOpen, Plus } from 'lucide-react';
import { PcBuildResponse } from '@/lib/api';

interface MyBuildsListProps {
  myBuilds: PcBuildResponse[];
  loadingMyBuilds: boolean;
  user: any;
  loadSavedBuild: (b: PcBuildResponse) => void;
  handleDeleteBuildClick: (buildId: number, e: React.MouseEvent) => void;
  setActiveTab: (tab: 'builder' | 'my-builds') => void;
}

export default function MyBuildsList({
  myBuilds,
  loadingMyBuilds,
  user,
  loadSavedBuild,
  handleDeleteBuildClick,
  setActiveTab
}: MyBuildsListProps) {
  return (
    <div className="max-w-[800px] mx-auto w-full flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-[#0f172a] text-[18px] font-bold">Danh sách cấu hình đã lưu</h3>
          <p className="text-[#64748b] text-[13px] mt-0.5">Tải lại cấu hình cũ để tiếp tục căn chỉnh hoặc đặt mua.</p>
        </div>
        <button
          onClick={() => setActiveTab('builder')}
          className="bg-white border border-[#e8ecf2] px-4 py-2 rounded-[10px] text-[13px] font-bold text-[#0058be] hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Plus className="size-4" /> Thiết kế cấu hình mới
        </button>
      </div>

      {loadingMyBuilds ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#0058be]">
          <Loader2 className="size-8 animate-spin" />
          <span className="text-[14px] text-slate-500 font-medium">Đang tải cấu hình của bạn...</span>
        </div>
      ) : !user ? (
        <div className="bg-white rounded-[24px] border border-[#e8ecf2] p-12 text-center flex flex-col items-center gap-4 shadow-sm">
          <div className="p-4 bg-blue-50 text-[#0058be] rounded-full shrink-0">
            <FolderOpen className="size-10" />
          </div>
          <div>
            <h4 className="text-[#0f172a] font-bold text-[16px]">Vui lòng đăng nhập tài khoản</h4>
            <p className="text-[#64748b] text-[13px] mt-1">Đăng nhập tài khoản khách hàng để xem các cấu hình PC đã tự thiết kế trước đó.</p>
          </div>
        </div>
      ) : myBuilds.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-[#e8ecf2] p-12 text-center flex flex-col items-center gap-4 shadow-sm">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-full shrink-0">
            <Heart className="size-10" />
          </div>
          <div>
            <h4 className="text-[#0f172a] font-bold text-[16px]">Bạn chưa lưu cấu hình nào</h4>
            <p className="text-[#64748b] text-[13px] mt-1">Tự tay lắp ráp các linh kiện tương thích bên tab **Thiết kế PC** và lưu lại.</p>
          </div>
          <button
            onClick={() => setActiveTab('builder')}
            className="bg-[#0058be] text-white px-5 py-2 rounded-[10px] text-[13px] font-bold hover:bg-[#0047a3] cursor-pointer"
          >
            Bắt đầu lắp ráp ngay
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {myBuilds.map(b => (
            <div
               key={b.id}
               onClick={() => loadSavedBuild(b)}
               className="bg-white rounded-[24px] border border-[#e8ecf2] p-6 shadow-sm hover:border-[#0058be]/30 hover:shadow-[0_12px_36px_rgba(0,88,190,0.06)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 cursor-pointer group/card"
            >
              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-[#eff6ff] text-[#0058be] border border-blue-100/30 rounded-[16px] group-hover/card:bg-[#0058be] group-hover/card:text-white transition-colors duration-300">
                  <Cpu className="size-6" />
                </div>
                <div>
                  <h4 className="text-[#0f172a] font-bold text-[16px] leading-snug group-hover/card:text-[#0058be] transition-colors">{b.name}</h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-[11px] text-[#64748b] font-semibold">
                    <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-[6px]">
                      <Calendar className="size-3.5 text-[#94a3b8]" />
                      {new Date(b.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[#0058be] bg-[#eff6ff] border border-blue-100/35 px-2 py-0.5 rounded-[6px]">{b.items.length} linh kiện chính</span>
                    {b.totalPower > 0 && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-[6px]">TDP: {b.totalPower}W</span>
                    )}
                  </div>
                </div>
              </div>

              <div
                className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 shrink-0"
                onClick={e => e.stopPropagation()} // prevent double trigger
              >
                <div className="md:text-right">
                  <p className="text-[10px] text-[#94a3b8] uppercase font-bold tracking-[1.5px] mb-0.5">Tổng giá trị</p>
                  <p className="text-[20px] font-black text-[#0058be] leading-none" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {b.totalPrice.toLocaleString('vi-VN')}
                    <span className="text-[13px] font-bold ml-0.5">₫</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadSavedBuild(b)}
                    className="bg-blue-50 text-[#0058be] hover:bg-[#0058be] hover:text-white border border-blue-100/40 px-4.5 py-2.5 rounded-[12px] text-[13px] font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shrink-0"
                  >
                    Tải cấu hình
                  </button>
                  <button
                    onClick={(e) => handleDeleteBuildClick(b.id, e)}
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 rounded-[12px] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shadow-sm shrink-0"
                    title="Xóa cấu hình"
                  >
                    <Trash2 className="size-4.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
