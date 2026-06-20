"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  RefreshCw,
  Search,
  Eye,
  FileText,
  ChevronDown,
  ShoppingBag,
  Home,
  Store,
  ClipboardList,
  CheckCircle2,
  Truck,
  Package2,
  XCircle,
  CreditCard,
} from "lucide-react";
import { orderAPI, OrderResponse, OrderStatus, DeliveryType, PaymentStatus } from "@/lib/api";
import toast from "react-hot-toast";

import StatusBadge from "@/components/dashboard/orders/StatusBadge";
import OrderDetailModal from "@/components/dashboard/orders/OrderDetailModal";
import { PAYMENT_STATUS_META, PAYMENT_METHOD_META } from "@/lib/labelMapping";

function formatPrice(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const DELIVERY_META: Record<
  DeliveryType,
  { label: string; Icon: React.ElementType }
> = {
  HOME_DELIVERY: { label: "Giao tận nhà", Icon: Home },
  SHOWROOM_PICKUP: { label: "Tại showroom", Icon: Store },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "ALL">("ALL");
  const [filterPayment, setFilterPayment] = useState<PaymentStatus | "ALL">("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(
    null,
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orderAPI.adminListAll();
      setOrders(data || []);
    } catch {
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === "ALL" || o.status === filterStatus;
    const matchPayment = filterPayment === "ALL" || o.paymentStatus === filterPayment;
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      String(o.id).includes(q) ||
      (o.username ?? "").toLowerCase().includes(q) ||
      (o.email ?? "").toLowerCase().includes(q);
    return matchStatus && matchPayment && matchSearch;
  });

  const stats = [
    {
      label: "Tổng đơn hàng",
      value: orders.length,
      color: "text-[#0058be]",
      bg: "bg-blue-50/80 border border-blue-100",
      Icon: ShoppingBag,
    },
    {
      label: "Chờ duyệt",
      value: orders.filter((o) => o.status === "DRAFT").length,
      color: "text-amber-600",
      bg: "bg-amber-50/80 border border-amber-100",
      Icon: ClipboardList,
    },
    {
      label: "Đã duyệt",
      value: orders.filter((o) => o.status === "CONFIRMED").length,
      color: "text-blue-600",
      bg: "bg-blue-50/80 border border-blue-100",
      Icon: CheckCircle2,
    },
    {
      label: "Đang giao",
      value: orders.filter((o) => o.status === "SHIPPED").length,
      color: "text-violet-600",
      bg: "bg-violet-50/80 border border-violet-100",
      Icon: Truck,
    },
    {
      label: "Đã giao",
      value: orders.filter((o) => o.status === "DELIVERED").length,
      color: "text-emerald-600",
      bg: "bg-emerald-50/80 border border-emerald-100",
      Icon: Package2,
    },
  ];

  return (
    <div
      className="flex flex-col gap-6"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0f172a] text-[24px] font-semibold tracking-[-0.5px]">
            Đơn bán hàng
          </h2>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#cbd5e1] hover:border-[#94a3b8] rounded-[8px] text-[14px] font-medium text-[#475569] hover:text-[#0f172a] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s) => {
          const Icon = s.Icon;
          return (
            <div
              key={s.label}
              className={`bg-white rounded-[12px] p-4 shadow-sm transition-all duration-200 flex items-center justify-between ${s.bg}`}
            >
              <div>
                <p className="text-[#64748b] text-[12.5px] font-medium">{s.label}</p>
                <p className={`text-[26px] font-black mt-1 ${s.color}`}>{s.value}</p>
              </div>
              <div className="p-2 bg-white rounded-[8px] border border-inherit shadow-sm">
                <Icon className={`size-5 ${s.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-4 rounded-[12px] border border-[#e2e8f0] shadow-sm">
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo ID, tên, email..."
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-9 pr-4 py-1.5 text-[14px] focus:outline-none focus:border-[#0058be] transition-all"
          />
        </div>

        {/* Order Status Filter */}
        <div className="relative w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as OrderStatus | "ALL")
            }
            className="appearance-none w-full md:w-auto bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-3 pr-8 py-1.5 text-[14px] font-medium text-[#475569] focus:outline-none focus:border-[#0058be] transition-all cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái đơn</option>
            <option value="DRAFT">Chờ duyệt</option>
            <option value="CONFIRMED">Đã duyệt</option>
            <option value="SHIPPED">Đang giao</option>
            <option value="DELIVERED">Đã giao</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#94a3b8] pointer-events-none" />
        </div>

        {/* Payment Status Filter */}
        <div className="relative w-full md:w-auto">
          <select
            value={filterPayment}
            onChange={(e) =>
              setFilterPayment(e.target.value as PaymentStatus | "ALL")
            }
            className="appearance-none w-full md:w-auto bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-3 pr-8 py-1.5 text-[14px] font-medium text-[#475569] focus:outline-none focus:border-[#0058be] transition-all cursor-pointer"
          >
            <option value="ALL">Tất cả thanh toán</option>
            <option value="PENDING">Chờ thanh toán</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="FAILED">Thanh toán lỗi</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#94a3b8] pointer-events-none" />
        </div>

        <p className="text-[12px] text-[#94a3b8] md:ml-auto font-medium">
          {filtered.length} / {orders.length} đơn hàng
        </p>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-[12px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-[300px] gap-2 text-[#64748b]">
              <Loader2 className="size-5 animate-spin" /> Đang tải dữ liệu...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-[#94a3b8] gap-3">
              <ShoppingBag className="size-10 opacity-30" />
              <p className="text-[14px] font-medium">Không có đơn hàng nào</p>
            </div>
          ) : (
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-medium">
                <tr>
                  <th className="px-5 py-4 font-medium">Mã đơn</th>
                  <th className="px-5 py-4 font-medium">Khách hàng</th>
                  <th className="px-5 py-4 font-medium">Giao hàng</th>
                  <th className="px-5 py-4 font-medium text-center">Thanh toán</th>
                  <th className="px-5 py-4 font-medium">Ngày tạo</th>
                  <th className="px-5 py-4 font-medium text-right">
                    Tổng tiền
                  </th>
                  <th className="px-5 py-4 font-medium text-center">
                    Trạng thái
                  </th>
                  <th className="px-5 py-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] text-[#475569]">
                {filtered.map((order) => {
                  const delivery = DELIVERY_META[order.deliveryType];
                  const paymentMethodMeta = order.paymentMethod ? PAYMENT_METHOD_META[order.paymentMethod] : null;
                  const paymentStatusMeta = order.paymentStatus ? PAYMENT_STATUS_META[order.paymentStatus] : null;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-[#f8fafc]/50 transition-colors"
                    >
                      <td className="px-5 py-4 font-mono font-bold text-[#0f172a]">
                        #{String(order.id).padStart(5, "0")}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#0f172a]">
                          {order.username ?? `User #${order.userId}`}
                        </p>
                        <p className="text-[11px] text-[#94a3b8] mt-0.5">
                          {order.email ?? "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5 text-[13px] text-[#475569] font-medium">
                          <delivery.Icon className="size-3.5 text-[#64748b]" />
                          {delivery.label}
                        </span>
                      </td>
                      {/* Payment column */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {paymentMethodMeta && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${paymentMethodMeta.bg} ${paymentMethodMeta.color}`}>
                              {paymentMethodMeta.label}
                            </span>
                          )}
                          {paymentStatusMeta && (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${paymentStatusMeta.bg} ${paymentStatusMeta.color}`}>
                              <paymentStatusMeta.Icon className="size-2.5" />
                              {paymentStatusMeta.label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#64748b] text-[13px]">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-[#0f172a]">
                        {formatPrice(Number(order.totalAmount))}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 hover:text-[#0058be] hover:bg-[#f1f5f9] rounded-[8px] transition-colors text-[#64748b] cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye className="size-4.5" />
                          </button>
                          {order.documentUrl && (
                            <a
                              href={order.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:text-emerald-600 hover:bg-[#f1f5f9] rounded-[8px] transition-colors text-[#64748b]"
                              title="Tải phiếu xuất kho"
                            >
                              <FileText className="size-4.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefresh={fetchOrders}
        />
      )}
    </div>
  );
}
