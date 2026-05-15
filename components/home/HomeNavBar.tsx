'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

import { Search, ShoppingCart, User, Settings, ClipboardList, Cpu, LogOut } from 'lucide-react';

const navLinks = [
  { label: 'Builds', href: '/builds' },
  { label: 'Explore', href: '/explore' },
  { label: 'Laptops & pre-built PC', href: '/explore' },
  { label: 'Support', href: '/support' },
];

export default function HomeNavBar() {
  const { user, logout, hydrate, isHydrated } = useAuthStore();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Hydrate store on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const handleUserClick = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
    router.push('/home');
  };

  const cancelLogout = () => {
    setIsLogoutModalOpen(false);
  };

  return (
    <>
      <nav
        className="
          fixed top-0 left-0 right-0 z-40
          backdrop-blur-[12px] bg-[rgba(255,255,255,0.8)]
          shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]
        "
      >
        <div className="flex items-center justify-between max-w-[1536px] mx-auto px-8 py-4">
          {/* Left: Logo + nav links */}
          <div className="flex items-center gap-12">
            <Link
              href="/home"
              className="text-[#0f172a] text-[24px] tracking-[-1.2px] leading-[32px] font-normal hover:opacity-80 transition-opacity"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              PCMaster
            </Link>

            <div className="flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[#475569] text-[16px] tracking-[-0.4px] leading-[24px] font-normal hover:text-[#0058be] transition-colors whitespace-nowrap"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Search + actions */}
          <div className="flex items-center gap-6">
            {/* Search bar */}
            <div className="flex items-center bg-[#f2f4f6] rounded-[8px] px-4 py-2 w-[256px] gap-3">
              <Search className="size-4 text-[#64748b] shrink-0" />
              <input
                type="search"
                placeholder="Search products..."
                className="flex-1 bg-transparent text-[14px] text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>

            {/* Cart */}
            <button
              type="button"
              className="p-2 rounded-[8px] hover:bg-[#f2f4f6] transition-colors cursor-pointer text-[#475569] hover:text-[#0058be]"
              aria-label="Cart"
            >
              <ShoppingCart className="size-5" />
            </button>

            {/* User / Auth links */}
            {!isHydrated ? (
              <div className="w-20" /> // Placeholder while hydrating
            ) : user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={handleUserClick}
                  className="p-2 rounded-[8px] hover:bg-[#f2f4f6] transition-colors cursor-pointer text-[#475569] hover:text-[#0058be]"
                  aria-label="Account"
                  title={`Signed in as ${user.username}`}
                >
                  <User className="size-5" />
                </button>

                {/* Dropdown Overlay */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-[#e2e8f0] rounded-[12px] shadow-xl py-2 flex flex-col z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#f1f5f9] bg-[#f8fafc]">
                      <p className="text-[14px] font-semibold text-[#0f172a]">{user.username}</p>
                      <p className="text-[12px] text-[#64748b] truncate">{user.email}</p>
                    </div>
                    <div className="p-1">
                      <Link
                        href="#"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-[14px] text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0058be] transition-all rounded-[6px]"
                      >
                        <Settings className="size-4" />
                        Cài đặt tài khoản
                      </Link>
                      <Link
                        href="#"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-[14px] text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0058be] transition-all rounded-[6px]"
                      >
                        <ClipboardList className="size-4" />
                        Đơn hàng của tôi
                      </Link>
                      <Link
                        href="#"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-[14px] text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0058be] transition-all rounded-[6px]"
                      >
                        <Cpu className="size-4" />
                        Cấu hình đã lưu
                      </Link>
                    </div>
                    <div className="border-t border-[#f1f5f9] mt-1 p-1">
                      <button
                        type="button"
                        onClick={handleLogoutClick}
                        className="flex items-center gap-3 w-full text-left px-3 py-2 text-[14px] text-red-600 hover:bg-[#fef2f2] transition-all rounded-[6px] cursor-pointer"
                      >
                        <LogOut className="size-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[14px] font-medium">
                <Link
                  href="/auth/login"
                  className="text-[#475569] hover:text-[#0058be] transition-colors"
                >
                  Đăng nhập
                </Link>
                <span className="text-[#e2e8f0]">/</span>
                <Link
                  href="/auth/register"
                  className="text-[#475569] hover:text-[#0058be] transition-colors"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[16px] p-6 shadow-2xl w-full max-w-[400px] flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-full">
                <LogOut className="size-6" />
              </div>
              <h3 className="text-[#0f172a] text-[18px] font-bold">Xác nhận đăng xuất</h3>
            </div>
            <p className="text-[#475569] text-[14px] leading-relaxed">
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống? Các thay đổi chưa lưu có thể bị mất.
            </p>
            <div className="flex justify-end gap-3 mt-4 border-t pt-4">
              <button
                type="button"
                onClick={cancelLogout}
                className="px-4 py-2 rounded-[8px] text-[#475569] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] transition-all text-[14px] font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="px-6 py-2 rounded-[8px] text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 transition-all text-[14px] font-medium cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
