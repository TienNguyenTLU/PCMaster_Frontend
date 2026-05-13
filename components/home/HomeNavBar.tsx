'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

const imgSearch = 'http://localhost:3845/assets/a1ccb6f268fe7d652b126c777d162fa85ac9d6f9.svg';
const imgCart = 'http://localhost:3845/assets/1e107b8b22bae76f0ef40a8644f78085ebf78613.svg';
const imgUser = 'http://localhost:3845/assets/d17a13871153fccc2454b657e80283b2552a8d92.svg';

const navLinks = [
  { label: 'Builds', href: '/builds' },
  { label: 'Explore', href: '/explore' },
  { label: 'Laptops & pre-built PC', href: '/explore' },
  { label: 'Support', href: '/support' },
];

export default function HomeNavBar() {
  const { user, logout, hydrate } = useAuthStore();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Hydrate store on mount since skipHydration is true
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
              <img src={imgSearch} alt="" className="size-[10.5px] shrink-0" />
              <input
                type="search"
                placeholder="Search products..."
                className="flex-1 bg-transparent text-[14px] text-[rgba(66,71,84,0.5)] placeholder:text-[rgba(66,71,84,0.5)] focus:outline-none"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>

            {/* Cart */}
            <button
              type="button"
              className="p-2 rounded-[8px] hover:bg-[#f2f4f6] transition-colors cursor-pointer"
              aria-label="Cart"
            >
              <img src={imgCart} alt="" className="size-5" />
            </button>

            {/* User / Account Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={handleUserClick}
                className="p-2 rounded-[8px] hover:bg-[#f2f4f6] transition-colors cursor-pointer"
                aria-label={user ? 'Account' : 'Sign in'}
                title={user ? `Signed in as ${user.username}` : 'Sign in'}
              >
                <img src={imgUser} alt="" className="size-5" />
              </button>

              {/* Dropdown Overlay */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#e2e8f0] rounded-[8px] shadow-lg py-2 flex flex-col z-50">
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-[#e2e8f0]">
                        <p className="text-[14px] font-medium text-[#191c1e]">{user.username}</p>
                        <p className="text-[12px] text-[#64748b] truncate">{user.email}</p>
                      </div>
                      <Link
                        href="#"
                        onClick={() => setIsDropdownOpen(false)}
                        className="px-4 py-2 text-[14px] text-[#424754] hover:bg-[#f2f4f6] hover:text-[#0058be] transition-colors"
                      >
                        Cài đặt tài khoản
                      </Link>
                      <Link
                        href="#"
                        onClick={() => setIsDropdownOpen(false)}
                        className="px-4 py-2 text-[14px] text-[#424754] hover:bg-[#f2f4f6] hover:text-[#0058be] transition-colors"
                      >
                        Đơn hàng
                      </Link>
                      <Link
                        href="#"
                        onClick={() => setIsDropdownOpen(false)}
                        className="px-4 py-2 text-[14px] text-[#424754] hover:bg-[#f2f4f6] hover:text-[#0058be] transition-colors"
                      >
                        Cấu hình của bạn
                      </Link>
                      <div className="border-t border-[#e2e8f0] mt-1 pt-1">
                        <button
                          type="button"
                          onClick={handleLogoutClick}
                          className="w-full text-left px-4 py-2 text-[14px] text-red-600 hover:bg-[#fef2f2] transition-colors cursor-pointer"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        onClick={() => setIsDropdownOpen(false)}
                        className="px-4 py-2 text-[14px] text-[#424754] hover:bg-[#f2f4f6] hover:text-[#0058be] transition-colors"
                      >
                        Đăng nhập
                      </Link>
                      <Link
                        href="/auth/register"
                        onClick={() => setIsDropdownOpen(false)}
                        className="px-4 py-2 text-[14px] text-[#424754] hover:bg-[#f2f4f6] hover:text-[#0058be] transition-colors"
                      >
                        Đăng ký
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[12px] p-6 shadow-xl w-[400px] flex flex-col gap-4">
            <h3 className="text-[#191c1e] text-[20px] font-medium">Xác nhận đăng xuất</h3>
            <p className="text-[#424754] text-[14px]">
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản hiện tại không?
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={cancelLogout}
                className="px-4 py-2 rounded-[6px] text-[#424754] bg-[#f2f4f6] hover:bg-[#e2e8f0] transition-colors text-[14px] font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="px-4 py-2 rounded-[6px] text-white bg-red-600 hover:bg-red-700 transition-colors text-[14px] font-medium cursor-pointer"
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
