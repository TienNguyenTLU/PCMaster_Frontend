'use client';

import { CheckCircle2, Clock, ExternalLink, Home, Layers, Loader2, MapPin, Store, Truck, User, X } from 'lucide-react';
import { IssueSlipResponse } from '@/lib/api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface IssueSlipDetailModalProps {
  slip: IssueSlipResponse;
  onClose: () => void;
  onDispatch: (slipId: number) => Promise<void>;
  dispatching: boolean;
}

export default function IssueSlipDetailModal({ slip, onClose, onDispatch, dispatching }: IssueSlipDetailModalProps) {
  const isPending = slip.status === 'PENDING';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-[12px] shadow-xl w-full max-w-[650px] max-h-[90vh] flex flex-col overflow-hidden border border-[#e2e8f0]" style={{ fontFamily: 'Inter, sans-serif' }}>
        
        {/* Modal Header */}
        <div className="border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between bg-[#f8fafc]">
          <div>
            <h2 className="text-[#0f172a] text-[18px] font-semibold tracking-[-0.3px]">
              Mã phiếu: {slip.code}
            </h2>
            <p className="text-[12px] text-[#64748b] mt-0.5">Chi tiết yêu cầu phiếu xuất kho bán lẻ</p>
          </div>
          <div className="flex items-center gap-3">
            {isPending ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="size-3" /> Chờ xuất kho
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="size-3" /> Hoàn thành
              </span>
            )}
            <button
              onClick={onClose}
              className="text-[#94a3b8] hover:text-[#475569] p-1.5 hover:bg-[#f1f5f9] rounded-[8px] transition-colors cursor-pointer"
            >
              <X className="size-4.5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Slip Metadata Card */}
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
            <div className="flex items-start gap-2.5">
              <User className="size-4 text-[#0058be] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.5px]">Người nhận hàng</p>
                <p className="font-semibold text-[#0f172a] mt-0.5">{slip.recipientName ?? '—'}</p>
                <p className="text-[11.5px] text-[#64748b] mt-0.5">{slip.recipientPhone ?? '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              {slip.deliveryType === 'HOME_DELIVERY' ? (
                <Home className="size-4 text-[#0058be] shrink-0 mt-0.5" />
              ) : (
                <Store className="size-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.5px]">Hình thức nhận</p>
                <p className="font-semibold text-[#0f172a] mt-0.5">
                  {slip.deliveryType === 'HOME_DELIVERY' ? 'Giao hàng tận nơi' : 'Nhận tại cửa hàng'}
                </p>
              </div>
            </div>

            {slip.deliveryType === 'HOME_DELIVERY' && slip.shippingAddress && (
              <div className="col-span-1 md:col-span-2 flex items-start gap-2.5 border-t border-[#e2e8f0] pt-3">
                <MapPin className="size-4 text-[#94a3b8] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.5px]">Địa chỉ giao hàng</p>
                  <p className="text-[#475569] font-medium leading-relaxed mt-0.5">{slip.shippingAddress}</p>
                </div>
              </div>
            )}

            <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5 border-t border-[#e2e8f0] pt-3 text-[12px] text-[#64748b]">
              <div className="flex justify-between">
                <span>Mã đơn hàng liên kết:</span>
                <span className="font-semibold text-[#334155]">#{slip.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>Ngày lập phiếu xuất:</span>
                <span className="font-semibold text-[#334155]">{formatDate(slip.createdAt)}</span>
              </div>
              {slip.completedAt && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Thời điểm xuất thực tế:</span>
                  <span>{formatDate(slip.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items List */}
          <div>
            <h3 className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.8px] mb-2.5 flex items-center gap-1.5">
              <Layers className="size-3.5 text-[#0058be]" />
              Danh mục hàng xuất kho
            </h3>
            <div className="border border-[#e2e8f0] rounded-[8px] overflow-hidden divide-y divide-[#e2e8f0]">
              {slip.items.map((item, index) => (
                <div key={item.id} className="bg-white hover:bg-[#f8fafc]/50 px-4 py-3 flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-3">
                    <span className="size-5.5 bg-[#f1f5f9] text-[#475569] text-[11px] font-semibold flex items-center justify-center rounded-full shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-[#0f172a]">{item.productName}</p>
                      <p className="text-[11px] text-[#94a3b8] mt-0.5">Mã SP: #{item.productId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#94a3b8] font-bold block">Số lượng</span>
                    <span className="text-[14px] font-bold text-[#0f172a]">
                      {item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-[#f8fafc] border-t border-[#e2e8f0] px-6 py-4 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#e2e8f0] hover:border-[#cbd5e1] rounded-[8px] text-[13px] font-medium text-[#475569] hover:bg-white transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            {isPending ? (
              <button
                onClick={() => onDispatch(slip.id)}
                disabled={dispatching}
                className="px-5 py-2 bg-[#0058be] hover:bg-[#0047a3] text-white text-[13px] font-semibold rounded-[8px] shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {dispatching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Truck className="size-4" />
                )}
                Xác nhận xuất kho hàng (FIFO)
              </button>
            ) : slip.documentUrl ? (
              <a
                href={slip.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-white text-[13px] font-semibold rounded-[8px] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="size-4" />
                Tải phiếu xuất kho (.docx)
              </a>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  );
}
