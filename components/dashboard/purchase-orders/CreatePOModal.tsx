'use client';

import { useState } from 'react';
import { X, Package, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { adminAPI, Product, Supplier, Brand } from '@/lib/api';
import toast from 'react-hot-toast';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';

interface CartItem {
  product: Product;
  quantity: number;
  importPrice: number;
}

interface CreatePOModalProps {
  suppliers: Supplier[];
  allProducts: Product[];
  allBrands: Brand[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePOModal({ suppliers, allProducts, allBrands, onClose, onSuccess }: CreatePOModalProps) {
  const [step, setStep] = useState<'supplier' | 'items'>('supplier');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedBrands, setExpandedBrands] = useState<Set<number>>(new Set());

  const supplierProducts = selectedSupplier
    ? allProducts.filter(p => {
      const brandId = p.brand?.id ?? p.brandId;
      return selectedSupplier.brandIds?.some(bid => String(bid) === String(brandId));
    })
    : [];

  const productsByBrand = supplierProducts.reduce<Record<string, { brand: Brand | undefined; products: Product[] }>>(
    (acc, p) => {
      const bid = String(p.brand?.id ?? p.brandId ?? 'unknown');
      if (!acc[bid]) {
        const brand = allBrands.find(b => String(b.id) === bid);
        acc[bid] = { brand, products: [] };
      }
      acc[bid].products.push(p);
      return acc;
    },
    {}
  );

  const cartTotal = cart.reduce((sum, item) => sum + item.importPrice * item.quantity, 0);

  const updateQty = (product: Product, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(c => String(c.product.id) !== String(product.id)));
      return;
    }
    setCart(prev => {
      const existing = prev.find(c => String(c.product.id) === String(product.id));
      if (existing) return prev.map(c => String(c.product.id) === String(product.id) ? { ...c, quantity: qty } : c);
      return [...prev, { product, quantity: qty, importPrice: 0 }];
    });
  };

  const updateImportPrice = (productId: string | number, price: string) => {
    const p = parseFloat(price) || 0;
    setCart(prev => prev.map(c => String(c.product.id) === String(productId) ? { ...c, importPrice: p } : c));
  };

  const toggleBrand = (bid: number) => {
    setExpandedBrands(prev => {
      const next = new Set(prev);
      next.has(bid) ? next.delete(bid) : next.add(bid);
      return next;
    });
  };

  const generateDOCX = async () => {
    if (!selectedSupplier) return null;
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PHIẾU NHẬP HÀNG", bold: true, size: 32 })] }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: `Nhà cung cấp: `, bold: true }), new TextRun({ text: selectedSupplier.name })] }),
          new Paragraph({ children: [new TextRun({ text: `Địa chỉ: `, bold: true }), new TextRun({ text: selectedSupplier.address || "N/A" })] }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "STT" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Sản phẩm" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Số lượng" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Giá nhập" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Thành tiền" })] }),
                ],
              }),
              ...cart.map((item, index) => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: (index + 1).toString() })] }),
                  new TableCell({ children: [new Paragraph({ text: item.product.name })] }),
                  new TableCell({ children: [new Paragraph({ text: item.quantity.toString() })] }),
                  new TableCell({ children: [new Paragraph({ text: new Intl.NumberFormat('vi-VN').format(item.importPrice) })] }),
                  new TableCell({ children: [new Paragraph({ text: new Intl.NumberFormat('vi-VN').format(item.importPrice * item.quantity) })] }),
                ],
              })),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Tổng cộng: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartTotal)}`, bold: true })] }),
        ],
      }],
    });
    const blob = await Packer.toBlob(doc);
    return new File([blob], `PO_${selectedSupplier.name}.docx`, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  };

  const handleSubmit = async () => {
    if (!selectedSupplier || cart.length === 0) return;
    if (cart.some(c => c.importPrice <= 0)) {
      toast.error('Vui lòng nhập giá nhập cho tất cả sản phẩm.');
      return;
    }
    setLoading(true);
    try {
      const docFile = await generateDOCX();
      await adminAPI.createPurchaseOrder({
        supplierId: Number(selectedSupplier.id),
        items: cart.map(c => ({ productId: Number(c.product.id), quantity: c.quantity, importPrice: c.importPrice })),
      }, docFile || undefined);
      toast.success('Tạo phiếu thành công!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Lỗi tạo phiếu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <div>
            <h3 className="font-semibold text-[18px] text-[#0f172a]">Tạo phiếu nhập hàng mới</h3>
            <p className="text-[#94a3b8] text-[13px]">{step === 'supplier' ? 'Bước 1: Chọn nhà phân phối' : `Bước 2: Chọn sản phẩm từ ${selectedSupplier?.name}`}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#f8fafc] rounded-[8px] cursor-pointer"><X className="size-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {step === 'supplier' ? (
            <div className="grid grid-cols-1 gap-3">
              {suppliers.map(s => (
                <button key={s.id} onClick={() => { setSelectedSupplier(s); setStep('items'); }} className="flex items-start gap-4 p-4 border border-[#e2e8f0] rounded-[12px] hover:border-[#0058be] hover:bg-blue-50/30 transition-all text-left group cursor-pointer">
                  <div className="p-2 bg-[#e8f0fe] rounded-[8px] group-hover:bg-[#0058be] transition-colors"><Package className="size-5 text-[#0058be] group-hover:text-white" /></div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#0f172a] text-[15px]">{s.name}</p>
                    <p className="text-[#64748b] text-[13px] mt-0.5">{s.phone}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {Object.entries(productsByBrand).map(([bid, { brand, products }]) => (
                <div key={bid} className="border border-[#e2e8f0] rounded-[12px] overflow-hidden">
                  <button onClick={() => toggleBrand(Number(bid))} className="w-full flex items-center gap-3 px-4 py-3 bg-[#f8fafc] hover:bg-[#f1f5f9] cursor-pointer">
                    {expandedBrands.has(Number(bid)) ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    <span className="font-semibold">{brand?.name || `Brand #${bid}`}</span>
                  </button>
                  {expandedBrands.has(Number(bid)) && (
                    <div className="divide-y divide-[#f1f5f9]">
                      {products.map(p => {
                        const cartItem = cart.find(c => String(c.product.id) === String(p.id));
                        return (
                          <div key={p.id} className="flex flex-col gap-3 px-4 py-4">
                            <div className="flex items-center gap-3">
                              {p.thumbnailUrl && <img src={p.thumbnailUrl} alt={p.name} className="h-10 w-10 object-contain" />}
                              <div className="flex-1"><p className="text-[13px] font-medium truncate">{p.name}</p></div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => updateQty(p, (cartItem?.quantity ?? 1) - 1)} className="w-7 h-7 border rounded-full">−</button>
                                <span className="w-8 text-center font-medium">{cartItem?.quantity ?? 0}</span>
                                <button onClick={() => updateQty(p, (cartItem?.quantity ?? 0) + 1)} className="w-7 h-7 border rounded-full">+</button>
                              </div>
                            </div>
                            {cartItem && (
                              <div className="flex items-center gap-4 pl-13">
                                <div className="flex-1">
                                  <label className="text-[10px] font-bold text-[#94a3b8] uppercase block mb-1">Giá nhập mong muốn</label>
                                  <input type="number" value={cartItem.importPrice || ''} onChange={(e) => updateImportPrice(p.id, e.target.value)} className="w-full bg-[#f8fafc] border rounded-md px-3 py-1.5 text-[13px]" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {step === 'items' && (
          <div className="border-t border-[#e2e8f0] px-6 py-4 flex items-center justify-between">
            <p className="font-bold text-[#0058be] text-[16px]">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartTotal)}</p>
            <div className="flex gap-2">
              <button onClick={() => { setStep('supplier'); setCart([]); }} className="px-4 py-2 border rounded-[8px] text-[14px]">Quay lại</button>
              <button onClick={handleSubmit} disabled={loading || cart.length === 0} className="px-5 py-2 bg-[#0058be] text-white rounded-[8px] text-[14px] font-medium flex items-center gap-2">
                {loading && <Loader2 className="size-4 animate-spin" />} Tạo phiếu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
