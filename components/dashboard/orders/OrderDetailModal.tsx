"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Phone,
  User as UserIcon,
  X,
  XCircle,
  ClipboardList,
  CreditCard,
  Percent,
} from "lucide-react";
import {
  orderAPI,
  adminAPI,
  OrderResponse,
  OrderStatus,
  DeliveryType,
  Product,
} from "@/lib/api";
import { DELIVERY_META, PAYMENT_METHOD_META, PAYMENT_STATUS_META } from "@/utils/labelMapping";
import { formatPrice, formatDate } from "@/utils/format";
import toast from "react-hot-toast";
import StatusBadge from "./StatusBadge";

interface OrderDetailModalProps {
  order: OrderResponse;
  onClose: () => void;
  onRefresh: () => void;
}

export default function OrderDetailModal({
  order,
  onClose,
  onRefresh,
}: OrderDetailModalProps) {
  const [confirming, setConfirming] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [productsMap, setProductsMap] = useState<Record<number, Product>>({});
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    async function fetchProductDetails() {
      setLoadingProducts(true);
      const newMap: Record<number, Product> = {};
      try {
        const promises = order.items.map(async (item) => {
          if (item.productId && !newMap[item.productId]) {
            try {
              const prod = await adminAPI.getProductById(item.productId);
              newMap[item.productId] = prod;
            } catch (err) {
              console.error(`Error loading product #${item.productId}`, err);
            }
          }
        });
        await Promise.all(promises);
        setProductsMap(newMap);
      } catch (err) {
        console.error("Error loading products details:", err);
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchProductDetails();
  }, [order.items]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await orderAPI.adminConfirm(order.id);
      toast.success(`Đã duyệt đơn hàng #${order.id} thành công!`);
      onRefresh();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Duyệt đơn thất bại");
    } finally {
      setConfirming(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }
    setRejecting(true);
    try {
      await orderAPI.adminReject(order.id, rejectReason.trim());
      toast.success(`Đã từ chối đơn hàng #${order.id}`);
      onRefresh();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Từ chối đơn thất bại");
    } finally {
      setRejecting(false);
    }
  };

  const handleStatusUpdate = async (status: OrderStatus) => {
    setUpdating(true);
    try {
      await orderAPI.adminUpdateStatus(order.id, status);
      toast.success("Đã cập nhật trạng thái đơn hàng");
      onRefresh();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Cập nhật thất bại");
    } finally {
      setUpdating(false);
    }
  };



  const delivery = DELIVERY_META[order.deliveryType];
  const isOnlinePayment = order.paymentMethod !== "COD";
  const isPaid = order.paymentStatus === "PAID";
  const canConfirm = !isOnlinePayment || isPaid;

  const steps: { status: OrderStatus; label: string }[] = [
    { status: "PENDING_APPROVAL", label: "Chờ duyệt" },
    { status: "CONFIRMED", label: "Đã duyệt" },
    { status: "SHIPPED", label: "Đang giao" },
    { status: "DELIVERED", label: "Đã giao" },
  ];
  const activeIndex = steps.findIndex((s) => s.status === order.status);
  const isCancelled = order.status === "CANCELLED";
  const isRejected = order.status === "REJECTED";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-[12px] shadow-xl w-full max-w-[680px] max-h-[90vh] flex flex-col overflow-hidden border border-[#e2e8f0]"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {/* Header */}
        <div className="border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between bg-[#f8fafc]">
          <div>
            <h2 className="text-[#0f172a] text-[18px] font-semibold tracking-[-0.3px]">
              Đơn hàng: #{String(order.id).padStart(5, "0")}
            </h2>
            <p className="text-[12px] text-[#64748b] mt-0.5">
              Chi tiết các mặt hàng và giao dịch
            </p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 text-[13px]">
          {/* Stepper Timeline */}
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-4 flex flex-col gap-3">
            <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.5px]">
              Tiến trình đơn hàng
            </p>
            {isCancelled ? (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-[8px] px-3 py-2">
                <XCircle className="size-4 shrink-0" />
                <span className="font-semibold text-[12px]">Đơn hàng này đã bị hủy.</span>
              </div>
            ) : isRejected ? (
              <div className="flex flex-col gap-1.5 text-rose-600 bg-rose-50 border border-rose-100 rounded-[8px] px-3 py-2">
                <div className="flex items-center gap-2">
                  <XCircle className="size-4 shrink-0" />
                  <span className="font-semibold text-[12px]">Đơn hàng này đã bị từ chối.</span>
                </div>
                {order.rejectReason && (
                  <p className="text-[11px] ml-6 opacity-90 font-medium">Lý do: {order.rejectReason}</p>
                )}
              </div>
            ) : (
              <div className="relative flex items-center justify-between mt-2 px-2 pb-1">
                {/* Connecting lines */}
                <div className="absolute left-6 right-6 top-[11px] -translate-y-1/2 h-0.5 bg-[#e2e8f0] -z-0" />
                <div
                  className="absolute left-6 top-[11px] -translate-y-1/2 h-0.5 bg-[#0058be] transition-all duration-300 -z-0"
                  style={{
                    width: `${activeIndex >= 0 ? (activeIndex / (steps.length - 1)) * 100 : 0}%`,
                    right: "auto"
                  }}
                />

                {/* Steps */}
                {steps.map((step, idx) => {
                  const isCompleted = idx <= activeIndex;
                  const isActive = idx === activeIndex;
                  return (
                    <div key={step.status} className="flex flex-col items-center gap-1.5 relative z-10">
                      <div
                        className={`size-[22px] rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-300 ${
                          isActive
                            ? "bg-[#0058be] text-white border-[#0058be] ring-4 ring-blue-100"
                            : isCompleted
                            ? "bg-[#0058be] text-white border-[#0058be]"
                            : "bg-white text-[#94a3b8] border-[#cbd5e1]"
                        }`}
                      >
                        {isCompleted ? "✓" : idx + 1}
                      </div>
                      <span
                        className={`text-[11px] font-semibold transition-colors duration-300 ${
                          isActive
                            ? "text-[#0058be]"
                            : isCompleted
                            ? "text-[#334155]"
                            : "text-[#94a3b8]"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customer & Shipping Details */}
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <UserIcon className="size-4 text-[#0058be] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.5px]">
                  Khách hàng
                </p>
                <p className="font-semibold text-[#0f172a] mt-0.5">
                  {order.username ?? `User #${order.userId}`}
                </p>
                <p className="text-[11.5px] text-[#64748b] mt-0.5">
                  {order.email ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <delivery.Icon className="size-4 text-[#0058be] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.5px]">
                  Giao hàng
                </p>
                <p className="font-semibold text-[#0f172a] mt-0.5">
                  {delivery.label}
                </p>
              </div>
            </div>
            {order.deliveryType === "HOME_DELIVERY" && (
              <>
                <div className="flex items-start gap-2 border-t border-[#e2e8f0] pt-3">
                  <UserIcon className="size-3.5 text-[#64748b] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-[#64748b]">
                      Người nhận
                    </p>
                    <p className="text-[#475569] font-medium mt-0.5">
                      {order.recipientName ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 border-t border-[#e2e8f0] pt-3">
                  <Phone className="size-3.5 text-[#64748b] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-[#64748b]">
                      Điện thoại
                    </p>
                    <p className="text-[#475569] font-medium mt-0.5">
                      {order.recipientPhone ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 flex items-start gap-2 border-t border-[#e2e8f0] pt-3">
                  <MapPin className="size-3.5 text-[#64748b] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-[#64748b]">
                      Địa chỉ giao hàng
                    </p>
                    <p className="text-[#475569] font-medium mt-0.5">
                      {order.shippingAddress ?? "—"}
                    </p>
                  </div>
                </div>
              </>
            )}
            <div className="col-span-1 md:col-span-2 flex items-center gap-1.5 border-t border-[#e2e8f0] pt-3 text-[11px] text-[#64748b]">
              <ClipboardList className="size-3.5" />
              Tạo lúc: {formatDate(order.createdAt)}
            </div>
          </div>

          {/* Payment Status section */}
          <div className="bg-white border border-[#e2e8f0] rounded-[8px] p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <CreditCard className="size-4 text-[#0058be] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.5px]">
                  Phương thức thanh toán
                </p>
                {order.paymentMethod && PAYMENT_METHOD_META[order.paymentMethod] ? (
                  <span className={`inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold ${PAYMENT_METHOD_META[order.paymentMethod].bg} ${PAYMENT_METHOD_META[order.paymentMethod].color}`}>
                    {PAYMENT_METHOD_META[order.paymentMethod].label}
                  </span>
                ) : (
                  <p className="font-semibold text-[#0f172a] mt-0.5">—</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-[#0058be] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.5px]">
                  Trạng thái thanh toán
                </p>
                {order.paymentStatus && PAYMENT_STATUS_META[order.paymentStatus] ? (
                  (() => {
                    const pm = PAYMENT_STATUS_META[order.paymentStatus];
                    return (
                      <span className={`inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${pm.bg} ${pm.color}`}>
                        <pm.Icon className="size-3" />
                        {pm.label}
                      </span>
                    );
                  })()
                ) : (
                  <p className="font-semibold text-[#0f172a] mt-0.5">—</p>
                )}
              </div>
            </div>
          </div>

          {/* Products List */}
          <div>
            <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.8px] mb-3">
              Danh sách sản phẩm
            </p>
            {loadingProducts ? (
              <div className="flex items-center justify-center py-6 gap-2 text-[#64748b] bg-slate-50 border border-dashed border-slate-200 rounded-[12px]">
                <Loader2 className="size-4 animate-spin text-[#0058be]" />
                <span>Đang tải thông tin sản phẩm...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {order.items.map((item, i) => {
                  const product = item.productId ? productsMap[item.productId] : null;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] rounded-[12px] p-3 transition-all duration-200 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="size-6 flex items-center justify-center bg-[#f1f5f9] rounded-full text-[11px] font-bold text-[#475569] shrink-0">
                          {i + 1}
                        </span>
                        {product?.thumbnailUrl ? (
                          <img
                            src={product.thumbnailUrl.startsWith("http") ? product.thumbnailUrl : `http://localhost:8080${product.thumbnailUrl}`}
                            alt={product.name}
                            className="size-12 rounded-[8px] object-cover border border-[#e2e8f0]"
                          />
                        ) : (
                          <div className="size-12 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center text-[10px] text-[#94a3b8] font-bold shrink-0">
                            No Pic
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[#0f172a] text-[13.5px] line-clamp-1 max-w-[320px]">
                            {product?.name ?? `Sản phẩm #${item.productId}`}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-[#475569] font-medium bg-[#f1f5f9] px-1.5 py-0.5 rounded-[4px]">
                              SL: {item.quantity}
                            </span>
                            <span className="text-[11px] text-[#64748b]">
                              × {formatPrice(Number(item.sellingPrice))}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="font-bold text-[#0058be] text-[14px]">
                        {formatPrice(Number(item.sellingPrice) * item.quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-slate-600 font-semibold">
              <span>Tạm tính</span>
              <span>{formatPrice(order.items.reduce((sum, item) => sum + Number(item.sellingPrice) * item.quantity, 0))}</span>
            </div>
            {order.couponCode && (
              <div className="flex items-center justify-between text-emerald-600 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Percent className="size-3.5" />
                  Mã giảm giá (<strong className="uppercase">{order.couponCode}</strong>)
                </span>
                <span>-{formatPrice(order.couponDiscount || 0)}</span>
              </div>
            )}
            <div className="border-t border-[#e2e8f0] my-1 pt-2.5 flex items-center justify-between text-[#0058be]">
              <span className="font-bold text-[14px]">Tổng cộng thanh toán</span>
              <span className="text-[20px] font-black">{formatPrice(Number(order.totalAmount))}</span>
            </div>
          </div>

          {/* Document download */}
          {order.documentUrl && (
            <a
              href={order.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 bg-white border border-[#e2e8f0] rounded-[8px] text-[13px] font-semibold text-[#0058be] hover:border-[#0058be] hover:bg-[#eff6ff] transition-all"
            >
              <FileText className="size-4" />
              Tải phiếu xuất kho (Excel)
              <ExternalLink className="size-3.5 ml-auto" />
            </a>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#f8fafc] border-t border-[#e2e8f0] px-6 py-4 flex items-center gap-3 flex-wrap">
          {showRejectForm ? (
            <div className="w-full flex flex-col gap-2 animate-fade-in">
              <p className="text-[12px] font-bold text-rose-600">Lý do từ chối đơn hàng:</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do chi tiết..."
                className="w-full min-h-[60px] p-2 text-[13px] border border-rose-200 rounded-[8px] focus:outline-none focus:border-rose-400 resize-none bg-rose-50"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  disabled={rejecting}
                  className="px-3 py-1.5 bg-white border border-[#cbd5e1] text-[#475569] text-[12px] font-semibold rounded-[6px] hover:bg-[#f1f5f9] transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={rejecting || !rejectReason.trim()}
                  className="px-3 py-1.5 bg-rose-600 text-white text-[12px] font-semibold rounded-[6px] hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {rejecting && <Loader2 className="size-3 animate-spin" />}
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          ) : (
            <>
              {order.status === "PENDING_APPROVAL" && (
                <>
                  <button
                    type="button"
                    disabled={confirming || !canConfirm}
                    onClick={handleConfirm}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0058be] hover:bg-[#0047a3] text-white text-[13px] font-semibold rounded-[8px] shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    title={!canConfirm ? "Chỉ có thể duyệt đơn online khi đã thanh toán thành công" : undefined}
                  >
                    {confirming ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    Duyệt đơn hàng
                  </button>
                  <button
                    type="button"
                    disabled={confirming || updating}
                    onClick={() => setShowRejectForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[13px] font-semibold rounded-[8px] shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="size-4" />
                    Từ chối đơn
                  </button>
                  {!canConfirm && (
                    <span className="text-red-500 text-[12px] font-semibold bg-red-50 border border-red-100 rounded px-2.5 py-1">
                      Chưa thanh toán online
                    </span>
                  )}
                </>
              )}
              {order.status === "CONFIRMED" && (
                <Link
                  href="/dashboard/inventory"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#0058be] text-[13px] font-semibold rounded-[8px] transition-colors"
                  onClick={onClose}
                >
                  <FileText className="size-4" />
                  Đơn đã duyệt. Chuyển sang Quản lý xuất kho để tạo phiếu.
                </Link>
              )}
              {order.status === "SHIPPED" && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleStatusUpdate("DELIVERED")}
                  className="flex items-center gap-2 px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white text-[13px] font-semibold rounded-[8px] shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {updating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Đánh dấu là đã giao
                </button>
              )}
              {(order.status === "PENDING_APPROVAL" || order.status === "CONFIRMED") && (
                <button
                  type="button"
                  disabled={updating || confirming}
                  onClick={() => handleStatusUpdate("CANCELLED")}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 text-[13px] font-semibold rounded-[8px] hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 ml-auto"
                >
                  <XCircle className="size-4" />
                  Hủy đơn
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
