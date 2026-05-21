'use client';

import { useState } from 'react';
import {
  CheckCircle2, ExternalLink, FileText, Home, Loader2, MapPin, Phone,
  Store, User as UserIcon, X, XCircle, ClipboardList
} from 'lucide-react';
import { orderAPI, adminAPI, OrderResponse, OrderStatus, DeliveryType } from '@/lib/api';
import toast from 'react-hot-toast';
import StatusBadge from './StatusBadge';

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

interface OrderDetailModalProps {
  order: OrderResponse;
  onClose: () => void;
  onRefresh: () => void;
}

export default function OrderDetailModal({ order, onClose, onRefresh }: OrderDetailModalProps) {
  const [confirming, setConfirming] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [creatingSlip, setCreatingSlip] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await orderAPI.adminConfirm(order.id);
      toast.success(`Đã duyệt đơn hàng #${order.id} thành công!`);
      onRefresh();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Duyệt đơn thất bại');
    } finally {
      setConfirming(false);
    }
  };

  const handleStatusUpdate = async (status: OrderStatus) => {
    setUpdating(true);
    try {
      await orderAPI.adminUpdateStatus(order.id, status);
      toast.success('Đã cập nhật trạng thái đơn hàng');
      onRefresh();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Cập nhật thất bại');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateIssueSlip = async () => {
    setCreatingSlip(true);
    try {
      await adminAPI.createIssueSlip(order.id);
      toast.success(`Tạo phiếu xuất kho thành công cho đơn hàng #${order.id}!`);
      onRefresh();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Tạo phiếu xuất kho thất bại');
    } finally {
      setCreatingSlip(false);
    }
  };

  const delivery = DELIVERY_META[order.deliveryType];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-[12px] shadow-xl w-full max-w-[680px] max-h-[90vh] flex flex-col overflow-hidden border border-[#e2e8f0]" style={{ fontFamily: 'Inter, sans-serif' }}>
        
        {/* Modal Header */}
        <div className="border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between bg-[#f8fafc]">
          <div>
            <h2 className="text-[#0f172a] text-[18px] font-semibold tracking-[-0.3px]">
              Đơn hàng: #{String(order.id).padStart(5, '0')}
            </h2>
            <p className="text-[12px] text-[#64748b] mt-0.5">Chi tiết các mặt hàng và giao dịch</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <button
              onClick={onClose}
              className="text-[#94a3b8] hover:text-[#475569] p-1.5 hover:bg-[#f1f5f9] rounded-[8px] transition-colors cursor-pointer"
            >
              <X className="size-4.5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 text-[13px]">
          {/* Customer info */}
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <UserIcon className="size-4 text-[#0058be] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.5px]">Khách hàng</p>
                <p className="font-semibold text-[#0f172a] mt-0.5">{order.username ?? `User #${order.userId}`}</p>
                <p className="text-[11.5px] text-[#64748b] mt-0.5">{order.email ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <delivery.Icon className="size-4 text-[#0058be] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.5px]">Giao hàng</p>
                <p className="font-semibold text-[#0f172a] mt-0.5">{delivery.label}</p>
              </div>
            </div>
            {order.deliveryType === 'HOME_DELIVERY' && (
              <>
                <div className="flex items-start gap-2 border-t border-[#e2e8f0] pt-3">
                  <UserIcon className="size-3.5 text-[#64748b] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-[#64748b]">Người nhận</p>
                    <p className="text-[#475569] font-medium mt-0.5">{order.recipientName ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 border-t border-[#e2e8f0] pt-3">
                  <Phone className="size-3.5 text-[#64748b] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-[#64748b]">Điện thoại</p>
                    <p className="text-[#475569] font-medium mt-0.5">{order.recipientPhone ?? '—'}</p>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 flex items-start gap-2 border-t border-[#e2e8f0] pt-3">
                  <MapPin className="size-3.5 text-[#64748b] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-[#64748b]">Địa chỉ giao hàng</p>
                    <p className="text-[#475569] font-medium mt-0.5">{order.shippingAddress ?? '—'}</p>
                  </div>
                </div>
              </>
            )}
            <div className="col-span-1 md:col-span-2 flex items-center gap-1.5 border-t border-[#e2e8f0] pt-3 text-[11px] text-[#64748b]">
              <ClipboardList className="size-3.5" />
              Tạo lúc: {formatDate(order.createdAt)}
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.8px] mb-3">Danh sách sản phẩm</p>
            <div className="flex flex-col gap-2">
              {order.items.map((item, i) => (
                <div key={item.id} className="flex items-center justify-between bg-white border border-[#e2e8f0] rounded-[8px] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="size-6 flex items-center justify-center bg-[#f1f5f9] rounded-full text-[11px] font-bold text-[#475569] shrink-0">{i + 1}</span>
                    <div>
                      <p className="font-semibold text-[#0f172a]">Sản phẩm #{item.productId}</p>
                      <p className="text-[11px] text-[#64748b] mt-0.5">SL: {item.quantity} × {formatPrice(Number(item.sellingPrice))}</p>
                    </div>
                  </div>
                  <p className="font-bold text-[#0058be]">
                    {formatPrice(Number(item.sellingPrice) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between bg-[#eff6ff] border border-[#eff6ff] rounded-[8px] px-5 py-3">
            <span className="font-semibold text-[#0058be]">Tổng cộng thanh toán</span>
            <span className="text-[20px] font-bold text-[#0058be]">{formatPrice(Number(order.totalAmount))}</span>
          </div>

          {/* Document link */}
          {order.documentUrl && (
            <a
              href={order.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 bg-white border border-[#e2e8f0] rounded-[8px] text-[13px] font-semibold text-[#0058be] hover:border-[#0058be] hover:bg-[#eff6ff] transition-all"
            >
              <FileText className="size-4" />
              Tải phiếu xuất kho (DOCX)
              <ExternalLink className="size-3.5 ml-auto" />
            </a>
          )}
        </div>

        {/* Action footer */}
        <div className="bg-[#f8fafc] border-t border-[#e2e8f0] px-6 py-4 flex items-center gap-3 flex-wrap">
          {order.status === 'DRAFT' && (
            <button
              type="button"
              disabled={confirming}
              onClick={handleConfirm}
              className="flex items-center gap-2 px-4 py-2 bg-[#0058be] hover:bg-[#0047a3] text-white text-[13px] font-semibold rounded-[8px] shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {confirming ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Duyệt đơn hàng
            </button>
          )}
          {order.status === 'CONFIRMED' && (
            <button
              type="button"
              disabled={creatingSlip}
              onClick={handleCreateIssueSlip}
              className="flex items-center gap-2 px-4 py-2 bg-[#0058be] hover:bg-[#0047a3] text-white text-[13px] font-semibold rounded-[8px] shadow-sm transition-colors cursor-pointer disabled:opacity-50 animate-pulse"
            >
              {creatingSlip ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
              Tạo phiếu xuất kho
            </button>
          )}
          {(order.status === 'DRAFT' || order.status === 'CONFIRMED') && (
            <button
              type="button"
              disabled={updating || confirming}
              onClick={() => handleStatusUpdate('CANCELLED')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 text-[13px] font-semibold rounded-[8px] hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 ml-auto"
            >
              <XCircle className="size-4" />
              Hủy đơn
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
