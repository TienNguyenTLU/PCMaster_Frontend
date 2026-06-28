"use client";

import { ChevronLeft, ChevronRight, Edit2, Warehouse } from "lucide-react";
import { InventoryBatchResponse } from "@/lib/api";

import { formatPrice, formatDate } from "@/utils/format";

interface BatchListProps {
  batches: InventoryBatchResponse[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (newPage: number) => void;
  onEditClick: (batch: InventoryBatchResponse) => void;
  searchQuery: string;
  hideOutOfStock: boolean;
  sortBy: string;
}

export default function BatchList({
  batches,
  page,
  size,
  totalPages,
  totalElements,
  onPageChange,
  onEditClick,
  searchQuery,
  hideOutOfStock,
  sortBy,
}: BatchListProps) {
  
  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(batch.productId).includes(searchQuery) ||
      String(batch.id).includes(searchQuery);
    const matchesStock = hideOutOfStock ? batch.remainingQuantity > 0 : true;
    return matchesSearch && matchesStock;
  });

  const sortedBatches = [...filteredBatches].sort((a, b) => {
    if (sortBy === "name-asc") {
      return a.productName.localeCompare(b.productName, "vi");
    }
    if (sortBy === "name-desc") {
      return b.productName.localeCompare(a.productName, "vi");
    }
    if (sortBy === "id-asc") {
      const timeA = a.importedAt ? new Date(a.importedAt).getTime() : Number(a.id);
      const timeB = b.importedAt ? new Date(b.importedAt).getTime() : Number(b.id);
      return timeA - timeB;
    }
    
    const timeA = a.importedAt ? new Date(a.importedAt).getTime() : Number(a.id);
    const timeB = b.importedAt ? new Date(b.importedAt).getTime() : Number(b.id);
    return timeB - timeA;
  });

  return (
    <div className="space-y-4" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="bg-white border border-[#e2e8f0] rounded-[12px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[300px]">
          {sortedBatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#64748b] gap-2">
              <Warehouse className="size-8 text-[#94a3b8]" />
              <p className="text-[14px]">Không tìm thấy lô hàng tồn kho nào.</p>
            </div>
          ) : (
            <table className="w-full text-left text-[14px] border-collapse">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-medium">
                <tr>
                  <th className="px-6 py-4 font-medium">Mã lô</th>
                  <th className="px-6 py-4 font-medium">Sản phẩm</th>
                  <th className="px-6 py-4 font-medium text-right">
                    Giá nhập (VND)
                  </th>
                  <th className="px-6 py-4 font-medium text-right">
                    Giá bán (VND)
                  </th>
                  <th className="px-6 py-4 font-medium text-center">
                    Tồn kho / Ban đầu
                  </th>
                  <th className="px-6 py-4 font-medium text-center">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 font-medium">Ngày nhập</th>
                  <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] text-[#475569]">
                {sortedBatches.map((batch) => {
                  const isOutOfStock = batch.remainingQuantity === 0;
                  const isLowStock =
                    batch.remainingQuantity > 0 && batch.remainingQuantity <= 5;

                  return (
                    <tr
                      key={batch.id}
                      className="hover:bg-[#f8fafc]/50 transition-colors"
                    >
                      {}
                      <td className="px-6 py-4 font-medium text-[#0f172a]">
                        #{String(batch.id).padStart(4, "0")}
                      </td>

                      {}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-[6px] bg-[#f8fafc] border border-[#e2e8f0] overflow-hidden shrink-0 flex items-center justify-center">
                            {batch.thumbnailUrl ? (
                              
                              <img
                                src={batch.thumbnailUrl}
                                alt={batch.productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Warehouse className="size-4.5 text-[#94a3b8]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#0f172a] line-clamp-1">
                              {batch.productName}
                            </p>
                            <p className="text-[11px] text-[#94a3b8] mt-0.5">
                              Mã SP: #{batch.productId}
                            </p>
                          </div>
                        </div>
                      </td>

                      {}
                      <td className="px-6 py-4 text-right font-semibold text-[#0058be]">
                        {formatPrice(batch.importPrice)}
                      </td>

                      {}
                      <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                        {formatPrice(batch.sellingPrice)}
                      </td>

                      {}
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-[#0f172a]">
                            {batch.remainingQuantity}
                          </span>
                          <span className="text-[11px] text-[#94a3b8] mt-0.5">
                            ban đầu: {batch.quantity}
                          </span>
                        </div>
                      </td>

                      {}
                      <td className="px-6 py-4 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-red-50 text-red-600 border border-red-200">
                            Hết hàng
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Sắp hết
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            Sẵn sàng
                          </span>
                        )}
                      </td>

                      {}
                      <td className="px-6 py-4 text-[#64748b] text-[12px]">
                        {formatDate(batch.importedAt)}
                      </td>

                      {}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onEditClick(batch)}
                          className="p-1.5 hover:bg-[#f1f5f9] rounded-[8px] text-[#64748b] hover:text-[#0058be] transition-colors cursor-pointer"
                          title="Sửa giá nhập/bán"
                        >
                          <Edit2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-[#e2e8f0] rounded-[12px] px-6 py-4 shadow-sm">
          <span className="text-[13px] text-[#64748b] font-medium">
            Hiển thị{" "}
            <span className="font-semibold text-[#334155]">
              {page * size + 1}
            </span>{" "}
            –{" "}
            <span className="font-semibold text-[#334155]">
              {Math.min((page + 1) * size, totalElements)}
            </span>{" "}
            trong{" "}
            <span className="font-semibold text-[#334155]">
              {totalElements}
            </span>{" "}
            lô hàng
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
