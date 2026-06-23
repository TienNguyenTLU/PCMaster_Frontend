"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trash2,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  Home,
  Store,
  MapPin,
  Phone,
  User,
  Ticket,
  CreditCard,
  Coins,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { orderAPI, OrderRequest, DeliveryType, couponAPI, PaymentMethod } from "@/lib/api";
import toast from "react-hot-toast";

// Reusable utilities
import { formatPrice } from "@/utils/format";

// Custom Hook
import { useCartManager } from "@/hooks/useCartManager";

// Atomic subcomponents
import OrderSuccessModal from "./OrderSuccessModal";
import ClearCartModal from "./ClearCartModal";
import CartItemRow from "./CartItemRow";
import EmptyCart from "./EmptyCart";
import CartSkeleton from "./CartSkeleton";

export default function CartPage() {
  const { user, isHydrated, hydrate } = useAuthStore();
  const {
    items,
    isLoading,
    addingIds,
    removingIds,
    updatingIds,
    isClearing,
    fetchCart,
    handleRemoveFromCart,
    handleUpdateQuantity,
    handleClearCart,
  } = useCartManager();

  const router = useRouter();

  const [showClearModal, setShowClearModal] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    id: number;
    total: number;
    deliveryType: DeliveryType;
  } | null>(null);

  const [deliveryType, setDeliveryType] =
    useState<DeliveryType>("SHOWROOM_PICKUP");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");

  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && user) {
      fetchCart();
    }
  }, [isHydrated, user, fetchCart]);

  const subtotal = items.reduce((sum, item) => {
    const price =
      item.productDiscountPrice !== null &&
      item.productDiscountPrice !== undefined
        ? item.productDiscountPrice
        : item.productPrice;
    return sum + price * item.quantity;
  }, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasOutOfStock = items.some((item) => item.productStock === 0);
  const availableItems = items.filter((item) => item.productStock > 0);

  const couponDiscountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotalAmount = Math.max(0, subtotal - couponDiscountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError("");
    try {
      const response = await couponAPI.validate(
        couponCodeInput.trim(),
        subtotal,
      );
      setAppliedCoupon(response);
      toast.success(`Áp dụng mã ${response.code} thành công!`);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Mã giảm giá không hợp lệ.";
      setCouponError(msg);
      toast.error(msg);
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponError("");
    toast.success("Đã gỡ mã giảm giá.");
  };

  async function onClearConfirm() {
    const success = await handleClearCart();
    if (success) {
      setShowClearModal(false);
    }
  }

  async function handlePlaceOrder() {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đặt hàng");
      router.push("/auth/login");
      return;
    }
    if (availableItems.length === 0) {
      toast.error("Không có sản phẩm nào có thể đặt hàng");
      return;
    }
    if (deliveryType === "HOME_DELIVERY") {
      if (!recipientName.trim()) {
        toast.error("Vui lòng nhập họ tên người nhận");
        return;
      }
      if (!recipientPhone.trim()) {
        toast.error("Vui lòng nhập số điện thoại");
        return;
      }
      if (!shippingAddress.trim()) {
        toast.error("Vui lòng nhập địa chỉ giao hàng");
        return;
      }
    }

    setPlacingOrder(true);
    try {
      const request: OrderRequest = {
        items: availableItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        deliveryType,
        recipientName:
          deliveryType === "HOME_DELIVERY" ? recipientName.trim() : undefined,
        recipientPhone:
          deliveryType === "HOME_DELIVERY" ? recipientPhone.trim() : undefined,
        shippingAddress:
          deliveryType === "HOME_DELIVERY" ? shippingAddress.trim() : undefined,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        paymentMethod,
      };
      const order = await orderAPI.create(request);
      if (paymentMethod === "VNPAY") {
        const { paymentUrl } = await orderAPI.getPaymentUrl(order.id);
        window.location.href = paymentUrl;
      } else {
        await handleClearCart();
        setOrderSuccess({
          id: order.id,
          total: Number(order.totalAmount),
          deliveryType,
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Đặt hàng thất bại. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setPlacingOrder(false);
    }
  }

  if (isHydrated && !user) {
    return (
      <div
        className="min-h-screen"
        style={{
          background: "linear-gradient(180deg, #f7f9fb 0%, #f0f4fa 100%)",
        }}
      >
        <div className="bg-gradient-to-r from-[#0047a3] via-[#0058be] to-[#2170e4] text-white py-10 px-8">
          <div className="max-w-[1000px] mx-auto">
            <div className="flex items-center gap-2 text-[12px] text-blue-200 mb-3">
              <Link href="/home" className="hover:text-white transition-colors">
                Trang chủ
              </Link>
              <ChevronRight className="size-3" />
              <span className="text-white">Giỏ hàng</span>
            </div>
            <h1 className="text-[28px] font-bold">Giỏ hàng của bạn</h1>
          </div>
        </div>
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-16 flex flex-col items-center gap-5 text-center">
          <div className="w-20 h-20 rounded-full bg-[#eff6ff] flex items-center justify-center">
            <ShoppingBag className="size-9 text-[#0058be]/50 animate-pulse" />
          </div>
          <p className="text-[18px] font-bold text-[#0f172a]">
            Vui lòng đăng nhập
          </p>
          <p className="text-[14px] text-[#94a3b8]">
            Bạn cần đăng nhập để xem giỏ hàng.
          </p>
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-[#0058be] text-white text-[14px] font-semibold rounded-[14px] shadow-[0_4px_16px_rgba(0,88,190,0.30)] hover:bg-[#0047a3] transition-all"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #f7f9fb 0%, #f0f4fa 100%)",
      }}
    >
      <div className="bg-gradient-to-r from-[#0047a3] via-[#0058be] to-[#2170e4] text-white py-10 px-8">
        <div className="max-w-[1000px] mx-auto">
          <div className="flex items-center gap-2 text-[12px] text-blue-200 mb-3">
            <Link href="/home" className="hover:text-white transition-colors">
              Trang chủ
            </Link>
            <ChevronRight className="size-3" />
            <Link
              href="/explore"
              className="hover:text-white transition-colors"
            >
              Khám phá
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-white">Giỏ hàng</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold">Giỏ hàng của bạn</h1>
            {totalItems > 0 && (
              <span className="bg-white/20 text-white text-[13px] font-bold px-3 py-0.5 rounded-full animate-fade-in">
                {totalItems} sản phẩm
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8">
        {isLoading && items.length === 0 ? (
          <CartSkeleton />
        ) : items.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-[#e8ecf2] shadow-sm">
            <EmptyCart />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-[#64748b] font-medium">
                  <span className="font-bold text-[#0f172a]">
                    {items.length}
                  </span>{" "}
                  loại sản phẩm
                </p>
                <button
                  type="button"
                  onClick={() => setShowClearModal(true)}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-[#94a3b8] hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  Xóa tất cả
                </button>
              </div>

              {hasOutOfStock && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-[12px] px-4 py-3">
                  <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-amber-800 leading-relaxed">
                    Một số sản phẩm trong giỏ đã hết hàng và sẽ không được tính
                    vào đơn hàng. Vui lòng xóa chúng hoặc chờ hàng về.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onRemove={handleRemoveFromCart}
                    onUpdateQty={handleUpdateQuantity}
                    removing={removingIds.has(item.id)}
                    updating={updatingIds.has(item.id)}
                  />
                ))}
              </div>

              <Link
                href="/explore"
                className="inline-flex items-center gap-1.5 text-[13px] text-[#64748b] hover:text-[#0058be] transition-colors mt-1 w-fit font-medium"
              >
                <ArrowLeft className="size-3.5" />
                Tiếp tục mua sắm
              </Link>
            </div>

            <div className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-[88px]">
              <div className="bg-white rounded-[20px] border border-[#e8ecf2] shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[#0047a3] to-[#0058be] px-5 py-4">
                  <h2 className="text-[15px] font-bold text-white">
                    Tóm tắt đơn hàng
                  </h2>
                </div>

                <div className="p-5 flex flex-col gap-4">
                  <div className="flex flex-col gap-2.5">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3"
                      >
                        <span
                          className={`text-[12px] leading-snug line-clamp-2 flex-1 ${
                            item.productStock === 0
                              ? "text-[#94a3b8] line-through"
                              : "text-[#475569] font-medium"
                          }`}
                        >
                          {item.productName}
                          <span className="font-semibold ml-1 text-[#0f172a]">
                            ×{item.quantity}
                          </span>
                        </span>
                        <span
                          className={`text-[12px] font-bold shrink-0 ${
                            item.productStock === 0
                              ? "text-[#94a3b8]"
                              : "text-[#0f172a]"
                          }`}
                        >
                          {formatPrice(
                            (item.productDiscountPrice ?? item.productPrice) *
                              item.quantity,
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-[#f1f5f9]" />

                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#475569] font-semibold">
                      Tạm tính
                    </span>
                    <span className="text-[14px] font-bold text-[#0f172a]">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <p className="text-[13px] font-bold text-[#0f172a]">
                      Hình thức nhận hàng
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryType("SHOWROOM_PICKUP")}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-[12px] border-2 text-[12px] font-bold transition-all cursor-pointer ${
                          deliveryType === "SHOWROOM_PICKUP"
                            ? "border-[#0058be] bg-[#eff6ff] text-[#0058be]"
                            : "border-[#e2e8f0] text-[#475569] hover:border-[#0058be]/40"
                        }`}
                      >
                        <Store className="size-4" />
                        Tại showroom
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType("HOME_DELIVERY")}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-[12px] border-2 text-[12px] font-bold transition-all cursor-pointer ${
                          deliveryType === "HOME_DELIVERY"
                            ? "border-[#0058be] bg-[#eff6ff] text-[#0058be]"
                            : "border-[#e2e8f0] text-[#475569] hover:border-[#0058be]/40"
                        }`}
                      >
                        <Home className="size-4" />
                        Giao tận nhà
                      </button>
                    </div>

                    {deliveryType === "SHOWROOM_PICKUP" && (
                      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-[10px] px-3 py-2.5">
                        <MapPin className="size-3.5 text-[#0058be] shrink-0 mt-0.5" />
                        <p className="text-[11px] text-[#0058be] font-medium leading-relaxed">
                          123 Đường Láng, Đống Đa, Hà Nội
                          <br />
                          ĐT: 1800 1234 · T2–CN: 8h–21h
                        </p>
                      </div>
                    )}

                    {deliveryType === "HOME_DELIVERY" && (
                      <div className="flex flex-col gap-2 animate-fade-in">
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#94a3b8]" />
                          <input
                            type="text"
                            placeholder="Họ tên người nhận *"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-[13px] border border-[#e2e8f0] rounded-[10px] focus:outline-none focus:border-[#0058be] transition-colors"
                          />
                        </div>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#94a3b8]" />
                          <input
                            type="tel"
                            placeholder="Số điện thoại *"
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-[13px] border border-[#e2e8f0] rounded-[10px] focus:outline-none focus:border-[#0058be] transition-colors"
                          />
                        </div>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 size-3.5 text-[#94a3b8]" />
                          <textarea
                            placeholder="Địa chỉ giao hàng đầy đủ *"
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            rows={2}
                            className="w-full pl-8 pr-3 py-2 text-[13px] border border-[#e2e8f0] rounded-[10px] focus:outline-none focus:border-[#0058be] transition-colors resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-[#f1f5f9]" />

                  <div className="flex flex-col gap-3">
                    <p className="text-[13px] font-bold text-[#0f172a]">
                      Phương thức thanh toán
                    </p>
                    <div className="flex flex-col gap-2">
                      <label
                        onClick={() => setPaymentMethod("COD")}
                        className={`flex items-center gap-3 p-3 rounded-[12px] border transition-all duration-200 cursor-pointer ${
                          paymentMethod === "COD"
                            ? "border-[#0058be] bg-[#eff6ff]/40 shadow-sm"
                            : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                        }`}
                      >
                        <div className="relative flex items-center justify-center shrink-0">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === "COD"}
                            onChange={() => setPaymentMethod("COD")}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              paymentMethod === "COD"
                                ? "border-[#0058be] bg-[#0058be]"
                                : "border-[#cbd5e1] bg-white"
                            }`}
                          >
                            {paymentMethod === "COD" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                        </div>

                        <div
                          className={`p-1.5 rounded-lg ${
                            paymentMethod === "COD"
                              ? "bg-[#0058be]/10 text-[#0058be]"
                              : "bg-slate-50 text-slate-500"
                          }`}
                        >
                          <Coins className="size-4 shrink-0" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-[#0f172a] leading-tight">
                            Thanh toán khi nhận hàng (COD)
                          </p>
                          <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                            Thanh toán tiền mặt khi nhận hàng
                          </p>
                        </div>
                      </label>

                      <label
                        onClick={() => setPaymentMethod("VNPAY")}
                        className={`flex items-center gap-3 p-3 rounded-[12px] border transition-all duration-200 cursor-pointer ${
                          paymentMethod === "VNPAY"
                            ? "border-[#0058be] bg-[#eff6ff]/40 shadow-sm"
                            : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                        }`}
                      >
                        <div className="relative flex items-center justify-center shrink-0">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === "VNPAY"}
                            onChange={() => setPaymentMethod("VNPAY")}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              paymentMethod === "VNPAY"
                                ? "border-[#0058be] bg-[#0058be]"
                                : "border-[#cbd5e1] bg-white"
                            }`}
                          >
                            {paymentMethod === "VNPAY" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                        </div>

                        <div
                          className={`p-1.5 rounded-lg ${
                            paymentMethod === "VNPAY"
                              ? "bg-[#0058be]/10 text-[#0058be]"
                              : "bg-slate-50 text-slate-500"
                          }`}
                        >
                          <CreditCard className="size-4 shrink-0" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[12px] font-bold text-[#0f172a] leading-tight">
                              Ví điện tử / Thẻ VNPay QR
                            </p>
                            <span className="text-[8px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wider scale-90 origin-left select-none">
                              Online
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                            Thẻ ATM, Visa, QR Code...
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="h-px bg-[#f1f5f9]" />

                  <div className="flex flex-col gap-2">
                    <p className="text-[13px] font-bold text-[#0f172a] flex items-center gap-1.5">
                      <Ticket className="size-4 text-[#0058be]" />
                      Mã giảm giá
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Nhập mã giảm giá..."
                          value={couponCodeInput}
                          disabled={appliedCoupon !== null}
                          onChange={(e) =>
                            setCouponCodeInput(e.target.value.toUpperCase())
                          }
                          className={`w-full pl-3 pr-3 py-2 text-[13px] border rounded-[10px] focus:outline-none transition-colors uppercase font-mono font-bold ${
                            appliedCoupon
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : couponError
                                ? "border-red-500 focus:border-red-500 hover:border-red-500"
                                : "border-[#e2e8f0] focus:border-[#0058be]"
                          }`}
                        />
                      </div>
                      {appliedCoupon ? (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="px-3 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 py-2 rounded-[10px] text-[13px] font-semibold transition-colors cursor-pointer"
                        >
                          Gỡ bỏ
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={
                            isValidatingCoupon || !couponCodeInput.trim()
                          }
                          className="px-4 bg-[#f1f5f9] border border-[#cbd5e1] text-[#475569] hover:bg-[#cbd5e1] hover:text-[#0f172a] disabled:opacity-50 py-2 rounded-[10px] text-[13px] font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          {isValidatingCoupon ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            "Áp dụng"
                          )}
                        </button>
                      )}
                    </div>
                    {couponError && (
                      <p className="text-[11px] text-red-500 font-medium">
                        ⚠️ {couponError}
                      </p>
                    )}
                  </div>

                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-[13px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 rounded-[10px] px-3 py-2 animate-in slide-in-from-top-1 duration-200">
                      <span className="flex items-center gap-1">
                        <Ticket className="size-3.5" /> Giảm giá (
                        {appliedCoupon.code})
                      </span>
                      <span>-{formatPrice(couponDiscountAmount)}</span>
                    </div>
                  )}

                  <div className="h-px bg-[#f1f5f9]" />

                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-bold text-[#0f172a]">
                      Tổng cộng
                    </span>
                    <span className="text-[20px] font-black text-[#0058be]">
                      {formatPrice(finalTotalAmount)}
                    </span>
                  </div>

                  {hasOutOfStock && (
                    <p className="text-[11px] text-amber-600 bg-amber-50 rounded-[8px] px-3 py-2 font-medium">
                      * Sản phẩm hết hàng sẽ bị bỏ qua khi đặt hàng
                    </p>
                  )}

                  <button
                    id="place-order-btn"
                    type="button"
                    disabled={
                      placingOrder || availableItems.length === 0 || !isHydrated
                    }
                    onClick={handlePlaceOrder}
                    className="w-full h-[52px] flex items-center justify-center gap-2 bg-[#0058be] text-white text-[15px] font-bold rounded-[14px] shadow-[0_4px_16px_rgba(0,88,190,0.30)] hover:bg-[#0047a3] hover:shadow-[0_4px_24px_rgba(0,88,190,0.40)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {placingOrder ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Đang đặt hàng...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="size-4" />
                        Đặt hàng
                      </>
                    )}
                  </button>

                  {isHydrated && !user && (
                    <p className="text-[12px] text-[#94a3b8] text-center">
                      <Link
                        href="/auth/login"
                        className="text-[#0058be] hover:underline font-semibold"
                      >
                        Đăng nhập
                      </Link>{" "}
                      để tiếp tục đặt hàng
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 bg-white rounded-[16px] border border-[#e8ecf2] shadow-sm p-4 flex flex-col gap-3">
                {[
                  { icon: "🔒", text: "Thanh toán bảo mật 100%" },
                  { icon: "🚚", text: "Miễn phí vận chuyển toàn quốc" },
                  { icon: "↩️", text: "Đổi trả trong 7 ngày" },
                  { icon: "🎧", text: "Hỗ trợ 24/7" },
                ].map((badge) => (
                  <div key={badge.text} className="flex items-center gap-3">
                    <span className="text-[18px] shrink-0">{badge.icon}</span>
                    <span className="text-[12px] font-medium text-[#475569]">
                      {badge.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showClearModal && (
        <ClearCartModal
          onConfirm={onClearConfirm}
          onCancel={() => setShowClearModal(false)}
          loading={isClearing}
        />
      )}

      {orderSuccess && (
        <OrderSuccessModal
          orderId={orderSuccess.id}
          total={orderSuccess.total}
          deliveryType={orderSuccess.deliveryType}
          onClose={() => setOrderSuccess(null)}
        />
      )}
    </div>
  );
}
