"use client";

import { useState, useEffect } from "react";
import { CheckCircle, FileText, Loader2 } from "lucide-react";
import { adminAPI, Product, Supplier, PurchaseOrder, Brand } from "@/lib/api";

import CreatePOModal from "@/components/dashboard/purchase-orders/CreatePOModal";
import PreviewModal from "@/components/dashboard/purchase-orders/PreviewModal";
import ReceiveItemsModal from "@/components/dashboard/purchase-orders/ReceiveItemsModal";

interface PurchaseOrderListProps {
  searchQuery: string;
  isCreateOpen: boolean;
  setIsCreateOpen: (open: boolean) => void;
  reloadTrigger: number;
}

export default function PurchaseOrderList({
  searchQuery,
  isCreateOpen,
  setIsCreateOpen,
  reloadTrigger,
}: PurchaseOrderListProps) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  const [previewPO, setPreviewPO] = useState<PurchaseOrder | null>(null);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getPurchaseOrders();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
      adminAPI.getSuppliers(0, 200).then((r) => setSuppliers(r.content || []));
      adminAPI.getBrands(0, 200).then((r) => setAllBrands(r.content || []));
      adminAPI
        .getProducts(0, 1000)
        .then((r) => setAllProducts(r.content || []));
    }, 0);
    return () => clearTimeout(timer);
  }, [reloadTrigger]);

  const getSupplier = (id: number) =>
    suppliers.find((s) => Number(s.id) === id);

  const filteredOrders = orders.filter((order) => {
    const supplier = getSupplier(order.supplierId);
    const searchLower = searchQuery.toLowerCase();
    const poCode = `po-${String(order.id).padStart(4, "0")}`;
    return (
      poCode.includes(searchLower) ||
      (supplier?.name || "").toLowerCase().includes(searchLower)
    );
  });

  return (
    <div
      className="flex flex-col gap-6"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Tổng phiếu", value: orders.length, color: "#0058be" },
          {
            label: "Chờ nhận hàng",
            value: orders.filter((o) => o.status === "DRAFT").length,
            color: "#f59e0b",
          },
          {
            label: "Đã nhận hàng",
            value: orders.filter((o) => o.status === "RECEIVED").length,
            color: "#10b981",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-[#e2e8f0] rounded-[12px] p-5 shadow-sm"
          >
            <p className="text-[#64748b] text-[13px]">{stat.label}</p>
            <p
              className="text-[28px] font-bold mt-1"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {}
      <div className="bg-white border border-[#e2e8f0] rounded-[12px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-[300px] gap-2 text-[#64748b]">
              <Loader2 className="size-5 animate-spin" /> Đang tải...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-[#94a3b8] gap-3">
              <FileText className="size-10 opacity-40" />
              <p className="text-[14px]">Không tìm thấy phiếu nhập hàng nào.</p>
            </div>
          ) : (
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b]">
                <tr>
                  <th className="px-6 py-4 font-medium">Mã phiếu</th>
                  <th className="px-6 py-4 font-medium">Nhà phân phối</th>
                  <th className="px-6 py-4 font-medium">Ngày tạo</th>
                  <th className="px-6 py-4 font-medium text-right">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-4 font-medium text-center">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] text-[#475569]">
                {filteredOrders.map((order) => {
                  const supplier = getSupplier(order.supplierId);
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-[#f8fafc]/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-medium text-[#0f172a]">
                        PO-{String(order.id).padStart(4, "0")}
                      </td>
                      <td className="px-6 py-4 text-[#475569]">
                        {supplier?.name ?? `Supplier #${order.supplierId}`}
                      </td>
                      <td className="px-6 py-4 text-[#475569]">
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-[#0f172a]">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${order.status === "RECEIVED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {order.status === "RECEIVED"
                            ? "✓ Đã nhận hàng"
                            : "⏳ Chờ nhận hàng"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewPO(order)}
                            className="p-1.5 hover:text-[#0058be] hover:bg-blue-50 rounded-[6px] transition-colors text-[#94a3b8] cursor-pointer"
                            title="Xem phiếu"
                          >
                            <FileText className="size-4" />
                          </button>
                          {order.status === "DRAFT" && (
                            <button
                              onClick={() => setReceivingPO(order)}
                              className="p-1.5 hover:text-green-600 hover:bg-green-50 rounded-[6px] transition-colors text-[#94a3b8] cursor-pointer"
                              title="Xác nhận nhận hàng"
                            >
                              <CheckCircle className="size-4" />
                            </button>
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

      {}
      {isCreateOpen && (
        <CreatePOModal
          suppliers={suppliers}
          allProducts={allProducts}
          allBrands={allBrands}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={fetchOrders}
        />
      )}
      {previewPO && (
        <PreviewModal
          po={previewPO}
          supplier={getSupplier(previewPO.supplierId)}
          products={allProducts}
          onClose={() => setPreviewPO(null)}
        />
      )}
      {receivingPO && (
        <ReceiveItemsModal
          po={receivingPO}
          products={allProducts}
          onClose={() => setReceivingPO(null)}
          onSuccess={fetchOrders}
        />
      )}
    </div>
  );
}
