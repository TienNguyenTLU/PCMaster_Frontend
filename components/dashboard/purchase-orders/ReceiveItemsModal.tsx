'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { adminAPI, Product, PurchaseOrder } from '@/lib/api';
import toast from 'react-hot-toast';

interface ReceiveItemsModalProps {
  po: PurchaseOrder;
  products: Product[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReceiveItemsModal({ po, products, onClose, onSuccess }: ReceiveItemsModalProps) {
  const [sellingPrices, setSellingPrices] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initialPrices: Record<number, number> = {};
    po.items.forEach(item => {
      const p = products.find(prod => Number(prod.id) === item.productId);
      initialPrices[item.productId] = p?.price || 0;
    });
    setSellingPrices(initialPrices);
  }, [po, products]);

  const handlePriceChange = (productId: number, price: string) => {
    const p = parseFloat(price) || 0;
    setSellingPrices(prev => ({ ...prev, [productId]: p }));
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await adminAPI.receivePurchaseOrder(po.id, sellingPrices);
      toast.success('Nhận hàng và cập nhật giá bán thành công!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Nhận hàng thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const getProduct = (id: number) => products.find(p => Number(p.id) === id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <h3 className="font-semibold text-[18px] text-[#0f172a]">Xác nhận nhận hàng & Cập nhật giá bán</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#f8fafc] rounded-[8px] cursor-pointer"><X className="size-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-[14px] text-[#64748b] mb-6">Vui lòng nhập giá bán mới cho các sản phẩm trong phiếu nhập này. Giá này sẽ được cập nhật trực tiếp vào cửa hàng.</p>
          
          <div className="flex flex-col gap-4">
            {po.items.map(item => {
              const p = getProduct(item.productId);
              return (
                <div key={item.id} className="flex items-center gap-4 p-4 border border-[#e2e8f0] rounded-[12px] bg-[#f8fafc]">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#0f172a] truncate">{p?.name || `Product #${item.productId}`}</p>
                    <p className="text-[12px] text-[#64748b]">Giá nhập: {new Intl.NumberFormat('vi-VN').format(item.importPrice)} x {item.quantity}</p>
                  </div>
                  <div className="w-[180px]">
                    <label className="text-[11px] font-bold text-[#94a3b8] uppercase mb-1 block">Giá bán mới (VND)</label>
                    <input
                      type="number"
                      value={sellingPrices[item.productId] || ''}
                      onChange={(e) => handlePriceChange(item.productId, e.target.value)}
                      className="w-full bg-white border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-[14px] focus:outline-none focus:border-[#0058be] font-medium"
                      placeholder="0"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="border-t border-[#e2e8f0] px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-[#e2e8f0] rounded-[8px] text-[14px] text-[#475569] hover:bg-[#f8fafc] cursor-pointer">Hủy</button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2 bg-[#10b981] text-white rounded-[8px] text-[14px] font-medium hover:bg-[#059669] disabled:opacity-60 flex items-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Xác nhận & Nhận hàng
          </button>
        </div>
      </div>
    </div>
  );
}
