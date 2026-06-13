"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore, useCartStore } from "@/lib/store";

import {
  ShoppingCart,
  User,
  Settings,
  ClipboardList,
  Cpu,
  LogOut,
} from "lucide-react";

const navLinks = [
  { label: "Build PC", href: "/builds" },
  { label: "Linh Kiện", href: "/explore" },
  { label: "PC build sẵn", href: "/prebuilt" },
  { label: "Khuyến Mãi", href: "/promotions" },
  { label: "Hỗ trợ", href: "/support" },
];

export default function HomeNavBar() {
  const { user, logout, hydrate, isHydrated } = useAuthStore();
  const { items, fetchCart } = useCartStore();
  const router = useRouter();
  const pathname = usePathname();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Scroll detection hook for glassmorphism layout changes
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 12) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hydrate once on mount — reads localStorage, validates JWT expiry, sets store.
  useEffect(() => {
    hydrate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch cart whenever user logs in
  useEffect(() => {
    if (isHydrated && user) {
      fetchCart();
    }
  }, [isHydrated, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isDropdownOpen]);

  const confirmLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
    router.push("/home");
  };

  return (
    <>
      <nav
        className={`
          fixed top-0 left-0 right-0 z-40
          transition-all duration-300 ease-in-out
          ${
            isScrolled
              ? "bg-white/80 border-b border-[#e2e8f0]/80 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] backdrop-blur-[16px]"
              : "bg-white/40 border-b border-[#e2e8f0]/30 backdrop-blur-[8px]"
          }
        `}
      >
        <div
          className={`
            flex items-center justify-between max-w-[1536px] mx-auto px-8
            transition-all duration-300 ease-in-out
            ${isScrolled ? "py-3" : "py-4"}
          `}
        >
          {/* Left: Logo + nav links */}
          <div className="flex items-center gap-12">
            <Link
              href="/home"
              className="text-[#0f172a] text-[24px] tracking-[-1.2px] leading-[32px] font-bold hover:opacity-85 active:scale-95 transition-all duration-200"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              PCMaster
            </Link>

            <div className="flex items-center gap-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`
                      group relative text-[15px] tracking-[-0.4px] font-semibold transition-colors whitespace-nowrap pb-1 pt-0.5
                      ${isActive ? "text-[#0058be]" : "text-[#475569] hover:text-[#0058be]"}
                    `}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {link.label}
                    {/* Active/Hover line slide animation */}
                    <span
                      className={`
                        absolute bottom-0 left-0 right-0 h-[2px] bg-[#0058be] rounded-full transition-all duration-300 origin-left
                        ${
                          isActive
                            ? "scale-x-100 opacity-100"
                            : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                        }
                      `}
                    />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-6">
            {/* Cart */}
            <Link
              href="/cart"
              className="
                group relative p-2 rounded-[8px] hover:bg-[#f2f4f6] transition-all duration-200 cursor-pointer text-[#475569] hover:text-[#0058be]
                active:scale-95 hover:scale-105
              "
              aria-label="Giỏ hàng"
            >
              <ShoppingCart className="size-5 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#0058be] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm transition-all duration-300">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* ── Auth area ──────────────────────────────────────────────── */}
            {!isHydrated ? (
              /* Skeleton — prevents layout shift while reading localStorage */
              <div className="w-[120px] h-[36px] rounded-[8px] bg-[#f2f4f6] animate-pulse" />
            ) : user ? (
              /* Logged-in: user dropdown */
              <div className="relative" data-dropdown>
                <button
                  type="button"
                  id="navbar-user-btn"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="
                    group p-2 rounded-[8px] hover:bg-[#f2f4f6] transition-all duration-200 cursor-pointer text-[#475569] hover:text-[#0058be]
                    active:scale-95 hover:scale-105
                  "
                  aria-label="Account"
                  title={`Đã đăng nhập: ${user.username}`}
                >
                  <User className="size-5 transition-transform duration-300 group-hover:scale-110" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-[#e2e8f0] rounded-[12px] shadow-xl py-2 flex flex-col z-50 overflow-hidden animate-dropdown origin-top-right">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-[#f1f5f9] bg-[#f8fafc]">
                      <p className="text-[14px] font-semibold text-[#0f172a]">
                        {user.username}
                      </p>
                      <p className="text-[12px] text-[#64748b] truncate">
                        {user.email}
                      </p>
                    </div>

                    {/* Menu items */}
                    <div className="p-1">
                      <Link
                        href="/settings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-[14px] text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0058be] transition-all rounded-[6px]"
                      >
                        <Settings className="size-4" />
                        Cài đặt tài khoản
                      </Link>
                      <Link
                        href="/my-orders"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-[14px] text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0058be] transition-all rounded-[6px]"
                      >
                        <ClipboardList className="size-4" />
                        Đơn hàng của tôi
                      </Link>
                      <Link
                        href="/builds?tab=my-builds"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-[14px] text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0058be] transition-all rounded-[6px]"
                      >
                        <Cpu className="size-4" />
                        Cấu hình đã lưu
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-[#f1f5f9] mt-1 p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsLogoutModalOpen(true);
                        }}
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
              /* Logged-out: login / register links */
              <div className="flex items-center gap-1.5 text-[14px] font-semibold">
                <Link
                  href="/auth/login"
                  id="navbar-login-link"
                  className="text-[#475569] hover:text-[#0058be] px-3 py-1.5 rounded-[8px] hover:bg-[#f2f4f6] transition-all active:scale-95"
                >
                  Đăng nhập
                </Link>
                <span className="text-[#cbd5e1] select-none">|</span>
                <Link
                  href="/auth/register"
                  id="navbar-register-link"
                  className="text-white bg-[#0058be] hover:bg-[#0047a3] px-3.5 py-1.5 rounded-[8px] shadow-sm hover:shadow transition-all active:scale-95"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Logout confirmation modal ──────────────────────────────────────── */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-dropdown">
          <div className="bg-white rounded-[16px] p-6 shadow-2xl w-full max-w-[400px] flex flex-col gap-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-full">
                <LogOut className="size-6" />
              </div>
              <h3 className="text-[#0f172a] text-[18px] font-bold">
                Xác nhận đăng xuất
              </h3>
            </div>
            <p className="text-[#475569] text-[14px] leading-relaxed">
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
            </p>
            <div className="flex justify-end gap-3 mt-2 border-t pt-4">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 rounded-[8px] text-[#475569] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] transition-all text-[14px] font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                id="confirm-logout-btn"
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
