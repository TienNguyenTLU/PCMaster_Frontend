'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isHydrated, hydrate } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated) {
      if (!user) {
        toast.error('Vui lòng đăng nhập tài khoản quản trị!');
        router.replace('/auth/login');
      } else if (user.role !== 'ADMIN') {
        toast.error('Bạn không có quyền truy cập trang quản lý (Dashboard)!');
        router.replace('/home');
      }
    }
  }, [isHydrated, user, router]);

  // Display fullscreen loader during hydration or if unauthorized to prevent flash of content
  if (!isHydrated || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[#0058be]">
          <Loader2 className="size-10 animate-spin" />
          <p className="text-[14px] font-semibold text-slate-500" style={{ fontFamily: 'Inter, sans-serif' }}>
            Đang xác thực quyền truy cập...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
