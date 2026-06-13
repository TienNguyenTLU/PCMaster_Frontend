'use client';

import { CheckCircle2, ChevronLeft, ChevronRight, Clock, ExternalLink, Eye, FileText, Home, Loader2, Store } from 'lucide-react';
import { IssueSlipResponse } from '@/lib/api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface IssueSlipListProps {
  slips: IssueSlipResponse[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (newPage: number) => void;
  onViewClick: (slip: IssueSlipResponse) => void;
  onDispatchClick: (slipId: number) => Promise<void>;
  dispatchingId: number | null;
  searchQuery: string;
  statusFilter: 'ALL' | 'PENDING' | 'COMPLETED';
}

export default function IssueSlipList({
  slips,
  page,
  size,
  totalPages,
  totalElements,
  onPageChange,
  onViewClick,
  onDispatchClick,
  dispatchingId,
  searchQuery,
  statusFilter,
}: IssueSlipListProps) {
  // Apply filtering locally for search & status
  const filteredSlips = slips.filter(slip => {
    const matchesSearch = slip.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (slip.recipientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (slip.recipientPhone || '').includes(searchQuery) ||
                          String(slip.orderId).includes(searchQuery);
    
    const matchesStatus = statusFilter === 'ALL' ? true : slip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="bg-white border border-[#e2e8f0] rounded-[12px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[300px]">
          {filteredSlips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#64748b] gap-2">
              <FileText className="size-8 text-[#94a3b8]" />
              <p className="text-[14px]">Không tìm thấy phiếu xuất kho nào.</p>
            </div>
          ) : (
            <table className="w-full text-left text-[14px] border-collapse">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-medium">
                <tr>
                  <th className="px-6 py-4 font-medium">Mã phiếu</th>
                  <th className="px-6 py-4 font-medium">Đơn hàng</th>
                  <th className="px-6 py-4 font-medium">Người nhận</th>
                  <th className="px-6 py-4 font-medium">Hình thức giao</th>
                  <th className="px-6 py-4 font-medium text-center">Trạng thái</th>
                  <th className="px-6 py-4 font-medium">Ngày tạo</th>
                  <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] text-[#475569]">
                {filteredSlips.map((slip) => {
                  const isPending = slip.status === 'PENDING';
                  
                  return (
                    <tr key={slip.id} className="hover:bg-[#f8fafc]/50 transition-colors">
                      {/* Code */}
                      <td className="px-6 py-4 font-bold text-[#0f172a]">
                        {slip.code}
                      </td>
                      {/* Order ID */}
                      <td className="px-6 py-4 font-semibold text-[#64748b]">
                        {slip.orderId ? `#${String(slip.orderId).padStart(5, '0')}` : 'Nghiệp vụ'}
                      </td>

                      {/* Recipient / Export Reason */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-[#0f172a]">{slip.recipientName ?? '—'}</p>
                          {slip.recipientPhone && slip.recipientPhone !== 'N/A' && (
                            <p className="text-[11px] text-[#94a3b8] mt-0.5">{slip.recipientPhone}</p>
                          )}
                        </div>
                      </td>

                      {/* Delivery Type */}
                      <td className="px-6 py-4">
                        {slip.orderId ? (
                          <span className="flex items-center gap-1.5 font-medium text-[13px] text-[#334155]">
                            {slip.deliveryType === 'HOME_DELIVERY' ? (
                              <>
                                <Home className="size-3.5 text-blue-500 shrink-0" />
                                Giao tận nhà
                              </>
                            ) : (
                              <>
                                <Store className="size-3.5 text-amber-500 shrink-0" />
                                Tại showroom
                              </>
                            )}
                          </span>
                        ) : (
                          <span className="text-[#64748b] text-[13px] font-medium">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="size-3" /> Chờ xuất kho
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="size-3" /> Đã hoàn thành
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="px-6 py-4 text-[#64748b] text-[12px]">
                        {formatDate(slip.createdAt)}
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onViewClick(slip)}
                            className="p-1.5 hover:bg-[#f1f5f9] rounded-[8px] text-[#64748b] hover:text-[#0f172a] transition-colors cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye className="size-4.5" />
                          </button>
                          
                          {isPending ? (
                            <button
                              onClick={() => onDispatchClick(slip.id)}
                              disabled={dispatchingId !== null}
                              className="px-3 py-1.5 bg-[#0058be] hover:bg-[#0047a3] text-white text-[12px] font-semibold rounded-[8px] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                            >
                              {dispatchingId === slip.id ? (
                                <Loader2 className="size-3 animate-spin mr-1" />
                              ) : null}
                              Xuất kho
                            </button>
                          ) : slip.documentUrl ? (
                            <a
                              href={slip.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] text-[12px] font-semibold rounded-[8px] transition-colors cursor-pointer"
                            >
                              <ExternalLink className="size-3" />
                              File Excel
                            </a>
                          ) : null}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-[#e2e8f0] rounded-[12px] px-6 py-4 shadow-sm">
          <span className="text-[13px] text-[#64748b] font-medium">
            Hiển thị <span className="font-semibold text-[#334155]">{page * size + 1}</span> – <span className="font-semibold text-[#334155]">{Math.min((page + 1) * size, totalElements)}</span> trong <span className="font-semibold text-[#334155]">{totalElements}</span> phiếu xuất kho
          </span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1.5 border border-[#e2e8f0] rounded-[8px] hover:bg-[#f8fafc] disabled:opacity-40 transition-all cursor-pointer"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-[13px] font-semibold text-[#0f172a] px-3">
              Trang {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
              className="p-1.5 border border-[#e2e8f0] rounded-[8px] hover:bg-[#f8fafc] disabled:opacity-40 transition-all cursor-pointer"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
