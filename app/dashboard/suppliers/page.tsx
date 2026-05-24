'use client'
import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, X, Loader2, Check } from 'lucide-react';
import { adminAPI, Supplier, Brand } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getSuppliers(0, 1000);
      setSuppliers(response.content || []);
    } catch {
      setError('Lỗi khi tải danh sách nhà cung cấp. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await adminAPI.getBrands(0, 100);
      setAllBrands(response.content || []);
    } catch {
      console.error('Failed to fetch brands');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuppliers();
      fetchBrands();
    }, 0);
    return () => clearTimeout(timer);
  }, []);



  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.phone && s.phone.includes(searchQuery))
  );

  const totalPages = Math.ceil(filteredSuppliers.length / pageSize);
  const paginatedSuppliers = filteredSuppliers.slice(page * pageSize, (page + 1) * pageSize);



  const handleCreate = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) return;
    try {
      await adminAPI.deleteSupplier(id);
      toast.success('Xóa nhà cung cấp thành công!');
      fetchSuppliers();
    } catch {
      toast.error('Xóa nhà cung cấp thất bại.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0f172a] text-[24px] font-semibold tracking-[-0.5px]">Nhà cung cấp</h2>
          <p className="text-[#64748b] text-[14px] mt-1">Quản lý quan hệ với nhà cung cấp và thông tin liên hệ.</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-[#0058be] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium flex items-center gap-2 hover:bg-[#0047a3] transition-colors cursor-pointer"
        >
          <Plus className="size-4" />
          Thêm nhà cung cấp
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-[12px] border border-[#e2e8f0]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Tìm kiếm nhà cung cấp..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-9 pr-4 py-1.5 text-[14px] focus:outline-none focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] transition-all w-[300px]"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 border border-[#e2e8f0] rounded-[8px] text-[#475569] text-[14px] hover:bg-[#f8fafc] transition-colors cursor-pointer">
            <Filter className="size-4" />
            Bộ lọc
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white border border-[#e2e8f0] rounded-[12px] overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-[300px] text-[#64748b]">
              <Loader2 className="size-5 animate-spin mr-2" /> Đang tải dữ liệu...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[300px] text-red-500">
              {error}
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-[#64748b]">
              Không tìm thấy nhà cung cấp nào.
            </div>
          ) : (
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-medium">
                <tr>
                  <th className="px-6 py-4 font-medium">Mã nhà cung cấp</th>
                  <th className="px-6 py-4 font-medium">Tên nhà cung cấp</th>
                  <th className="px-6 py-4 font-medium">Thương hiệu phân phối</th>
                  <th className="px-6 py-4 font-medium">Số điện thoại</th>
                  <th className="px-6 py-4 font-medium">Người liên hệ</th>
                  <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {paginatedSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="px-6 py-4 font-medium text-[#0f172a]">{supplier.id}</td>
                    <td className="px-6 py-4 text-[#475569]">
                      <div className="font-medium text-[#0f172a]">{supplier.name}</div>
                      <div className="text-[12px] text-[#94a3b8]">{supplier.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {supplier.brandIds && supplier.brandIds.length > 0 ? (
                          supplier.brandIds.map(bid => {
                            const b = allBrands.find(brand => Number(brand.id) === Number(bid));
                            return b ? (
                              <span key={bid} className="px-2 py-0.5 bg-blue-50 text-[#0058be] text-[11px] font-medium rounded-full border border-blue-100">
                                {b.name}
                              </span>
                            ) : null;
                          })
                        ) : <span className="text-[#94a3b8]">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#475569]">{supplier.phone || '-'}</td>
                    <td className="px-6 py-4 text-[#475569]">{supplier.contactPerson || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-[#94a3b8]">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="p-1 hover:text-[#0058be] transition-colors cursor-pointer"
                        >
                          <Edit className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="p-1 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && filteredSuppliers.length > 0 && (
          <div className="px-6 py-4 border-t border-[#e2e8f0] flex items-center justify-between text-[13px] text-[#64748b]">
            <span>Hiển thị {page * pageSize + 1} đến {Math.min((page + 1) * pageSize, filteredSuppliers.length)} trong tổng số {filteredSuppliers.length} mục</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 border border-[#e2e8f0] rounded-[6px] hover:bg-[#f8fafc] disabled:opacity-50 cursor-pointer"
              >
                Trước
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setPage(i)}
                  className={`px-3 py-1 border rounded-[6px] transition-colors ${page === i ? 'bg-[#0058be] text-white border-[#0058be]' : 'border-[#e2e8f0] hover:bg-[#f8fafc] text-[#64748b]'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 border border-[#e2e8f0] rounded-[6px] hover:bg-[#f8fafc] disabled:opacity-50 cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <SupplierFormModal
          supplier={editingSupplier}
          allBrands={allBrands}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchSuppliers();
          }}
        />
      )}
    </div>
  );
}

function SupplierFormModal({ supplier, allBrands, onClose, onSuccess }: { supplier: Supplier | null, allBrands: Brand[], onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    contactPerson: supplier?.contactPerson || '',
    brandIds: supplier?.brandIds?.map(id => Number(id)) || [] as number[]
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên nhà cung cấp không được để trống.';
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Email không đúng định dạng.';
      }
    }

    if (formData.phone.trim()) {
      const phoneRegex = /^[0-9+()#.\s-]{8,20}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Số điện thoại không hợp lệ.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      if (supplier) {
        await adminAPI.updateSupplier(supplier.id, formData);
        toast.success('Cập nhật nhà cung cấp thành công!');
      } else {
        await adminAPI.createSupplier(formData);
        toast.success('Thêm nhà cung cấp thành công!');
      }
      onSuccess();
    } catch {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const toggleBrand = (id: number) => {
    setFormData(prev => ({
      ...prev,
      brandIds: prev.brandIds.includes(id)
        ? prev.brandIds.filter(bid => bid !== id)
        : [...prev.brandIds, id]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-2xl flex flex-col my-auto overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <h3 className="font-semibold text-[18px] text-[#0f172a]">{supplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#f8fafc] rounded-[8px] cursor-pointer"><X className="size-5 text-[#64748b]" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-[13px] font-semibold text-[#475569]">Tên nhà cung cấp *</label>
              {errors.name && (
                <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  ⚠️ {errors.name}
                </span>
              )}
              <input
                type="text"
                value={formData.name}
                onChange={e => {
                  setFormData({ ...formData, name: e.target.value });
                  setErrors(prev => ({ ...prev, name: '' }));
                }}
                placeholder="Tên nhà cung cấp"
                className={`bg-[#f8fafc] border rounded-[8px] px-4 py-2 text-[14px] focus:outline-none transition-all ${
                  errors.name ? 'border-red-500 focus:border-red-500' : 'border-[#e2e8f0] focus:border-[#0058be]'
                }`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#475569]">Email</label>
              {errors.email && (
                <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  ⚠️ {errors.email}
                </span>
              )}
              <input
                type="email"
                value={formData.email}
                onChange={e => {
                  setFormData({ ...formData, email: e.target.value });
                  setErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="email@example.com"
                className={`bg-[#f8fafc] border rounded-[8px] px-4 py-2 text-[14px] focus:outline-none transition-all ${
                  errors.email ? 'border-red-500 focus:border-red-500' : 'border-[#e2e8f0] focus:border-[#0058be]'
                }`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#475569]">Phone</label>
              {errors.phone && (
                <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  ⚠️ {errors.phone}
                </span>
              )}
              <input
                type="text"
                value={formData.phone}
                onChange={e => {
                  setFormData({ ...formData, phone: e.target.value });
                  setErrors(prev => ({ ...prev, phone: '' }));
                }}
                placeholder="Số điện thoại"
                className={`bg-[#f8fafc] border rounded-[8px] px-4 py-2 text-[14px] focus:outline-none transition-all ${
                  errors.phone ? 'border-red-500 focus:border-red-500' : 'border-[#e2e8f0] focus:border-[#0058be]'
                }`}
              />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-[13px] font-semibold text-[#475569]">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Địa chỉ"
                className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be]"
              />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-[13px] font-semibold text-[#475569]">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Người liên hệ"
                className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[13px] font-semibold text-[#475569]">Thương hiệu phân phối</label>
            <div className="grid grid-cols-3 gap-2">
              {allBrands.map(brand => (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => toggleBrand(Number(brand.id))}
                  className={`flex items-center gap-2 p-2 rounded-[8px] border text-[13px] transition-all cursor-pointer ${formData.brandIds.includes(Number(brand.id))
                      ? 'bg-blue-50 border-[#0058be] text-[#0058be]'
                      : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'
                    }`}
                >
                  <div className={`size-4 rounded flex items-center justify-center border ${formData.brandIds.includes(Number(brand.id)) ? 'bg-[#0058be] border-[#0058be]' : 'bg-white border-[#cbd5e1]'
                    }`}>
                    {formData.brandIds.includes(Number(brand.id)) && <Check className="size-3 text-white" />}
                  </div>
                  <span className="truncate">{brand.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t pt-5">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[#e2e8f0] rounded-[8px] text-[14px] text-[#475569] hover:bg-[#f8fafc]">Hủy</button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#0058be] text-white rounded-[8px] text-[14px] font-medium hover:bg-[#0047a3] disabled:opacity-60 flex items-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {supplier ? 'Lưu thay đổi' : 'Tạo nhà cung cấp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
