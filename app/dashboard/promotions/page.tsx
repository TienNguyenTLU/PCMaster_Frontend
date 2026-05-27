'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, Edit, Trash2, X, Loader2, Check, Calendar, Sparkles, Image } from 'lucide-react';
import { adminAPI, Product, Promotion, PromotionRequest, Category } from '@/lib/api';
import toast from 'react-hot-toast';
import axiosInstance from '@/lib/axiosInstance';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getPromotions();
      setPromotions(response || []);
    } catch {
      setError('Lỗi khi tải danh sách khuyến mãi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await adminAPI.getProducts(0, 1000);
      setAllProducts(response.content || []);
    } catch {
      console.error('Failed to fetch system products');
    }
  };

  useEffect(() => {
    fetchPromotions();
    fetchAllProducts();
  }, []);

  const filteredPromotions = promotions.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingPromotion(null);
    setIsModalOpen(true);
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chương trình khuyến mãi này?')) return;
    try {
      await adminAPI.deletePromotion(id);
      toast.success('Xóa khuyến mãi thành công!');
      fetchPromotions();
    } catch {
      toast.error('Xóa khuyến mãi thất bại.');
    }
  };

  const getStatusLabel = (p: Promotion) => {
    const now = new Date();
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);

    if (!p.active) return <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-bold rounded-full border border-gray-200">Đã tắt</span>;
    if (now < start) return <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[11px] font-bold rounded-full border border-blue-100">Sắp diễn ra</span>;
    if (now > end) return <span className="px-2.5 py-0.5 bg-red-50 text-red-600 text-[11px] font-bold rounded-full border border-red-100">Đã kết thúc</span>;
    return <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-full border border-emerald-100">Đang diễn ra</span>;
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0f172a] text-[24px] font-semibold tracking-[-0.5px] flex items-center gap-2">
            <Sparkles className="size-6 text-[#0058be]" />
            Khuyến mãi giảm giá
          </h2>
          <p className="text-[#64748b] text-[14px] mt-1">Tạo trang khuyến mãi hạ cánh và gán chiết khấu giảm giá cho sản phẩm.</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-[#0058be] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium flex items-center gap-2 hover:bg-[#0047a3] transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="size-4" />
          Tạo khuyến mãi mới
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-[12px] border border-[#e2e8f0]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Tìm kiếm chương trình..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-9 pr-4 py-1.5 text-[14px] focus:outline-none focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] transition-all w-[300px]"
            />
          </div>
        </div>
      </div>

      {/* Grid view of Promotions */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] text-[#64748b] bg-white rounded-[12px] border border-[#e2e8f0]">
          <Loader2 className="size-6 animate-spin mr-2 text-[#0058be]" /> Đang tải dữ liệu...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-[300px] text-red-500 bg-white rounded-[12px] border border-[#e2e8f0]">
          {error}
        </div>
      ) : filteredPromotions.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-[#64748b] bg-white rounded-[12px] border border-[#e2e8f0] gap-2">
          <Sparkles className="size-8 text-[#94a3b8] opacity-50" />
          Chưa có chương trình khuyến mãi nào được tạo.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromotions.map((p) => {
            const bannerSrc = p.bannerUrl?.startsWith('http')
              ? p.bannerUrl
              : p.bannerUrl
                ? `http://localhost:8080${p.bannerUrl}`
                : null;

            return (
              <div key={p.id} className="bg-white rounded-[16px] border border-[#e2e8f0] overflow-hidden flex flex-col hover:shadow-lg hover:border-[#0058be]/30 transition-all duration-300 group">
                {/* Banner Area */}
                <div className="h-40 bg-[#f8fafc] relative overflow-hidden flex items-center justify-center border-b border-[#e2e8f0]">
                  {bannerSrc ? (
                    <img src={bannerSrc} alt={p.name} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-[#cbd5e1]">
                      <Image className="size-8" />
                      <span className="text-[11px] font-medium">Chưa có banner</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">{getStatusLabel(p)}</div>
                  <div className="absolute bottom-3 left-3 bg-[#0058be] text-white text-[18px] font-bold px-3 py-1 rounded-[10px] shadow-sm flex items-baseline gap-0.5">
                    -{p.discountPercent}
                    <span className="text-[11px] font-bold">%</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <h3 className="font-semibold text-[16px] text-[#0f172a] line-clamp-1 group-hover:text-[#0058be] transition-colors">{p.name}</h3>
                  <div className="text-[13px] text-[#64748b] flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      <span>{new Date(p.startDate).toLocaleDateString('vi-VN')} - {new Date(p.endDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-emerald-500" />
                      <span>Đang áp dụng: <strong className="text-[#0f172a]">{p.productIds?.length || 0} sản phẩm</strong></span>
                    </div>
                  </div>
                  <p className="text-[12px] text-[#94a3b8] line-clamp-2 mt-1">{p.description || 'Không có mô tả cho chương trình này.'}</p>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 border-t pt-4 mt-auto">
                    <button
                      onClick={() => handleEdit(p)}
                      className="px-3 py-1.5 border border-[#e2e8f0] text-[13px] font-semibold text-[#475569] hover:bg-[#f8fafc] rounded-[8px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit className="size-3.5" /> Chỉnh sửa
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="px-3 py-1.5 border border-red-100 hover:bg-red-50 text-[13px] font-semibold text-red-600 rounded-[8px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3.5" /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <PromotionFormModal
          promotion={editingPromotion}
          allProducts={allProducts}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchPromotions();
          }}
        />
      )}
    </div>
  );
}

function PromotionFormModal({
  promotion,
  allProducts,
  onClose,
  onSuccess
}: {
  promotion: Promotion | null;
  allProducts: Product[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: promotion?.name || '',
    slug: promotion?.slug || '',
    description: promotion?.description || '',
    bannerUrl: promotion?.bannerUrl || '',
    discountPercent: promotion?.discountPercent || 10,
    startDate: promotion?.startDate ? promotion.startDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
    endDate: promotion?.endDate ? promotion.endDate.substring(0, 10) : new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
    active: promotion?.active !== false,
    productIds: promotion?.productIds || [] as number[]
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch categories for product filtering
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await adminAPI.getCategories(0, 200);
        setCategories(response.content || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Auto-generate slug from name
  useEffect(() => {
    if (!promotion) {
      const generated = formData.name
        .toLowerCase()
        .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
        .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
        .replace(/ì|í|ị|ỉ|ĩ/g, 'i')
        .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
        .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
        .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setFormData(prev => ({ ...prev, slug: generated }));
    }
  }, [formData.name, promotion]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const response = await axiosInstance.post<{ url: string }>('/api/admin/media/upload?folder=PCMAster_Storage/Banners', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, bannerUrl: response.data.url }));
      toast.success('Tải banner lên thành công!');
    } catch {
      toast.error('Tải banner lên thất bại.');
    } finally {
      setUploading(false);
    }
  };

  const handleProductToggle = (id: number) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.includes(id)
        ? prev.productIds.filter(pid => pid !== id)
        : [...prev.productIds, id]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Tên chương trình không được để trống.';
    if (!formData.slug.trim()) newErrors.slug = 'Slug không được để trống.';
    if (formData.discountPercent < 0 || formData.discountPercent > 100) newErrors.discountPercent = 'Chiết khấu phải từ 0% đến 100%';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const payload: PromotionRequest = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        bannerUrl: formData.bannerUrl,
        discountPercent: Number(formData.discountPercent),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        active: formData.active,
        productIds: formData.productIds
      };

      if (promotion) {
        await adminAPI.updatePromotion(promotion.id, payload);
        toast.success('Cập nhật khuyến mãi thành công!');
      } else {
        await adminAPI.createPromotion(payload);
        toast.success('Tạo chương trình khuyến mãi mới thành công!');
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  // Filter by stock > 0, or already selected in this promotion
  const stockFilteredProducts = allProducts.filter(p =>
    p.stock > 0 || formData.productIds.includes(Number(p.id))
  );

  // Filter by category and search query
  const filteredProducts = stockFilteredProducts.filter(p => {
    const matchesCategory = !selectedCategory || String(p.categoryId) === String(selectedCategory);
    const matchesQuery = p.name.toLowerCase().includes(searchProductQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-4xl flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <h3 className="font-bold text-[18px] text-[#0f172a]">
            {promotion ? 'Chỉnh sửa chương trình khuyến mãi' : 'Tạo chương trình khuyến mãi mới'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-[#f8fafc] rounded-[8px] cursor-pointer"><X className="size-5 text-[#64748b]" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row max-h-[80vh] overflow-y-auto">
          {/* Left panel: Info Form */}
          <div className="flex-1 p-6 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-[#e2e8f0]">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-semibold text-[#475569]">Tên chương trình khuyến mãi *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: Giảm giá mùa hè rực lửa"
                className={`bg-[#f8fafc] border rounded-[8px] px-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be] ${
                  errors.name ? 'border-red-500' : 'border-[#e2e8f0]'
                }`}
              />
              {errors.name && <span className="text-red-500 text-[11px] font-medium">⚠️ {errors.name}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-semibold text-[#475569]">Slug đường dẫn (Auto) *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                placeholder="giam-gia-mua-he-ruc-lua"
                className={`bg-[#f8fafc] border rounded-[8px] px-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be] ${
                  errors.slug ? 'border-red-500' : 'border-[#e2e8f0]'
                }`}
              />
              {errors.slug && <span className="text-red-500 text-[11px] font-medium">⚠️ {errors.slug}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[#475569]">Chiết khấu giảm giá (%) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountPercent}
                  onChange={e => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                  className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be]"
                />
              </div>

              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  className="size-4 text-[#0058be] border-[#cbd5e1] rounded focus:ring-[#0058be]"
                />
                <label htmlFor="activeCheck" className="text-[13px] font-bold text-[#475569] cursor-pointer">Kích hoạt chương trình</label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[#475569]">Ngày bắt đầu *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[#475569]">Ngày kết thúc *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be]"
                />
              </div>
            </div>

            {/* Cloudinary Banner Upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#475569]">Ảnh Banner quảng cáo</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Đường dẫn ảnh hoặc Tải ảnh lên"
                  value={formData.bannerUrl}
                  onChange={e => setFormData({ ...formData, bannerUrl: e.target.value })}
                  className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-2 text-[13px] focus:outline-none focus:border-[#0058be] flex-1"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-[#f1f5f9] border border-[#cbd5e1] text-[#475569] hover:bg-[#e2e8f0] px-4 py-2 rounded-[8px] text-[13px] font-semibold cursor-pointer transition-colors disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : 'Tải lên'}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-semibold text-[#475569]">Mô tả chiến dịch</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chi tiết về chương trình ưu đãi..."
                rows={3}
                className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be] resize-none"
              />
            </div>
          </div>

          {/* Right panel: Product Selector */}
          <div className="w-full lg:w-[420px] p-6 flex flex-col gap-4">
            <div>
              <h4 className="text-[14px] font-bold text-[#0f172a]">Chọn sản phẩm áp dụng giảm giá</h4>
              <p className="text-[#64748b] text-[12px] mt-0.5">Lựa chọn các linh kiện máy tính sẽ tham gia chiến dịch này.</p>
            </div>

            {/* Category Filter Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#475569]">Lọc theo danh mục</label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-2.5 py-1.5 text-[12px] font-semibold text-[#374151] focus:outline-none focus:border-[#0058be] transition-all cursor-pointer appearance-none"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#94a3b8]">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchProductQuery}
                onChange={e => setSearchProductQuery(e.target.value)}
                className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-8.5 pr-4 py-1.5 text-[12px] focus:outline-none focus:border-[#0058be] transition-all w-full"
              />
            </div>

            {/* List with Checkboxes */}
            <div className="flex-1 min-h-[220px] max-h-[340px] border border-[#e2e8f0] rounded-[10px] overflow-y-auto p-2 bg-[#f8fafc] flex flex-col gap-1">
              {filteredProducts.length === 0 ? (
                <div className="text-[12px] text-[#94a3b8] italic text-center py-10">Không tìm thấy sản phẩm phù hợp.</div>
              ) : (
                filteredProducts.map(p => {
                  const isChecked = formData.productIds.includes(Number(p.id));
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleProductToggle(Number(p.id))}
                      className={`flex items-center justify-between p-2 rounded-[8px] text-[13px] border transition-all text-left w-full cursor-pointer ${
                        isChecked
                          ? 'bg-blue-50 border-[#0058be] text-[#0058be]'
                          : 'bg-white border-transparent text-[#475569] hover:bg-[#f1f5f9]'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-bold truncate text-[#0f172a]">{p.name}</span>
                        <span className="text-[11px] text-[#94a3b8] mt-0.5">Giá gốc: {p.price.toLocaleString('vi-VN')}₫</span>
                      </div>
                      <div className={`size-5 shrink-0 rounded-full flex items-center justify-center border ${
                        isChecked ? 'bg-[#0058be] border-[#0058be] text-white' : 'border-[#cbd5e1] bg-white'
                      }`}>
                        {isChecked && <Check className="size-3" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Selected Count Badge */}
            <div className="flex items-center justify-between text-[13px] font-semibold text-[#475569] border-t pt-3">
              <span>Đã chọn:</span>
              <span className="bg-[#eff6ff] text-[#0058be] border border-blue-100 px-3 py-0.5 rounded-full font-bold">
                {formData.productIds.length} sản phẩm
              </span>
            </div>

            {/* Submission buttons */}
            <div className="flex justify-end gap-3 mt-auto pt-3 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-[#e2e8f0] rounded-[8px] text-[13px] text-[#475569] hover:bg-[#f8fafc]">Hủy</button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#0058be] text-white rounded-[8px] text-[13px] font-semibold hover:bg-[#0047a3] disabled:opacity-60 flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                {promotion ? 'Lưu thay đổi' : 'Tạo khuyến mãi'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
