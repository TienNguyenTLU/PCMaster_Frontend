'use client';

import { usePathname } from 'next/navigation';
import { Search, Bell, User } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  // Simple breadcrumbs from pathname mapped to Vietnamese
  const TITLE_MAP: Record<string, string> = {
    overview: 'Tổng quan thống kê',
    products: 'Quản lý sản phẩm',
    brands: 'Quản lý thương hiệu',
    banners: 'Quản lý banner',
    suppliers: 'Quản lý nhà cung cấp',
    'purchase-orders': 'Quản lý đơn nhập hàng',
    orders: 'Quản lý đơn bán hàng',
    inventory: 'Quản lý kho hàng',
  };

  const pathSegments = pathname.split('/').filter(p => p && p !== 'dashboard');
  const rawTitle = pathSegments.length > 0 ? pathSegments[0] : 'overview';
  const title = TITLE_MAP[rawTitle.toLowerCase()] || rawTitle;

  const handleLogout = () => {
    logout();
    router.push('/home');
  };

  return (
    <header className="h-16 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-8 sticky top-0 z-30">
      {/* Left: Breadcrumbs / Title */}
      <div className="flex items-center gap-2">
        <h1 
          className="text-[#0f172a] text-[18px] font-semibold tracking-[-0.2px]"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {title}
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
          <input 
            type="text" 
            placeholder="Tìm kiếm..." 
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-full pl-9 pr-4 py-1.5 text-[14px] focus:outline-none focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] transition-all w-[240px]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
        </div>

        {/* Notifications */}
        <button className="relative p-1.5 text-[#64748b] hover:bg-[#f1f5f9] rounded-full transition-colors cursor-pointer">
          <Bell className="size-5" />
          <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Profile Dropdown Trigger */}
        <div className="flex items-center gap-3 border-l border-[#e2e8f0] pl-6 relative group cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#e2e8f0] flex items-center justify-center text-[#64748b]">
            <User className="size-4" />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-[#0f172a] text-[13px] font-medium leading-tight">{user?.username || 'Admin'}</span>
            <span className="text-[#64748b] text-[11px] leading-tight">Quản trị viên</span>
          </div>

          {/* Simple CSS-based Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#e2e8f0] rounded-[8px] shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <Link href="/home" className="block px-4 py-2 text-[13px] text-[#475569] hover:bg-[#f1f5f9] transition-colors">
              Về trang chủ bán hàng
            </Link>
            <div className="border-t border-[#e2e8f0] my-1"></div>
            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-[#fef2f2] transition-colors cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
