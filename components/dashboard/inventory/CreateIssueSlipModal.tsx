"use client";

import { useState, useEffect } from "react";
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  Loader2,
  Package,
  Check,
} from "lucide-react";
import {
  adminAPI,
  orderAPI,
  Product,
  IssueSlipResponse,
  OrderResponse,
} from "@/lib/api";
import { CldImage } from "next-cloudinary";
import toast from "react-hot-toast";

interface CreateIssueSlipModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface SelectedItem {
  product: Product;
  quantity: number;
}

const EXPORT_REASONS = [
  {
    key: "RETAIL_SALE",
    label: "Xuất hàng bán lẻ",
    description: "Bắt buộc chọn đơn hàng đã duyệt tương ứng để xuất kho bán lẻ",
  },
  {
    key: "PROVIDER_RETURN",
    label: "Xuất trả hàng lỗi cho nhà cung cấp",
    description: "Trả lại hàng bị lỗi hoặc hỏng cho nhà phân phối",
  },
  {
    key: "PC_ASSEMBLY",
    label: "Xuất linh kiện để lắp ráp PC bộ",
    description: "Sử dụng linh kiện trong kho để tự ráp cấu hình PC nguyên bộ",
  },
];

export default function CreateIssueSlipModal({
  onClose,
  onSuccess,
}: CreateIssueSlipModalProps) {
  const [reason, setReason] = useState<
    "RETAIL_SALE" | "PROVIDER_RETURN" | "PC_ASSEMBLY"
  >("RETAIL_SALE");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await adminAPI.getProducts(0, 1000);
        setAllProducts(res.content || []);
      } catch (e) {
        toast.error("Không thể tải danh sách sản phẩm");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.resolve();
      if (reason === "RETAIL_SALE") {
        const fetchOrders = async () => {
          setLoadingOrders(true);
          try {
            const res = await orderAPI.adminListAll();
            
            const confirmedOrders = res.filter((o) => o.status === "CONFIRMED");
            setOrders(confirmedOrders);
          } catch (e) {
            toast.error("Không thể tải danh sách đơn hàng đã duyệt");
          } finally {
            setLoadingOrders(false);
          }
        };
        fetchOrders();
        setSelectedItems([]);
        setSelectedOrderId(null);
      } else {
        setSelectedItems([]);
        setSelectedOrderId(null);
      }
    };
    init();
  }, [reason]);

  
  const searchResults =
    searchQuery.trim() === ""
      ? []
      : allProducts
          .filter(
            (p) =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              String(p.id).includes(searchQuery),
          )
          .slice(0, 5); 

  const handleSelectItem = (product: Product) => {
    if (product.stock <= 0) {
      toast.error("Sản phẩm này đã hết hàng trong kho!");
      return;
    }

    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        toast.error(
          "Sản phẩm đã được chọn. Vui lòng điều chỉnh số lượng ở danh sách phía dưới.",
        );
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSearchQuery(""); 
  };

  const handleUpdateQuantity = (productId: number | string, qty: number) => {
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const validatedQty = Math.max(1, Math.min(qty, item.product.stock));
          if (qty > item.product.stock) {
            toast.error(`Chỉ còn ${item.product.stock} sản phẩm trong kho!`);
          }
          return { ...item, quantity: validatedQty };
        }
        return item;
      }),
    );
  };

  const handleRemoveItem = (productId: number | string) => {
    setSelectedItems((prev) =>
      prev.filter((item) => item.product.id !== productId),
    );
  };

  const handleSubmit = async () => {
    if (reason === "RETAIL_SALE" && !selectedOrderId) {
      toast.error("Vui lòng chọn đơn hàng liên kết để xuất hàng bán lẻ");
      return;
    }

    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm cần xuất kho");
      return;
    }

    
    for (const item of selectedItems) {
      if (item.quantity > item.product.stock) {
        toast.error(
          `Sản phẩm "${item.product.name}" vượt quá số lượng tồn kho khả dụng!`,
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      await adminAPI.createManualIssueSlip({
        exportReason: reason,
        orderId: selectedOrderId ?? undefined,
        items: selectedItems.map((item) => ({
          productId: Number(item.product.id),
          quantity: item.quantity,
        })),
      });
      toast.success("Đã xác nhận xuất kho và ghi nhận nhật ký thành công!");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(
        error?.response?.data?.message ??
          "Đã có lỗi xảy ra khi tạo phiếu xuất kho",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-[16px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-[#e2e8f0]"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] bg-[#f8fafc]">
          <div>
            <h3 className="font-semibold text-[18px] text-[#0f172a]">
              Tạo phiếu xuất kho trực tiếp
            </h3>
            <p className="text-[#64748b] text-[13px] mt-0.5">
              Xuất kho nhanh và tự động cập nhật số lượng tồn kho
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#94a3b8] hover:text-[#475569] hover:bg-[#f1f5f9] rounded-[8px] transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {}
          <div className="space-y-3">
            <h4 className="text-[12px] font-bold text-[#64748b] uppercase tracking-[0.5px]">
              Lý do xuất kho
            </h4>
            <div className="flex flex-col gap-2.5">
              {EXPORT_REASONS.map((r) => {
                const isSelected = reason === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setReason(r.key as typeof reason)}
                    className={`flex items-start text-left p-3.5 border rounded-[12px] transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#0058be] bg-blue-50/20 shadow-sm"
                        : "border-[#e2e8f0] hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
                    }`}
                  >
                    <div
                      className={`mt-0.5 size-4 rounded-full border flex items-center justify-center shrink-0 mr-3 ${
                        isSelected
                          ? "border-[#0058be] bg-[#0058be]"
                          : "border-[#cbd5e1] bg-white"
                      }`}
                    >
                      {isSelected && (
                        <div className="size-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-[14px] font-semibold ${isSelected ? "text-[#0058be]" : "text-[#0f172a]"}`}
                      >
                        {r.label}
                      </p>
                      <p className="text-[12px] text-[#64748b] mt-0.5">
                        {r.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {}
          {reason === "RETAIL_SALE" && (
            <div className="space-y-3 bg-blue-50/10 border border-[#0058be]/10 rounded-[12px] p-4">
              <h4 className="text-[12px] font-bold text-[#64748b] uppercase tracking-[0.5px] flex items-center gap-2">
                Chọn đơn hàng liên kết
                {loadingOrders && (
                  <Loader2 className="size-3.5 text-[#0058be] animate-spin" />
                )}
              </h4>
              <select
                value={selectedOrderId ?? ""}
                onChange={(e) => {
                  const val = Number(e.target.value) || null;
                  setSelectedOrderId(val);
                  if (val) {
                    const ord = orders.find((o) => o.id === val);
                    if (ord) {
                      const itemsList = ord.items.map((item) => {
                        const prod = allProducts.find(
                          (p) => Number(p.id) === Number(item.productId),
                        );
                        return {
                          product:
                            prod ||
                            ({
                              id: item.productId,
                              name: `Linh kiện mã #${item.productId}`,
                              stock: item.quantity,
                              price: item.sellingPrice,
                            } as Product),
                          quantity: item.quantity,
                        };
                      });
                      setSelectedItems(itemsList);
                    }
                  } else {
                    setSelectedItems([]);
                  }
                }}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-[#0058be] transition-all"
              >
                <option value="">-- Chọn đơn hàng đã duyệt --</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    Đơn #{String(o.id).padStart(5, "0")} -{" "}
                    {o.recipientName || "Khách lẻ"} (
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(o.totalAmount)}
                    )
                  </option>
                ))}
              </select>
              {orders.length === 0 && !loadingOrders && (
                <p className="text-[12px] text-amber-600 font-medium">
                  Hiện tại không có đơn hàng nào chờ xuất kho.
                </p>
              )}
            </div>
          )}

          {}
          {reason !== "RETAIL_SALE" && (
            <div className="space-y-3">
              <h4 className="text-[12px] font-bold text-[#64748b] uppercase tracking-[0.5px]">
                Chọn sản phẩm xuất
              </h4>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4.5 text-[#94a3b8]" />
                  <input
                    type="text"
                    placeholder="Nhập tên hoặc mã sản phẩm để tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={loadingProducts}
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] pl-10 pr-4 py-2.5 text-[14px] focus:outline-none focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] transition-all disabled:opacity-50"
                  />
                  {loadingProducts && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4.5 text-[#0058be] animate-spin" />
                  )}
                </div>

                {}
                {searchQuery.trim() !== "" && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-[#e2e8f0] rounded-[10px] shadow-lg max-h-[220px] overflow-y-auto z-10 divide-y divide-[#e2e8f0]">
                    {searchResults.length === 0 ? (
                      <div className="p-4 text-center text-[#64748b] text-[13px]">
                        Không tìm thấy sản phẩm nào phù hợp.
                      </div>
                    ) : (
                      searchResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectItem(p)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f8fafc] transition-colors text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            {p.thumbnailUrl ? (
                              p.thumbnailUrl.startsWith("http://localhost") ? (
                                <img
                                  src={p.thumbnailUrl}
                                  alt={p.name}
                                  className="h-8 w-8 object-contain shrink-0"
                                />
                              ) : (
                                <CldImage
                                  src={p.thumbnailUrl}
                                  alt={p.name}
                                  width={32}
                                  height={32}
                                  className="h-8 w-8 object-contain shrink-0"
                                />
                              )
                            ) : (
                              <div className="size-8 bg-[#f1f5f9] rounded-[6px] flex items-center justify-center shrink-0">
                                <Package className="size-4.5 text-[#94a3b8]" />
                              </div>
                            )}
                            <div>
                              <p className="text-[13px] font-semibold text-[#0f172a] line-clamp-1">
                                {p.name}
                              </p>
                              <p className="text-[11px] text-[#94a3b8] mt-0.5">
                                Mã SP: #{p.id}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-[12px] font-semibold ${p.stock > 0 ? "text-[#334155]" : "text-red-500"}`}
                            >
                              Tồn: {p.stock}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {}
          <div className="space-y-3">
            <h4 className="text-[12px] font-bold text-[#64748b] uppercase tracking-[0.5px] flex items-center justify-between">
              <span>Hàng xuất kho ({selectedItems.length})</span>
              {selectedItems.length > 0 && reason !== "RETAIL_SALE" && (
                <button
                  type="button"
                  onClick={() => setSelectedItems([])}
                  className="text-[#94a3b8] hover:text-red-600 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Xóa tất cả
                </button>
              )}
            </h4>

            {selectedItems.length === 0 ? (
              <div className="border-2 border-dashed border-[#e2e8f0] rounded-[12px] py-10 flex flex-col items-center justify-center text-[#64748b] gap-2">
                <Package className="size-8 text-[#94a3b8] opacity-60" />
                <p className="text-[13.5px]">Chưa có mặt hàng nào được chọn.</p>
                <p className="text-[11.5px] text-[#94a3b8]">
                  {reason === "RETAIL_SALE"
                    ? "Hãy chọn đơn hàng ở phía trên để tự động nạp linh kiện."
                    : "Hãy sử dụng ô tìm kiếm ở trên để thêm linh kiện."}
                </p>
              </div>
            ) : (
              <div className="border border-[#e2e8f0] rounded-[12px] overflow-hidden divide-y divide-[#e2e8f0]">
                {selectedItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white hover:bg-[#f8fafc]/30 transition-colors"
                  >
                    {}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {item.product.thumbnailUrl ? (
                        item.product.thumbnailUrl.startsWith(
                          "http://localhost",
                        ) ? (
                          <img
                            src={item.product.thumbnailUrl}
                            alt={item.product.name}
                            className="h-10 w-10 object-contain shrink-0"
                          />
                        ) : (
                          <CldImage
                            src={item.product.thumbnailUrl}
                            alt={item.product.name}
                            width={40}
                            height={40}
                            className="h-10 w-10 object-contain shrink-0"
                          />
                        )
                      ) : (
                        <div className="size-10 bg-[#f1f5f9] rounded-[6px] flex items-center justify-center shrink-0">
                          <Package className="size-5 text-[#94a3b8]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-[#0f172a] truncate">
                          {item.product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-[#94a3b8]">
                            Mã: #{item.product.id}
                          </span>
                          <span className="text-[11px] text-[#94a3b8]">•</span>
                          <span className="text-[11px] font-semibold text-emerald-700">
                            Tồn kho khả dụng: {item.product.stock}
                          </span>
                        </div>
                      </div>
                    </div>

                    {}
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto shrink-0 border-t sm:border-0 pt-2.5 sm:pt-0">
                      <div className="flex items-center gap-1.5">
                        {reason !== "RETAIL_SALE" ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.product.id,
                                  item.quantity - 1,
                                )
                              }
                              className="w-7 h-7 border border-[#cbd5e1] hover:bg-[#f1f5f9] hover:border-[#94a3b8] rounded-full flex items-center justify-center transition-colors text-[#475569] cursor-pointer"
                            >
                              <Minus className="size-3.5" />
                            </button>

                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateQuantity(
                                  item.product.id,
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              className="w-12 text-center text-[13.5px] font-bold text-[#0f172a] focus:outline-none bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] py-1"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.product.id,
                                  item.quantity + 1,
                                )
                              }
                              disabled={item.quantity >= item.product.stock}
                              className="w-7 h-7 border border-[#cbd5e1] hover:bg-[#f1f5f9] hover:border-[#94a3b8] rounded-full flex items-center justify-center transition-colors text-[#475569] disabled:opacity-40 cursor-pointer"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="text-right">
                            <span className="text-[11px] text-[#94a3b8] font-bold block">
                              Số lượng xuất
                            </span>
                            <span className="text-[14px] font-bold text-[#0f172a]">
                              {item.quantity} cái
                            </span>
                          </div>
                        )}
                      </div>

                      {reason !== "RETAIL_SALE" && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.product.id)}
                          className="p-1.5 hover:bg-red-50 text-[#94a3b8] hover:text-red-600 rounded-[8px] transition-colors cursor-pointer"
                          title="Xóa khỏi danh sách"
                        >
                          <Trash2 className="size-4.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {}
        <div className="border-t border-[#e2e8f0] px-6 py-4 bg-[#f8fafc] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#cbd5e1] hover:border-[#94a3b8] rounded-[8px] text-[13.5px] font-medium text-[#475569] bg-white transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || selectedItems.length === 0}
            className="px-5 py-2 bg-[#0058be] hover:bg-[#0047a3] text-white text-[13.5px] font-semibold rounded-[8px] shadow-sm disabled:opacity-50 flex items-center gap-2 transition-colors cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4.5" />
            )}
            Xác nhận xuất kho
          </button>
        </div>
      </div>
    </div>
  );
}
