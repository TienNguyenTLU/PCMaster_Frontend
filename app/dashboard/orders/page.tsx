'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, RefreshCw, Search, Eye, FileText, ChevronDown, ShoppingBag, Home, Store
} from 'lucide-react';
import { orderAPI, OrderResponse, OrderStatus, DeliveryType } from '@/lib/api';
import toast from 'react-hot-toast';

// Subcomponents
import StatusBadge from '@/components/dashboard/orders/StatusBadge';
import OrderDetailModal from '@/components/dashboard/orders/OrderDetailModal';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const DELIVERY_META: Record<DeliveryType, { label: string; Icon: React.ElementType }> = {
  HOME_DELIVERY:    { label: 'Giao tận nhà', Icon: Home },
  SHOWROOM_PICKUP:  { label: 'Tại showroom', Icon: Store },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orderAPI.adminListAll();
      setOrders(data || []);
    } catch {
      toast.error('Không thể tải danh sách đơn hàng');
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

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === 'ALL' || o.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !search
      || String(o.id).includes(q)
      || (o.username ?? '').toLowerCase().includes(q)
      || (o.email ?? '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // Stats
  const stats = [
    { label: 'Tổng đơn',    value: orders.length,                                      color: 'text-[#0058be]' },
    { label: 'Chờ duyệt',   value: orders.filter(o => o.status === 'DRAFT').length,    color: 'text-amber-500' },
    { label: 'Đã duyệt',    value: orders.filter(o => o.status === 'CONFIRMED').length, color: 'text-blue-500' },
    { label: 'Đang giao',   value: orders.filter(o => o.status === 'SHIPPED').length,  color: 'text-violet-500' },
    { label: 'Đã giao',     value: orders.filter(o => o.status === 'DELIVERED').length,color: 'text-emerald-500' },
  ];

  return (
    <div className="flex flex-col gap-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0f172a] text-[24px] font-semibold tracking-[-0.5px]">Quản lý đơn hàng</h2>
          <p className="text-[#64748b] text-[14px] mt-1">Duyệt đơn, theo dõi giao hàng và xuất phiếu kho.</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#cbd5e1] hover:border-[#94a3b8] rounded-[8px] text-[14px] font-medium text-[#475569] hover:text-[#0f172a] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-[#e2e8f0] rounded-[8px] p-4 shadow-sm">
            <p className="text-[#64748b] text-[12px] font-medium">{s.label}</p>
            <p className={`text-[24px] font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-4 rounded-[12px] border border-[#e2e8f0] shadow-sm">
        <div className="relative w-full md:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo ID, tên, email..."
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-9 pr-4 py-1.5 text-[14px] focus:outline-none focus:border-[#0058be] transition-all"
          />
        </div>

        {/* Status filter */}
        <div className="relative w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as OrderStatus | 'ALL')}
            className="appearance-none w-full md:w-auto bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-3 pr-8 py-1.5 text-[14px] font-medium text-[#475569] focus:outline-none focus:border-[#0058be] transition-all cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DRAFT">Chờ duyệt</option>
            <option value="CONFIRMED">Đã duyệt</option>
            <option value="SHIPPED">Đang giao</option>
            <option value="DELIVERED">Đã giao</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#94a3b8] pointer-events-none" />
        </div>

        <p className="text-[12px] text-[#94a3b8] md:ml-auto font-medium">
          {filtered.length} / {orders.length} đơn hàng
        </p>
      </div>

      {/* Table */}
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
                  <th className="px-5 py-4 font-medium">Ngày tạo</th>
                  <th className="px-5 py-4 font-medium text-right">Tổng tiền</th>
                  <th className="px-5 py-4 font-medium text-center">Trạng thái</th>
                  <th className="px-5 py-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] text-[#475569]">
                {filtered.map(order => {
                  const delivery = DELIVERY_META[order.deliveryType];
                  return (
                    <tr key={order.id} className="hover:bg-[#f8fafc]/50 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-[#0f172a]">
                        #{String(order.id).padStart(5, '0')}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#0f172a]">{order.username ?? `User #${order.userId}`}</p>
                        <p className="text-[11px] text-[#94a3b8] mt-0.5">{order.email ?? '—'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5 text-[13px] text-[#475569] font-medium">
                          <delivery.Icon className="size-3.5 text-[#64748b]" />
                          {delivery.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[#64748b] text-[13px]">{formatDate(order.createdAt)}</td>
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

      {/* Detail Modal */}
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
