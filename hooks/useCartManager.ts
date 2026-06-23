import { useState } from "react";
import { useCartStore } from "@/lib/store";
import toast from "react-hot-toast";

export function useCartManager() {
  const { items, isLoading, addItem, removeItem, updateQuantity, clearCart, fetchCart } = useCartStore();

  const [addingIds, setAddingIds] = useState<Set<number | string>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<number | string>>(new Set());
  const [updatingIds, setUpdatingIds] = useState<Set<number | string>>(new Set());
  const [isClearing, setIsClearing] = useState(false);

  const handleAddToCart = async (productId: number | string, quantity = 1, showToast = true) => {
    setAddingIds((prev) => {
      const next = new Set(prev);
      next.add(productId);
      return next;
    });
    try {
      await addItem(productId, quantity);
      if (showToast) {
        toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
      }
      return true;
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng", error);
      if (showToast) {
        toast.error("Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
      }
      return false;
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const handleRemoveFromCart = async (itemId: number | string) => {
    setRemovingIds((prev) => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
    try {
      await removeItem(itemId);
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
      return true;
    } catch (error) {
      console.error("Lỗi khi xóa khỏi giỏ hàng", error);
      toast.error("Không thể xóa sản phẩm. Vui lòng thử lại.");
      return false;
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleUpdateQuantity = async (itemId: number | string, qty: number) => {
    if (qty < 1) return false;
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
    try {
      await updateQuantity(itemId, qty);
      return true;
    } catch (error) {
      console.error("Lỗi khi cập nhật số lượng", error);
      toast.error("Không thể cập nhật số lượng.");
      return false;
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleClearCart = async () => {
    setIsClearing(true);
    try {
      await clearCart();
      toast.success("Đã xóa toàn bộ giỏ hàng");
      return true;
    } catch (error) {
      console.error("Lỗi khi xóa sạch giỏ hàng", error);
      toast.error("Không thể xóa giỏ hàng. Vui lòng thử lại.");
      return false;
    } finally {
      setIsClearing(false);
    }
  };

  return {
    items,
    isLoading,
    addingIds,
    removingIds,
    updatingIds,
    isClearing,
    fetchCart,
    handleAddToCart,
    handleRemoveFromCart,
    handleUpdateQuantity,
    handleClearCart,
  };
}
