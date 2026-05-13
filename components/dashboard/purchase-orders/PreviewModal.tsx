'use client';

import { X, FileText, Save } from 'lucide-react';
import { Product, Supplier, PurchaseOrder, authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface PreviewModalProps {
  po: PurchaseOrder;
  supplier: Supplier | undefined;
  products: Product[];
  onClose: () => void;
}

export default function PreviewModal({ po, supplier, products, onClose }: PreviewModalProps) {
  const getProduct = (id: number) => products.find(p => Number(p.id) === id);
  const createdDate = new Date(po.createdAt).toLocaleDateString('vi-VN');

  const handleDownload = () => {
    if (po.documentUrl) {
      const fullUrl = po.documentUrl.startsWith('http') ? po.documentUrl : `http://localhost:8080${po.documentUrl}`;
      window.open(fullUrl, '_blank');
    } else {
      toast.error('Không tìm thấy file đính kèm cho phiếu này.');
    }
  };

  const viewerUrl = po.documentUrl 
    ? (po.documentUrl.toLowerCase().includes('.docx') 
        ? (po.documentUrl.startsWith('http') ? po.documentUrl : `http://localhost:8080${po.documentUrl}`)
        : `${po.documentUrl.startsWith('http') ? po.documentUrl : `http://localhost:8080${po.documentUrl}`}${po.documentUrl.includes('?') ? '&' : '?'}ext=.docx`)
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#f1f5f9] rounded-[20px] shadow-2xl w-full max-w-4xl min-h-[90vh] flex flex-col my-auto overflow-hidden">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-[#e2e8f0] z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="size-6 text-[#0058be]" />
            </div>
            <div>
              <h3 className="font-bold text-[18px] text-[#0f172a]">Xem chi tiết phiếu nhập</h3>
              <p className="text-[12px] text-[#64748b]">Mã phiếu: PO-{String(po.id).padStart(4, '0')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {po.documentUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] rounded-xl text-[14px] font-semibold text-[#475569] hover:bg-[#f8fafc] transition-all shadow-sm cursor-pointer"
              >
                <Save className="size-4" />
                Tải xuống .docx
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-[#0058be] rounded-xl text-[14px] font-semibold text-white hover:bg-[#0047a3] transition-all shadow-md cursor-pointer"
            >
              <FileText className="size-4" />
              In phiếu
            </button>
            <div className="w-[1px] h-6 bg-[#e2e8f0] mx-2" />
            <button onClick={onClose} className="p-2 hover:bg-[#f1f5f9] rounded-full transition-colors cursor-pointer text-[#64748b]"><X className="size-6" /></button>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 bg-[#f1f5f9] overflow-hidden flex flex-col">
          {po.documentUrl ? (
            <div className="flex-1 w-full h-full relative bg-white">
              <iframe
                src={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(viewerUrl)}`}
                width="100%"
                height="100%"
                frameBorder="0"
                className="absolute inset-0"
                title="Document Preview"
              >
                Trình duyệt của bạn không hỗ trợ xem tài liệu trực tiếp.
              </iframe>
              <div className="absolute bottom-4 right-4 z-20">
                <a href={viewerUrl} target="_blank" rel="noopener noreferrer" className="bg-[#0058be] text-white px-4 py-2 rounded-lg shadow-lg text-[13px] font-bold hover:bg-[#0047a3] transition-all flex items-center gap-2">
                  <Save className="size-4" /> Mở trực tiếp
                </a>
              </div>
            </div>
          ) : (
            <div className="p-12 overflow-y-auto flex justify-center flex-1">
              <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-[0_0_40px_rgba(0,0,0,0.05)] p-[20mm] rounded-sm flex flex-col print:shadow-none print:p-0">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <h1 className="text-[28px] font-black text-[#0f172a] mb-2">PHIẾU NHẬP HÀNG</h1>
                    <p className="text-[#64748b] font-medium">Số phiếu: <span className="text-[#0f172a]">#{po.id}</span></p>
                    <p className="text-[#64748b] font-medium">Ngày lập: <span className="text-[#0f172a]">{createdDate}</span></p>
                  </div>
                  <div className="text-right">
                    <div className={`px-4 py-1.5 rounded-full text-[13px] font-bold inline-block ${po.status === 'RECEIVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {po.status === 'RECEIVED' ? 'ĐÃ NHẬN HÀNG' : 'CHỜ NHẬN HÀNG'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-12 mb-12 border-y border-[#f1f5f9] py-8">
                  <div>
                    <h4 className="text-[12px] font-black text-[#94a3b8] uppercase tracking-[1px] mb-4">Thông tin nhà cung cấp</h4>
                    <div className="space-y-2">
                      <p className="text-[16px] font-bold text-[#0f172a]">{supplier?.name ?? `Supplier #${po.supplierId}`}</p>
                      <p className="text-[14px] text-[#475569]">👤 {supplier?.contactPerson || 'N/A'}</p>
                      <p className="text-[14px] text-[#475569]">📞 {supplier?.phone || 'N/A'}</p>
                      <p className="text-[14px] text-[#475569]">📍 {supplier?.address || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h4 className="text-[12px] font-black text-[#94a3b8] uppercase tracking-[1px] mb-4">Thông tin cửa hàng</h4>
                    <div className="space-y-2">
                      <p className="text-[16px] font-bold text-[#0f172a]">PCMASTER Store</p>
                      <p className="text-[14px] text-[#475569]">Hệ thống build PC & Linh kiện</p>
                      <p className="text-[14px] text-[#475569]">pcmaster.support@gmail.com</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-[#0f172a]">
                        <th className="py-4 font-bold text-[#0f172a] text-[14px]">STT</th>
                        <th className="py-4 font-bold text-[#0f172a] text-[14px]">Sản phẩm</th>
                        <th className="py-4 text-right font-bold text-[#0f172a] text-[14px]">Số lượng</th>
                        <th className="py-4 text-right font-bold text-[#0f172a] text-[14px]">Giá nhập</th>
                        <th className="py-4 text-right font-bold text-[#0f172a] text-[14px]">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {po.items.map((item, index) => {
                        const p = getProduct(item.productId);
                        return (
                          <tr key={item.id}>
                            <td className="py-4 text-[#475569] font-medium">{index + 1}</td>
                            <td className="py-4">
                              <p className="font-bold text-[#0f172a]">{p?.name ?? `Product #${item.productId}`}</p>
                              <p className="text-[12px] text-[#94a3b8]">ID: {item.productId}</p>
                            </td>
                            <td className="py-4 text-right text-[#0f172a] font-medium">{item.quantity}</td>
                            <td className="py-4 text-right text-[#0f172a] font-medium">{new Intl.NumberFormat('vi-VN').format(item.importPrice)}</td>
                            <td className="py-4 text-right text-[#0f172a] font-bold">{new Intl.NumberFormat('vi-VN').format(item.importPrice * item.quantity)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-12 border-t-2 border-[#0f172a] pt-6">
                  <div className="flex justify-end gap-12">
                    <div className="text-right">
                      <p className="text-[14px] font-bold text-[#94a3b8] uppercase mb-2">Tổng số mặt hàng</p>
                      <p className="text-[24px] font-black text-[#0f172a]">{po.items.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-bold text-[#94a3b8] uppercase mb-2">Tổng giá trị phiếu</p>
                      <p className="text-[32px] font-black text-[#0058be]">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(po.totalAmount)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-[40mm] grid grid-cols-2 gap-12 text-center">
                  <div>
                    <p className="font-bold text-[#0f172a] mb-20 uppercase text-[12px] tracking-[1px]">Nhà cung cấp</p>
                    <p className="text-[#94a3b8] text-[13px]">(Ký & ghi rõ họ tên)</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#0f172a] mb-20 uppercase text-[12px] tracking-[1px]">Người lập phiếu</p>
                    <p className="text-[#94a3b8] text-[13px] font-bold">{authAPI.getStoredUser()?.username || 'Admin'}</p>
                    <p className="text-[#94a3b8] text-[13px]">(Ký & ghi rõ họ tên)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
