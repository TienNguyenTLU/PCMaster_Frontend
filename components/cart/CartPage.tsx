'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Package,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  X,
  Home,
  Store,
  MapPin,
  Phone,
  User,
  Ticket,
} from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { useAuthStore } from '@/lib/store';
import { orderAPI, OrderRequest, DeliveryType, couponAPI } from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + '₫';
}

function getImageSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `http://localhost:8080${url}`;
}

// ─── Order Success Modal ──────────────────────────────────────────────────────
function OrderSuccessModal({
  orderId,
  total,
  deliveryType,
  onClose,
}: {
  orderId: number;
  total: number;
  deliveryType: DeliveryType;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[420px] overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
            <CheckCircle2 className="size-9 text-white" />
          </div>
          <h2 className="text-[22px] font-bold text-white mb-1">Đặt hàng thành công!</h2>
          <p className="text-emerald-100 text-[14px]">Đơn hàng #{orderId} đang chờ xác nhận</p>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="bg-[#f8fafc] rounded-[12px] p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#475569] font-medium">Tổng thanh toán</span>
              <span className="text-[18px] font-bold text-[#0058be]">{formatPrice(total)}</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-[#64748b] font-medium">
              {deliveryType === 'HOME_DELIVERY' ? (
                <><Home className="size-3.5" /> Giao hàng tận nhà</>
              ) : (
                <><Store className="size-3.5" /> Nhận tại showroom – 123 Đường Láng, Hà Nội</>
              )}
            </div>
          </div>
          <p className="text-[13px] text-[#64748b] text-center leading-relaxed">
            Đơn hàng đang ở trạng thái <strong>chờ xác nhận</strong>. PCMaster sẽ liên hệ sớm nhất để xác nhận và giao hàng.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-[12px] border border-[#e2e8f0] text-[14px] font-semibold text-[#475569] hover:bg-[#f8fafc] transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <Link
              href="/explore"
              className="flex-1 py-2.5 rounded-[12px] bg-[#0058be] text-white text-[14px] font-semibold text-center hover:bg-[#0047a3] transition-colors"
              onClick={onClose}
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Clear Cart Confirm Modal ─────────────────────────────────────────────────
function ClearCartModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[20px] p-6 shadow-2xl w-full max-w-[380px] flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 rounded-full">
            <Trash2 className="size-5 text-red-500" />
          </div>
          <h3 className="text-[17px] font-bold text-[#0f172a]">Xóa toàn bộ giỏ hàng?</h3>
        </div>
        <p className="text-[13px] text-[#64748b] leading-relaxed">
          Tất cả sản phẩm trong giỏ hàng sẽ bị xóa. Hành động này không thể hoàn tác.
        </p>
        <div className="flex justify-end gap-3 pt-2 border-t border-[#f1f5f9]">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-[10px] border border-[#e2e8f0] text-[13px] font-semibold text-[#475569] hover:bg-[#f8fafc] transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 rounded-[10px] bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            Xóa tất cả
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Item Row ────────────────────────────────────────────────────────────
function CartItemRow({
  item,
  onRemove,
  onUpdateQty,
  removing,
  updating,
}: {
  item: {
    id: number;
    productId: number;
    productName: string;
    productThumbnailUrl: string | null;
    productPrice: number;
    productDiscountPrice?: number | null;
    productStock: number;
    quantity: number;
  };
  onRemove: (id: number) => void;
  onUpdateQty: (id: number, qty: number) => void;
  removing: boolean;
  updating: boolean;
}) {
  const [imgErr, setImgErr] = useState(false);
  const imgSrc = getImageSrc(item.productThumbnailUrl);
  const hasDiscount = item.productDiscountPrice !== null && item.productDiscountPrice !== undefined;
  const currentPrice = hasDiscount && item.productDiscountPrice ? item.productDiscountPrice : item.productPrice;
  const lineTotal = currentPrice * item.quantity;
  const isOutOfStock = item.productStock === 0;

  return (
    <div
      className={`flex gap-4 p-4 bg-white rounded-[16px] border transition-all duration-200 ${removing
          ? 'opacity-50 scale-95 border-red-200'
          : 'border-[#e8ecf2] hover:border-[#0058be]/30 hover:shadow-sm'
        }`}
    >
      {/* Product image */}
      <Link
        href={`/explore/${item.productId}`}
        className="shrink-0 w-[88px] h-[88px] bg-[#f7f9fb] rounded-[12px] flex items-center justify-center overflow-hidden border border-[#f1f5f9] hover:border-[#0058be]/40 transition-colors"
      >
        {imgSrc && !imgErr ? (
          <img
            src={imgSrc}
            alt={item.productName}
            className="w-full h-full object-contain p-2"
            onError={() => setImgErr(true)}
          />
        ) : (
          <Package className="size-8 text-[#cbd5e1]" />
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <Link
          href={`/explore/${item.productId}`}
          className="text-[14px] font-semibold text-[#0f172a] hover:text-[#0058be] transition-colors line-clamp-2 leading-snug"
        >
          {item.productName}
        </Link>

        {/* Stock warning */}
        {isOutOfStock && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-500">
            <AlertCircle className="size-3.5 shrink-0" />
            Sản phẩm đã hết hàng
          </div>
        )}
        {!isOutOfStock && item.productStock <= 5 && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600">
            <AlertCircle className="size-3.5 shrink-0" />
            Chỉ còn {item.productStock} sản phẩm
          </div>
        )}

        {/* Bottom row: qty controls + price */}
        <div className="flex items-center justify-between gap-3 mt-auto pt-1.5 flex-wrap">
          {/* Quantity stepper */}
          <div className="flex items-center gap-0 bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] overflow-hidden">
            <button
              type="button"
              disabled={updating || item.quantity <= 1 || isOutOfStock}
              onClick={() => onUpdateQty(item.id, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center text-[#475569] hover:bg-[#e2e8f0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Giảm"
            >
              <Minus className="size-3" />
            </button>
            <span className="w-9 h-8 flex items-center justify-center text-[13px] font-bold text-[#0f172a] border-x border-[#e2e8f0]">
              {updating ? <Loader2 className="size-3 animate-spin text-[#0058be]" /> : item.quantity}
            </span>
            <button
              type="button"
              disabled={updating || item.quantity >= item.productStock || isOutOfStock}
              onClick={() => onUpdateQty(item.id, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-[#475569] hover:bg-[#e2e8f0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Tăng"
            >
              <Plus className="size-3" />
            </button>
          </div>

          {/* Line price */}
          <div className="flex items-center gap-3">
            {hasDiscount ? (
              <div className="flex flex-col items-end">
                <span className="text-[15px] font-bold text-red-500">
                  {formatPrice(lineTotal)}
                </span>
                <span className="text-[11px] text-[#94a3b8] line-through font-medium">
                  {formatPrice(item.productPrice * item.quantity)}
                </span>
              </div>
            ) : (
              <span className="text-[15px] font-bold text-[#0058be]">
                {formatPrice(lineTotal)}
              </span>
            )}
            <button
              type="button"
              disabled={removing}
              onClick={() => onRemove(item.id)}
              className="p-1.5 rounded-[8px] text-[#94a3b8] hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Xóa sản phẩm"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty Cart ───────────────────────────────────────────────────────────────
function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-[#eff6ff] flex items-center justify-center">
          <ShoppingCart className="size-10 text-[#0058be]/50" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#f1f5f9] border-2 border-white flex items-center justify-center">
          <span className="text-[12px] font-bold text-[#94a3b8]">0</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[18px] font-bold text-[#0f172a] mb-1.5">Giỏ hàng trống</p>
        <p className="text-[14px] text-[#94a3b8] max-w-[280px]">
          Bạn chưa thêm sản phẩm nào. Hãy khám phá và chọn linh kiện phù hợp.
        </p>
      </div>
      <Link
        href="/explore"
        className="flex items-center gap-2 px-6 py-3 bg-[#0058be] text-white text-[14px] font-semibold rounded-[14px] shadow-[0_4px_16px_rgba(0,88,190,0.30)] hover:bg-[#0047a3] hover:shadow-[0_4px_20px_rgba(0,88,190,0.40)] transition-all duration-200"
      >
        <ShoppingBag className="size-4" />
        Khám phá ngay
      </Link>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CartSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 p-4 bg-white rounded-[16px] border border-[#e8ecf2]">
          <div className="w-[88px] h-[88px] bg-[#f1f5f9] rounded-[12px] shrink-0" />
          <div className="flex-1 flex flex-col gap-2.5 py-1">
            <div className="h-4 bg-[#e2e8f0] rounded w-3/4" />
            <div className="h-3 bg-[#e2e8f0] rounded w-1/2" />
            <div className="flex justify-between items-center mt-auto">
              <div className="h-8 bg-[#e2e8f0] rounded w-24" />
              <div className="h-5 bg-[#e2e8f0] rounded w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Cart Page ───────────────────────────────────────────────────────────
export default function CartPage() {
  const { user, isHydrated, hydrate } = useAuthStore();
  const { items, isLoading, fetchCart, removeItem, updateQuantity, clearCart } = useCartStore();
  const router = useRouter();

  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearingCart, setClearingCart] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ id: number; total: number; deliveryType: DeliveryType } | null>(null);

  // Delivery option state
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('SHOWROOM_PICKUP');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Hydrate auth + fetch cart on mount
  useEffect(() => {
    hydrate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isHydrated && user) {
      fetchCart();
    }
  }, [isHydrated, user, fetchCart]);

  // Computed totals
  const subtotal = items.reduce((sum, item) => {
    const price = item.productDiscountPrice !== null && item.productDiscountPrice !== undefined ? item.productDiscountPrice : item.productPrice;
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
    setCouponError('');
    try {
      const response = await couponAPI.validate(couponCodeInput.trim(), subtotal);
      setAppliedCoupon(response);
      toast.success(`Áp dụng mã ${response.code} thành công!`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Mã giảm giá không hợp lệ.';
      setCouponError(msg);
      toast.error(msg);
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
    toast.success('Đã gỡ mã giảm giá.');
  };

  async function handleRemove(itemId: number) {
    setRemovingIds((s) => new Set(s).add(itemId));
    try {
      await removeItem(itemId);
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch {
      toast.error('Không thể xóa sản phẩm. Vui lòng thử lại.');
    } finally {
      setRemovingIds((s) => {
        const next = new Set(s);
        next.delete(itemId);
        return next;
      });
    }
  }

  async function handleUpdateQty(itemId: number, qty: number) {
    if (qty < 1) return;
    setUpdatingIds((s) => new Set(s).add(itemId));
    try {
      await updateQuantity(itemId, qty);
    } catch {
      toast.error('Không thể cập nhật số lượng.');
    } finally {
      setUpdatingIds((s) => {
        const next = new Set(s);
        next.delete(itemId);
        return next;
      });
    }
  }

  async function handleClearCart() {
    setClearingCart(true);
    try {
      await clearCart();
      toast.success('Đã xóa toàn bộ giỏ hàng');
      setShowClearModal(false);
    } catch {
      toast.error('Không thể xóa giỏ hàng. Vui lòng thử lại.');
    } finally {
      setClearingCart(false);
    }
  }

  async function handlePlaceOrder() {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đặt hàng');
      router.push('/auth/login');
      return;
    }
    if (availableItems.length === 0) {
      toast.error('Không có sản phẩm nào có thể đặt hàng');
      return;
    }
    if (deliveryType === 'HOME_DELIVERY') {
      if (!recipientName.trim()) { toast.error('Vui lòng nhập họ tên người nhận'); return; }
      if (!recipientPhone.trim()) { toast.error('Vui lòng nhập số điện thoại'); return; }
      if (!shippingAddress.trim()) { toast.error('Vui lòng nhập địa chỉ giao hàng'); return; }
    }

    setPlacingOrder(true);
    try {
      const request: OrderRequest = {
        items: availableItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        deliveryType,
        recipientName: deliveryType === 'HOME_DELIVERY' ? recipientName.trim() : undefined,
        recipientPhone: deliveryType === 'HOME_DELIVERY' ? recipientPhone.trim() : undefined,
        shippingAddress: deliveryType === 'HOME_DELIVERY' ? shippingAddress.trim() : undefined,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      };
      const order = await orderAPI.create(request);
      await clearCart();
      setOrderSuccess({ id: order.id, total: Number(order.totalAmount), deliveryType });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Đặt hàng thất bại. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setPlacingOrder(false);
    }
  }

  // ── Unauthenticated state ──────────────────────────────────────────────────
  if (isHydrated && !user) {
    return (
      <div
        className="min-h-screen"
        style={{ background: 'linear-gradient(180deg, #f7f9fb 0%, #f0f4fa 100%)' }}
      >
        <div className="bg-gradient-to-r from-[#0047a3] via-[#0058be] to-[#2170e4] text-white py-10 px-8">
          <div className="max-w-[1000px] mx-auto">
            <div className="flex items-center gap-2 text-[12px] text-blue-200 mb-3">
              <Link href="/home" className="hover:text-white transition-colors">Trang chủ</Link>
              <ChevronRight className="size-3" />
              <span className="text-white">Giỏ hàng</span>
            </div>
            <h1 className="text-[28px] font-bold">Giỏ hàng của bạn</h1>
          </div>
        </div>
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-16 flex flex-col items-center gap-5 text-center">
          <div className="w-20 h-20 rounded-full bg-[#eff6ff] flex items-center justify-center">
            <ShoppingCart className="size-9 text-[#0058be]/50" />
          </div>
          <p className="text-[18px] font-bold text-[#0f172a]">Vui lòng đăng nhập</p>
          <p className="text-[14px] text-[#94a3b8]">Bạn cần đăng nhập để xem giỏ hàng.</p>
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
      style={{ background: 'linear-gradient(180deg, #f7f9fb 0%, #f0f4fa 100%)' }}
    >
      {/* ── Hero banner ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#0047a3] via-[#0058be] to-[#2170e4] text-white py-10 px-8">
        <div className="max-w-[1000px] mx-auto">
          <div className="flex items-center gap-2 text-[12px] text-blue-200 mb-3">
            <Link href="/home" className="hover:text-white transition-colors">Trang chủ</Link>
            <ChevronRight className="size-3" />
            <Link href="/explore" className="hover:text-white transition-colors">Khám phá</Link>
            <ChevronRight className="size-3" />
            <span className="text-white">Giỏ hàng</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold">Giỏ hàng của bạn</h1>
            {totalItems > 0 && (
              <span className="bg-white/20 text-white text-[13px] font-bold px-3 py-0.5 rounded-full">
                {totalItems} sản phẩm
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8">
        {/* Loading */}
        {(isLoading && items.length === 0) ? (
          <CartSkeleton />
        ) : items.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-[#e8ecf2] shadow-sm">
            <EmptyCart />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* ── Left: Cart items ─────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-[#64748b] font-medium">
                  <span className="font-bold text-[#0f172a]">{items.length}</span> loại sản phẩm
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

              {/* Out-of-stock notice */}
              {hasOutOfStock && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-[12px] px-4 py-3">
                  <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-amber-800 leading-relaxed">
                    Một số sản phẩm trong giỏ đã hết hàng và sẽ không được tính vào đơn hàng.
                    Vui lòng xóa chúng hoặc chờ hàng về.
                  </p>
                </div>
              )}

              {/* Items */}
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onRemove={handleRemove}
                    onUpdateQty={handleUpdateQty}
                    removing={removingIds.has(item.id)}
                    updating={updatingIds.has(item.id)}
                  />
                ))}
              </div>

              {/* Continue shopping */}
              <Link
                href="/explore"
                className="inline-flex items-center gap-1.5 text-[13px] text-[#64748b] hover:text-[#0058be] transition-colors mt-1 w-fit"
              >
                <ArrowLeft className="size-3.5" />
                Tiếp tục mua sắm
              </Link>
            </div>

            {/* ── Right: Order summary ─────────────────────────────────────────── */}
            <div className="w-full lg:w-[320px] shrink-0 sticky top-[88px]">
              <div className="bg-white rounded-[20px] border border-[#e8ecf2] shadow-sm overflow-hidden">
                {/* Summary header */}
                <div className="bg-gradient-to-r from-[#0047a3] to-[#0058be] px-5 py-4">
                  <h2 className="text-[15px] font-bold text-white">Tóm tắt đơn hàng</h2>
                </div>

                <div className="p-5 flex flex-col gap-4">
                  {/* Item breakdown */}
                  <div className="flex flex-col gap-2.5">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3">
                        <span
                          className={`text-[12px] leading-snug line-clamp-2 flex-1 ${item.productStock === 0 ? 'text-[#94a3b8] line-through' : 'text-[#475569]'
                            }`}
                        >
                          {item.productName}
                          <span className="font-semibold ml-1">×{item.quantity}</span>
                        </span>
                        <span
                          className={`text-[12px] font-semibold shrink-0 ${item.productStock === 0 ? 'text-[#94a3b8]' : 'text-[#0f172a]'
                            }`}
                        >
                          {formatPrice(item.productPrice * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-[#f1f5f9]" />

                  {/* Subtotal */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#475569] font-medium">Tạm tính</span>
                    <span className="text-[14px] font-bold text-[#0f172a]">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  {/* Delivery Options */}
                  <div className="flex flex-col gap-3">
                    <p className="text-[13px] font-bold text-[#0f172a]">Hình thức nhận hàng</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('SHOWROOM_PICKUP')}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-[12px] border-2 text-[12px] font-semibold transition-all cursor-pointer ${deliveryType === 'SHOWROOM_PICKUP'
                            ? 'border-[#0058be] bg-[#eff6ff] text-[#0058be]'
                            : 'border-[#e2e8f0] text-[#475569] hover:border-[#0058be]/40'
                          }`}
                      >
                        <Store className="size-4" />
                        Tại showroom
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType('HOME_DELIVERY')}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-[12px] border-2 text-[12px] font-semibold transition-all cursor-pointer ${deliveryType === 'HOME_DELIVERY'
                            ? 'border-[#0058be] bg-[#eff6ff] text-[#0058be]'
                            : 'border-[#e2e8f0] text-[#475569] hover:border-[#0058be]/40'
                          }`}
                      >
                        <Home className="size-4" />
                        Giao tận nhà
                      </button>
                    </div>

                    {/* Showroom address */}
                    {deliveryType === 'SHOWROOM_PICKUP' && (
                      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-[10px] px-3 py-2.5">
                        <MapPin className="size-3.5 text-[#0058be] shrink-0 mt-0.5" />
                        <p className="text-[11px] text-[#0058be] font-medium leading-relaxed">
                          123 Đường Láng, Đống Đa, Hà Nội<br />
                          ĐT: 1800 1234 · T2–CN: 8h–21h
                        </p>
                      </div>
                    )}

                    {/* Home delivery form */}
                    {deliveryType === 'HOME_DELIVERY' && (
                      <div className="flex flex-col gap-2">
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#94a3b8]" />
                          <input
                            type="text"
                            placeholder="Họ tên người nhận *"
                            value={recipientName}
                            onChange={e => setRecipientName(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-[13px] border border-[#e2e8f0] rounded-[10px] focus:outline-none focus:border-[#0058be] transition-colors"
                          />
                        </div>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#94a3b8]" />
                          <input
                            type="tel"
                            placeholder="Số điện thoại *"
                            value={recipientPhone}
                            onChange={e => setRecipientPhone(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-[13px] border border-[#e2e8f0] rounded-[10px] focus:outline-none focus:border-[#0058be] transition-colors"
                          />
                        </div>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 size-3.5 text-[#94a3b8]" />
                          <textarea
                            placeholder="Địa chỉ giao hàng đầy đủ *"
                            value={shippingAddress}
                            onChange={e => setShippingAddress(e.target.value)}
                            rows={2}
                            className="w-full pl-8 pr-3 py-2 text-[13px] border border-[#e2e8f0] rounded-[10px] focus:outline-none focus:border-[#0058be] transition-colors resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-[#f1f5f9]" />

                  {/* Coupon validation box */}
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
                          onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                          className={`w-full pl-3 pr-3 py-2 text-[13px] border rounded-[10px] focus:outline-none transition-colors uppercase font-mono font-bold ${
                            appliedCoupon
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : couponError
                                ? 'border-red-500 focus:border-red-500 hover:border-red-500'
                                : 'border-[#e2e8f0] focus:border-[#0058be]'
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
                          disabled={isValidatingCoupon || !couponCodeInput.trim()}
                          className="px-4 bg-[#f1f5f9] border border-[#cbd5e1] text-[#475569] hover:bg-[#cbd5e1] hover:text-[#0f172a] disabled:opacity-50 py-2 rounded-[10px] text-[13px] font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          {isValidatingCoupon ? <Loader2 className="size-3.5 animate-spin" /> : 'Áp dụng'}
                        </button>
                      )}
                    </div>
                    {couponError && <p className="text-[11px] text-red-500 font-medium">⚠️ {couponError}</p>}
                  </div>

                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-[13px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 rounded-[10px] px-3 py-2 animate-in slide-in-from-top-1 duration-200">
                      <span className="flex items-center gap-1"><Ticket className="size-3.5" /> Giảm giá ({appliedCoupon.code})</span>
                      <span>-{formatPrice(couponDiscountAmount)}</span>
                    </div>
                  )}

                  <div className="h-px bg-[#f1f5f9]" />

                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-bold text-[#0f172a]">Tổng cộng</span>
                    <span className="text-[20px] font-bold text-[#0058be]">
                      {formatPrice(finalTotalAmount)}
                    </span>
                  </div>

                  {/* Out-of-stock note */}
                  {hasOutOfStock && (
                    <p className="text-[11px] text-amber-600 bg-amber-50 rounded-[8px] px-3 py-2 font-medium">
                      * Sản phẩm hết hàng sẽ bị bỏ qua khi đặt hàng
                    </p>
                  )}

                  {/* Place order button */}
                  <button
                    id="place-order-btn"
                    type="button"
                    disabled={placingOrder || availableItems.length === 0 || !isHydrated}
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

                  {/* Login prompt for guest */}
                  {isHydrated && !user && (
                    <p className="text-[12px] text-[#94a3b8] text-center">
                      <Link href="/auth/login" className="text-[#0058be] hover:underline font-semibold">
                        Đăng nhập
                      </Link>{' '}
                      để tiếp tục đặt hàng
                    </p>
                  )}
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-4 bg-white rounded-[16px] border border-[#e8ecf2] shadow-sm p-4 flex flex-col gap-3">
                {[
                  { icon: '🔒', text: 'Thanh toán bảo mật 100%' },
                  { icon: '🚚', text: 'Miễn phí vận chuyển toàn quốc' },
                  { icon: '↩️', text: 'Đổi trả trong 7 ngày' },
                  { icon: '🎧', text: 'Hỗ trợ 24/7' },
                ].map((badge) => (
                  <div key={badge.text} className="flex items-center gap-3">
                    <span className="text-[18px] shrink-0">{badge.icon}</span>
                    <span className="text-[12px] font-medium text-[#475569]">{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────────── */}
      {showClearModal && (
        <ClearCartModal
          onConfirm={handleClearCart}
          onCancel={() => setShowClearModal(false)}
          loading={clearingCart}
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
