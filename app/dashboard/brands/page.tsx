'use client'
import { Plus, Search, Filter, Edit, Trash2, X, Upload, Loader2 } from 'lucide-react';
import { adminAPI, Brand } from '@/lib/api';
import { CldImage } from 'next-cloudinary';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 8;
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError('');
      // Fetch all brands for frontend filtering (using a large size)
      const response = await adminAPI.getBrands(0, 1000);
      setBrands(response.content || []);
    } catch {
      setError('Lỗi khi tải danh sách thương hiệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBrands();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBrands.length / pageSize);
  const paginatedBrands = filteredBrands.slice(page * pageSize, (page + 1) * pageSize);



  const handleCreate = () => {
    setEditingBrand(null);
    setIsModalOpen(true);
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thương hiệu này?')) return;
    try {
      await adminAPI.deleteBrand(id);
      toast.success('Xóa thương hiệu thành công!');
      fetchBrands();
    } catch {
      toast.error('Xóa thương hiệu thất bại.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0f172a] text-[24px] font-semibold tracking-[-0.5px]">Thương hiệu</h2>
          <p className="text-[#64748b] text-[14px] mt-1">Quản lý các thương hiệu sản phẩm và thông tin của họ.</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-[#0058be] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium flex items-center gap-2 hover:bg-[#0047a3] transition-colors cursor-pointer"
        >
          <Plus className="size-4" />
          Thêm thương hiệu
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-[12px] border border-[#e2e8f0]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Tìm kiếm thương hiệu..."
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
          ) : filteredBrands.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-[#64748b]">
              Không tìm thấy thương hiệu nào.
            </div>
          ) : (
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-medium">
                <tr>
                  <th className="px-6 py-4 font-medium">Mã thương hiệu</th>
                  <th className="px-6 py-4 font-medium">Logo</th>
                  <th className="px-6 py-4 font-medium">Tên thương hiệu</th>
                  <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {paginatedBrands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="px-6 py-4 font-medium text-[#0f172a]">{brand.id}</td>
                    <td className="px-6 py-4">
                      {brand.logoUrl ? (
                        <div className="h-10 w-20 relative bg-white border border-[#e2e8f0] rounded-[8px] overflow-hidden flex items-center justify-center p-1">
                          <CldImage
                            src={brand.logoUrl}
                            alt={brand.name}
                            width={80}
                            height={40}
                            crop="fit"
                            className="object-contain w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-20 bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-400">Không logo</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#475569] font-medium">{brand.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 text-[#94a3b8]">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="p-1 hover:text-[#0058be] transition-colors cursor-pointer"
                        >
                          <Edit className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id)}
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
        {!loading && !error && filteredBrands.length > 0 && (
          <div className="px-6 py-4 border-t border-[#e2e8f0] flex items-center justify-between text-[13px] text-[#64748b]">
            <span>Hiển thị {page * pageSize + 1} đến {Math.min((page + 1) * pageSize, filteredBrands.length)} trong tổng số {filteredBrands.length} mục</span>
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

      {/* Brand Modal */}
      {isModalOpen && (
        <BrandFormModal
          brand={editingBrand}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchBrands();
          }}
        />
      )}
    </div>
  );
}

function BrandFormModal({ brand, onClose, onSuccess }: { brand: Brand | null, onClose: () => void, onSuccess: () => void }) {
  const [name, setName] = useState(brand?.name || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(brand?.logoUrl || '');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Tên thương hiệu không được để trống.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      if (brand) {
        await adminAPI.updateBrand(brand.id, formData);
        toast.success('Cập nhật thương hiệu thành công!');
      } else {
        await adminAPI.createBrand(formData);
        toast.success('Thêm thương hiệu thành công!');
      }
      onSuccess();
    } catch {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-md flex flex-col mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <h3 className="font-semibold text-[18px] text-[#0f172a]">{brand ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu mới'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#f8fafc] rounded-[8px] cursor-pointer"><X className="size-5 text-[#64748b]" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#475569]">Tên thương hiệu *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: ASUS, MSI, Samsung"
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#475569]">Logo</label>
            <div className="flex items-center gap-4">
              <div className="size-20 bg-[#f8fafc] border border-[#e2e8f0] rounded-[12px] flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  previewUrl.startsWith('blob:') ? (
                    <img src={previewUrl} alt="Preview" className="object-contain w-full h-full p-2" />
                  ) : (
                    <CldImage src={previewUrl} alt="Logo" width={80} height={80} className="object-contain w-full h-full p-2" />
                  )
                ) : (
                  <Upload className="size-6 text-[#94a3b8]" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  id="logo-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*"
                />
                <label
                  htmlFor="logo-upload"
                  className="px-4 py-1.5 border border-[#e2e8f0] rounded-[8px] text-[13px] font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors cursor-pointer inline-block"
                >
                  Thay đổi Logo
                </label>
                <p className="text-[11px] text-[#94a3b8] mt-2">Kích thước đề xuất: 200x100px. Tối đa 2MB.</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[#e2e8f0] rounded-[8px] text-[14px] text-[#475569] hover:bg-[#f8fafc]">Hủy</button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#0058be] text-white rounded-[8px] text-[14px] font-medium hover:bg-[#0047a3] disabled:opacity-60 flex items-center gap-2"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {brand ? 'Lưu thay đổi' : 'Tạo thương hiệu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
