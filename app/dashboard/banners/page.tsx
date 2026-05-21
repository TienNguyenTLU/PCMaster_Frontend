'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Upload, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI, Banner } from '@/lib/api';

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminAPI.getBanners();
      // Sort by displayOrder ascending
      const sorted = [...data].sort((a, b) => a.displayOrder - b.displayOrder);
      setBanners(sorted);
    } catch {
      setError('Lỗi khi tải danh sách banner. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBanners();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleCreate = () => {
    setEditingBanner(null);
    setIsModalOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa banner này?')) return;
    try {
      await adminAPI.deleteBanner(id);
      toast.success('Xóa banner thành công!');
      fetchBanners();
    } catch {
      toast.error('Xóa banner thất bại.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0f172a] text-[24px] font-semibold tracking-[-0.5px]">Banner quảng cáo</h2>
          <p className="text-[#64748b] text-[14px] mt-1">Quản lý các banner hiển thị trên carousel của trang chủ.</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-[#0058be] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium flex items-center gap-2 hover:bg-[#0047a3] transition-colors cursor-pointer"
        >
          <Plus className="size-4" />
          Thêm Banner
        </button>
      </div>

      {/* Grid View */}
      {loading ? (
        <div className="bg-white border border-[#e2e8f0] rounded-[12px] h-[350px] flex flex-col items-center justify-center text-[#64748b]">
          <Loader2 className="size-8 animate-spin text-[#0058be] mb-3" />
          <span>Đang tải danh sách banner...</span>
        </div>
      ) : error ? (
        <div className="bg-white border border-red-100 rounded-[12px] h-[350px] flex items-center justify-center text-red-500">
          {error}
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white border border-[#e2e8f0] rounded-[12px] h-[350px] flex flex-col items-center justify-center text-[#64748b] gap-2">
          <Upload className="size-12 text-[#94a3b8]" />
          <span className="font-medium text-[16px]">Chưa có banner nào</span>
          <p className="text-[13px] text-[#94a3b8] max-w-[300px] text-center">Hãy nhấn nút &quot;Thêm Banner&quot; để tải lên những hình ảnh quảng bá đầu tiên cho trang chủ.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div key={banner.id} className="bg-white border border-[#e2e8f0] rounded-[16px] overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group relative">
              {/* Banner image wrapper */}
              <div className="aspect-[21/9] bg-gray-50 border-b border-[#e2e8f0] relative overflow-hidden flex items-center justify-center">
                <img
                  src={banner.imageUrl}
                  alt={`Banner ${banner.displayOrder}`}
                  className="object-cover w-full h-full group-hover:scale-102 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-[#0f172a]/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-[6px] text-[11px] font-semibold uppercase tracking-wider">
                  Thứ tự: {banner.displayOrder}
                </span>
              </div>

              {/* Info & Actions */}
              <div className="p-4 flex flex-col flex-1 gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Liên kết chuyển hướng</span>
                  {banner.linkUrl ? (
                    <a
                      href={banner.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] text-[#0058be] hover:underline flex items-center gap-1 mt-0.5 font-medium truncate"
                    >
                      {banner.linkUrl}
                      <ExternalLink className="size-3 flex-shrink-0" />
                    </a>
                  ) : (
                    <p className="text-[13px] text-[#94a3b8] italic mt-0.5">Không có liên kết</p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-[#f1f5f9] pt-3 mt-1">
                  <span className="text-[12px] text-[#94a3b8] font-mono">ID: {banner.id}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(banner)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-[#e2e8f0] rounded-[8px] text-[13px] font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors cursor-pointer"
                    >
                      <Edit className="size-3.5" />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-red-200 rounded-[8px] text-[13px] font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Banner Form Modal */}
      {isModalOpen && (
        <BannerFormModal
          banner={editingBanner}
          nextOrder={banners.length > 0 ? Math.max(...banners.map(b => b.displayOrder)) + 1 : 1}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchBanners();
          }}
        />
      )}
    </div>
  );
}

interface BannerFormModalProps {
  banner: Banner | null;
  nextOrder: number;
  onClose: () => void;
  onSuccess: () => void;
}

function BannerFormModal({ banner, nextOrder, onClose, onSuccess }: BannerFormModalProps) {
  const [linkUrl, setLinkUrl] = useState(banner?.linkUrl || '');
  const [displayOrder, setDisplayOrder] = useState<number>(banner?.displayOrder ?? nextOrder);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(banner?.imageUrl || '');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!previewUrl) {
      toast.error('Vui lòng chọn hình ảnh banner.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('linkUrl', linkUrl);
      formData.append('displayOrder', displayOrder.toString());
      if (bannerFile) {
        formData.append('file', bannerFile);
      }

      if (banner) {
        await adminAPI.updateBanner(banner.id, formData);
        toast.success('Cập nhật banner thành công!');
      } else {
        if (!bannerFile) {
          toast.error('Vui lòng chọn file hình ảnh cho banner mới.');
          setLoading(false);
          return;
        }
        await adminAPI.createBanner(formData);
        toast.success('Thêm banner thành công!');
      }
      onSuccess();
    } catch {
      toast.error('Có lỗi xảy ra khi lưu banner. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-lg flex flex-col mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <h3 className="font-semibold text-[18px] text-[#0f172a]">
            {banner ? 'Cập nhật Banner' : 'Tạo Banner Mới'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-[#f8fafc] rounded-[8px] cursor-pointer">
            <X className="size-5 text-[#64748b]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto">
          {/* File Upload Section */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-[#475569] uppercase tracking-wider">Hình Ảnh Banner *</label>
            <div className="relative group">
              <input
                type="file"
                id="banner-file-input"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <label
                htmlFor="banner-file-input"
                className={`flex flex-col items-center justify-center w-full aspect-[21/9] border-2 border-dashed rounded-[12px] cursor-pointer transition-all bg-gray-50 hover:bg-gray-100/50 ${
                  previewUrl ? 'border-solid border-[#e2e8f0] p-0' : 'border-[#cbd5e1] p-6'
                }`}
              >
                {previewUrl ? (
                  <div className="w-full h-full relative group">
                    <img
                      src={previewUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover rounded-[10px]"
                    />
                    <div className="absolute inset-0 bg-[#0f172a]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[14px] font-medium rounded-[10px]">
                      Thay đổi ảnh
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="size-8 text-[#94a3b8] mb-2 group-hover:text-[#0058be] transition-colors" />
                    <span className="text-[14px] font-medium text-[#475569]">Chọn hình ảnh banner</span>
                    <span className="text-[11px] text-[#94a3b8] mt-1">Hỗ trợ JPG, PNG, WEBP (tỉ lệ khuyên dùng 21:9)</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* displayOrder Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#475569] uppercase tracking-wider">Thứ Tự Hiển Thị *</label>
            <input
              type="number"
              min="0"
              required
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              placeholder="e.g. 1, 2, 3"
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be]"
            />
          </div>

          {/* linkUrl Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#475569] uppercase tracking-wider">Liên Kết Chuyển Hướng</label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="e.g. https://pcmaster.com/explore?category=gpu"
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be]"
            />
            <p className="text-[11px] text-[#94a3b8]">Banner sẽ chuyển hướng người dùng đến link này khi click vào.</p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-4 border-t border-[#f1f5f9] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#e2e8f0] rounded-[8px] text-[14px] font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#0058be] text-white rounded-[8px] text-[14px] font-medium hover:bg-[#0047a3] disabled:opacity-60 flex items-center gap-2 transition-colors cursor-pointer"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {banner ? 'Lưu Thay Đổi' : 'Tạo Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
