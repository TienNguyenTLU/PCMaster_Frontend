"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  User,
  ShoppingCart,
  ArrowDownCircle,
  ArrowUpCircle,
  BellOff,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DASHBOARD_TITLE_MAP } from "@/lib/labelMapping";
import { orderAPI, adminAPI } from "@/lib/api";

interface DashboardNotification {
  id: string;
  type: "ORDER" | "PURCHASE_ORDER" | "ISSUE_SLIP";
  title: string;
  description: string;
  createdAt: string;
  link: string;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);
}

function formatTimeAgo(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const pathSegments = pathname
    .split("/")
    .filter((p) => p && p !== "dashboard");
  const rawTitle = pathSegments.length > 0 ? pathSegments[0] : "overview";
  const title = DASHBOARD_TITLE_MAP[rawTitle.toLowerCase()] || rawTitle;

  const fetchNotifications = useCallback(async () => {
    try {
      const [ordersData, poData, slipsPage] = await Promise.all([
        orderAPI.adminListAll().catch(() => [] as any[]),
        adminAPI.getPurchaseOrders().catch(() => [] as any[]),
        adminAPI.getIssueSlips(0, 100).catch(() => ({ content: [] } as any)),
      ]);

      const items: DashboardNotification[] = [];

      // 1. Orders needing approval (DRAFT)
      if (Array.isArray(ordersData)) {
        ordersData.forEach((o) => {
          if (o.status === "DRAFT") {
            items.push({
              id: `order-${o.id}`,
              type: "ORDER",
              title: `Đơn hàng mới #${String(o.id).padStart(5, "0")}`,
              description: `Khách hàng: ${o.username || `User #${o.userId}`}, Tổng: ${formatPrice(o.totalAmount)}`,
              createdAt: o.createdAt,
              link: "/dashboard/orders",
            });
          }
        });
      }

      // 2. Purchase Orders needing receive (DRAFT)
      if (Array.isArray(poData)) {
        poData.forEach((po) => {
          if (po.status === "DRAFT") {
            items.push({
              id: `po-${po.id}`,
              type: "PURCHASE_ORDER",
              title: `Phiếu nhập mới #${po.id}`,
              description: `Tổng tiền: ${formatPrice(po.totalAmount)}. Cần nhận hàng nhập kho.`,
              createdAt: po.createdAt,
              link: "/dashboard/inventory",
            });
          }
        });
      }

      // 3. Issue Slips needing dispatch (PENDING)
      const slips = slipsPage?.content || [];
      if (Array.isArray(slips)) {
        slips.forEach((slip) => {
          if (slip.status === "PENDING") {
            items.push({
              id: `slip-${slip.id}`,
              type: "ISSUE_SLIP",
              title: `Phiếu xuất mới #${slip.code || slip.id}`,
              description: `Người nhận: ${slip.recipientName || "—"}. Cần duyệt xuất kho.`,
              createdAt: slip.createdAt,
              link: "/dashboard/inventory",
            });
          }
        });
      }

      // Sort notifications by createdAt descending
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(items);
    } catch (err) {
      console.error("Error fetching admin notifications:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".notification-container")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    router.push("/home");
  };

  return (
    <header className="h-16 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-8 sticky top-0 z-30">
      {/* Title */}
      <div className="flex items-center gap-2">
        <h1
          className="text-[#0f172a] text-[18px] font-semibold tracking-[-0.2px]"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {title}
        </h1>
      </div>

      {/* Action panel */}
      <div className="flex items-center gap-6">


        {/* Notifications Bell */}
        <div className="relative notification-container">
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) fetchNotifications();
            }}
            className="relative p-1.5 text-[#64748b] hover:bg-[#f1f5f9] rounded-full transition-colors cursor-pointer"
          >
            <Bell className="size-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.5 min-w-4 h-4 bg-red-500 text-white rounded-full border border-white text-[9px] font-bold flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#e2e8f0] rounded-[12px] shadow-lg py-1 z-50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
                <span className="font-bold text-slate-800 text-[13px]">
                  Cần duyệt ({notifications.length})
                </span>
                {notifications.length > 0 && (
                  <button
                    onClick={fetchNotifications}
                    className="text-[#0058be] hover:text-[#0047a3] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="size-3" /> Làm mới
                  </button>
                )}
              </div>

              <div className="max-h-[300px] overflow-y-auto divide-y divide-[#e2e8f0]">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-2">
                    <BellOff className="size-8 opacity-40 text-slate-400" />
                    <p className="text-[12px] font-semibold text-slate-500">Không có thông báo cần duyệt</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    let IconComponent = ShoppingCart;
                    let iconBg = "bg-blue-50 text-blue-600 border-blue-100";
                    if (notif.type === "PURCHASE_ORDER") {
                      IconComponent = ArrowDownCircle;
                      iconBg = "bg-amber-50 text-amber-600 border-amber-100";
                    } else if (notif.type === "ISSUE_SLIP") {
                      IconComponent = ArrowUpCircle;
                      iconBg = "bg-purple-50 text-purple-600 border-purple-100";
                    }

                    return (
                      <Link
                        key={notif.id}
                        href={notif.link}
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-3 flex items-start gap-3 hover:bg-[#f8fafc] transition-colors"
                      >
                        <div className={`p-2 rounded-[8px] border shrink-0 ${iconBg}`}>
                          <IconComponent className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-slate-800 truncate">
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.description}
                          </p>
                          <span className="text-[9.5px] text-[#94a3b8] font-medium mt-1.5 block">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account */}
        <div className="flex items-center gap-3 border-l border-[#e2e8f0] pl-6 relative group cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#e2e8f0] flex items-center justify-center text-[#64748b]">
            <User className="size-4" />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-[#0f172a] text-[13px] font-medium leading-tight">
              {user?.username ||
                (user?.role === "STAFF" ? "Nhân viên" : "Admin")}
            </span>
            <span className="text-[#64748b] text-[11px] leading-tight">
              {user?.role === "STAFF" ? "Nhân viên" : "Quản trị viên"}
            </span>
          </div>

          {/* User Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#e2e8f0] rounded-[8px] shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <Link
              href="/home"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 text-[13px] text-[#475569] hover:bg-[#f1f5f9] transition-colors"
            >
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
