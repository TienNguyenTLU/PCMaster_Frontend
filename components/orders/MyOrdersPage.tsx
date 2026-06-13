"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Calendar,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  FileText,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";
import {
  orderAPI,
  OrderResponse,
  OrderStatus,
  adminAPI,
  Product,
} from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import toast from "react-hot-toast";

export default function MyOrdersPage() {
  const { user, isHydrated } = useAuthStore();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus | "ALL">("ALL");

  // Track expanded cards for order item lists
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>(
    {},
  );

  // Track loaded products details to show thumbnails/names correctly
  const [productsCache, setProductsCache] = useState<Record<number, Product>>(
    {},
  );

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await orderAPI.list();
      setOrders(data || []);

      // Auto expand first order if exists
      if (data && data.length > 0) {
        setExpandedOrders({ [data[0].id]: true });
      }

      // Load products in the orders to display details (names, thumbnails)
      const uniqueProdIds = Array.from(
        new Set(
          data
            .flatMap((o) => o.items || [])
            .map((item) => item.productId)
            .filter((id): id is number => id !== null),
        ),
      );

      // Populate cache in background
      for (const prodId of uniqueProdIds) {
        try {
          const prod = await adminAPI.getProductById(prodId);
          setProductsCache((prev) => ({ ...prev, [prodId]: prod }));
        } catch (err) {
          console.error(`Error loading cached product ${prodId}`, err);
        }
      }
    } catch {
      toast.error("Lỗi khi tải danh sách đơn hàng.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isHydrated && user) {
      fetchOrders();
    } else if (isHydrated && !user) {
      setLoading(false);
    }
  }, [isHydrated, user, fetchOrders]);

  const toggleExpand = (orderId: number) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const filteredOrders = orders.filter(
    (o) => activeTab === "ALL" || o.status === activeTab,
  );

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="px-3 py-1 text-[11px] font-black rounded-full bg-amber-50 text-amber-600 border border-amber-100">
            Chờ duyệt
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="px-3 py-1 text-[11px] font-black rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            Đã duyệt
          </span>
        );
      case "SHIPPED":
        return (
          <span className="px-3 py-1 text-[11px] font-black rounded-full bg-purple-50 text-purple-600 border border-purple-100">
            Đang giao
          </span>
        );
      case "DELIVERED":
        return (
          <span className="px-3 py-1 text-[11px] font-black rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold">
            Đã giao
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-3 py-1 text-[11px] font-black rounded-full bg-red-50 text-red-600 border border-red-100">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-[11px] font-black rounded-full bg-slate-50 text-slate-600 border border-slate-100">
            {status}
          </span>
        );
    }
  };

  const getProductThumbnail = (productId: number) => {
    const cached = productsCache[productId];
    if (!cached) return null;
    if (cached.thumbnailUrl?.startsWith("http")) return cached.thumbnailUrl;
    return cached.thumbnailUrl
      ? `http://localhost:8080${cached.thumbnailUrl}`
      : null;
  };

  const getProductName = (productId: number) => {
    const cached = productsCache[productId];
    return cached ? cached.name : `Sản phẩm #${productId}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center gap-3 text-[#0058be] bg-[#f8fafc]">
        <div className="size-8 border-3 border-current/30 border-t-current rounded-full animate-spin" />
        <span className="text-[13px] text-slate-500 font-semibold">
          Đang tải lịch sử mua hàng...
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-h-screen w-full"
      style={{
        background: "linear-gradient(180deg, #f7f9fb 0%, #f0f4f8 100%)",
      }}
    >
      {/* Header section */}
      <div className="w-full bg-white border-b border-[#e8ecf2] py-8 shadow-sm">
        <div className="max-w-[1000px] mx-auto px-6">
          <p className="text-[11px] font-bold text-[#0058be] uppercase tracking-[1.5px] mb-1">
            Khách hàng dashboard
          </p>
          <h1
            className="text-[30px] font-black text-[#0f172a] tracking-tight leading-none flex items-center gap-2"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <ClipboardList className="size-8 text-[#0058be]" /> Đơn Hàng Của Tôi
          </h1>
          <p className="text-[#64748b] text-[13px] mt-2 font-medium">
            Theo dõi tiến trình vận chuyển, kiểm tra chi tiết hóa đơn và lịch sử
            giao dịch mua sắm tại PCMaster.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[1000px] mx-auto w-full px-6 py-8 flex flex-col gap-6 flex-1">
        {/* Verification Check of Auth */}
        {!user ? (
          <div className="bg-white rounded-[24px] border border-[#e8ecf2] p-16 text-center flex flex-col items-center gap-4 shadow-sm my-8">
            <div className="p-4 bg-blue-50 text-[#0058be] rounded-full">
              <ClipboardList className="size-12" />
            </div>
            <div>
              <h4 className="text-[#0f172a] font-bold text-[16px]">
                Vui lòng đăng nhập tài khoản
              </h4>
              <p className="text-[#64748b] text-[13px] mt-1">
                Đăng nhập tài khoản khách hàng để xem lịch sử mua sắm và theo
                dõi trạng thái đơn vận.
              </p>
            </div>
            <Link
              href="/auth/login"
              className="bg-[#0058be] text-white px-6 py-2.5 rounded-[12px] text-[13px] font-bold hover:bg-[#0047a3] shadow-md shadow-blue-100 transition-all active:scale-[0.98]"
            >
              Đăng nhập ngay
            </Link>
          </div>
        ) : (
          <>
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center bg-white p-1.5 rounded-[14px] border border-[#e8ecf2] shadow-sm gap-1 overflow-x-auto">
              {(
                [
                  "ALL",
                  "DRAFT",
                  "CONFIRMED",
                  "SHIPPED",
                  "DELIVERED",
                  "CANCELLED",
                ] as const
              ).map((tab) => {
                const label =
                  tab === "ALL"
                    ? "Tất cả"
                    : tab === "DRAFT"
                      ? "Chờ duyệt"
                      : tab === "CONFIRMED"
                        ? "Đã duyệt"
                        : tab === "SHIPPED"
                          ? "Đang giao"
                          : tab === "DELIVERED"
                            ? "Đã giao"
                            : "Đã hủy";
                const count =
                  tab === "ALL"
                    ? orders.length
                    : orders.filter((o) => o.status === tab).length;
                const isSelected = activeTab === tab;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-[10px] text-[12px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? "bg-[#0058be] text-white shadow-md shadow-blue-100"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Orders list */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-[24px] border border-[#e8ecf2] p-16 text-center flex flex-col items-center gap-4 shadow-sm my-4">
                <span className="text-[48px]">📦</span>
                <div>
                  <h4 className="text-[#0f172a] font-bold text-[16px]">
                    Chưa có đơn hàng nào ở trạng thái này
                  </h4>
                  <p className="text-[#64748b] text-[13px] mt-1">
                    Đơn hàng của bạn sẽ xuất hiện tại đây sau khi tiến hành
                    thanh toán giỏ hàng.
                  </p>
                </div>
                <Link
                  href="/explore"
                  className="bg-white border border-[#e8ecf2] px-6 py-2.5 rounded-[12px] text-[12px] font-bold text-[#0058be] hover:bg-slate-50 shadow-sm"
                >
                  Khám phá linh kiện ngay
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredOrders.map((order) => {
                  const isExpanded = !!expandedOrders[order.id];
                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-[20px] border border-[#e8ecf2] shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                    >
                      {/* Order Header Summary */}
                      <div
                        onClick={() => toggleExpand(order.id)}
                        className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-blue-50 text-[#0058be] rounded-[12px]">
                            <ShoppingBag className="size-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-black text-[#0f172a]">
                                Mã Đơn: #{order.id}
                              </span>
                              {getStatusBadge(order.status)}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[11px] font-semibold text-[#94a3b8]">
                              <span className="flex items-center gap-1">
                                <Calendar className="size-3.5" />
                                {new Date(order.createdAt).toLocaleDateString(
                                  "vi-VN",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                              <span>•</span>
                              <span className="text-[#0058be]">
                                {order.items?.length || 0} sản phẩm
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-5">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.5px]">
                              Tổng thanh toán
                            </p>
                            <p
                              className="text-[17px] font-black text-[#0058be]"
                              style={{ fontFamily: "Inter, sans-serif" }}
                            >
                              {order.totalAmount.toLocaleString("vi-VN")}
                              <span className="text-[12px] font-bold ml-0.5">
                                ₫
                              </span>
                            </p>
                          </div>
                          <div className="p-1 text-slate-400 hover:text-slate-700">
                            {isExpanded ? (
                              <ChevronUp className="size-5" />
                            ) : (
                              <ChevronDown className="size-5" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Collapsible Order details */}
                      {isExpanded && (
                        <div className="border-t border-[#f1f5f9] bg-[#fdfefe]/40 p-5 flex flex-col gap-5 animate-dropdown origin-top">
                          {/* Recipient and shipping address */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#f8fafc]/80 border border-slate-100 rounded-[14px] p-4 text-[12px] font-medium text-[#475569]">
                            <div className="flex flex-col gap-2">
                              <p className="text-[11px] font-bold text-[#0058be] uppercase tracking-[0.5px] mb-1">
                                Thông tin nhận hàng
                              </p>
                              <div className="flex items-center gap-2">
                                <User className="size-4 text-[#94a3b8]" />
                                <span>
                                  Tên người nhận:{" "}
                                  <strong className="text-slate-800">
                                    {order.recipientName || "Chưa cung cấp"}
                                  </strong>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="size-4 text-[#94a3b8]" />
                                <span>
                                  Điện thoại:{" "}
                                  <strong className="text-slate-800">
                                    {order.recipientPhone || "Chưa cung cấp"}
                                  </strong>
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5">
                              <p className="text-[11px] font-bold text-[#0058be] uppercase tracking-[0.5px] mb-1">
                                Phương thức nhận hàng
                              </p>
                              <div className="flex items-center gap-2">
                                <MapPin className="size-4 text-[#94a3b8]" />
                                <span>
                                  Địa chỉ giao:{" "}
                                  <span className="text-slate-800 font-semibold">
                                    {order.shippingAddress ||
                                      "Nhận tại cửa hàng (Showroom)"}
                                  </span>
                                </span>
                              </div>
                              <div className="mt-1">
                                <span className="bg-blue-50 text-[#0058be] px-2 py-0.5 rounded text-[10px] font-bold">
                                  {order.deliveryType === "HOME_DELIVERY"
                                    ? "Giao hàng tận nơi"
                                    : "Nhận tại Showroom"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Order Items Table */}
                          <div className="flex flex-col gap-3">
                            <p className="text-[11px] font-bold text-[#475569] uppercase tracking-[0.5px]">
                              Chi tiết sản phẩm đã mua:
                            </p>
                            <div className="flex flex-col border border-slate-100 rounded-[14px] bg-white overflow-hidden divide-y divide-[#f1f5f9]">
                              {order.items?.map((item) => {
                                const prodId = item.productId || 0;
                                const imgUrl = getProductThumbnail(prodId);
                                const name = getProductName(prodId);

                                return (
                                  <div
                                    key={item.id}
                                    className="p-4 flex items-center justify-between gap-4"
                                  >
                                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                      <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-[8px] flex items-center justify-center p-1 shrink-0">
                                        {imgUrl ? (
                                          <img
                                            src={imgUrl}
                                            alt={name}
                                            className="w-full h-full object-contain"
                                          />
                                        ) : (
                                          <Package className="size-5 text-slate-300" />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[12px] font-bold text-[#0f172a] hover:text-[#0058be] truncate">
                                          <Link href={`/explore/${prodId}`}>
                                            {name}
                                          </Link>
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                          Số lượng: x{item.quantity}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <p className="text-[12px] font-extrabold text-[#0f172a]">
                                        {item.sellingPrice.toLocaleString(
                                          "vi-VN",
                                        )}{" "}
                                        ₫
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                        Tổng:{" "}
                                        {(
                                          item.sellingPrice * item.quantity
                                        ).toLocaleString("vi-VN")}{" "}
                                        ₫
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Cloudinary Document Receipt Link */}
                          {order.documentUrl && (
                            <div className="flex justify-end pt-2 border-t border-slate-100">
                              <a
                                href={order.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 bg-blue-50 text-[#0058be] border border-blue-100 hover:bg-[#0058be] hover:text-white px-4 py-2.5 rounded-[12px] text-[12px] font-bold transition-all shadow-sm"
                              >
                                <FileText className="size-4" />
                                Tải phiếu xuất kho (Excel)
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
