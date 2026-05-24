'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Package,
  CheckCircle2,
  XCircle,
  Minus,
  Plus,
  AlertCircle,
  ArrowLeft,
  X,
  Maximize2
} from 'lucide-react';
import { adminAPI, Product, ProductImage } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';

// ─── SPECS_BY_CATEGORY mirrors ExplorePage ────────────────────────────────────
const SPEC_LABEL_MAP: Record<string, string> = {
  // General & Pre-built
  usage_need: 'Nhu cầu sử dụng',
  brand: 'Thương hiệu',
  component_type: 'Loại linh kiện',
  series: 'Dòng sản phẩm (Series)',

  // CPU
  cores: 'Số nhân',
  threads: 'Số luồng',
  socket: 'Socket',
  integrated_gpu: 'GPU tích hợp',
  tdp_w: 'TDP (W)',
  cache_mb: 'Bộ nhớ đệm (MB)',
  base_clock_ghz: 'Xung cơ bản (GHz)',
  boost_clock_ghz: 'Xung tối đa (GHz)',
  performance_score: 'Điểm hiệu năng',
  // RAM
  type: 'Loại',
  capacity_gb: 'Dung lượng (GB)',
  kit: 'Kit',
  has_rgb: 'Có RGB',
  bus_speed_mhz: 'Tốc độ Bus (MHz)',
  latency_cl: 'CAS Latency',
  // SSD/HDD
  interface: 'Giao tiếp',
  read_speed_mbps: 'Tốc độ đọc (MB/s)',
  write_speed_mbps: 'Tốc độ ghi (MB/s)',
  // VGA
  vram_gb: 'VRAM (GB)',
  vram_type: 'Loại VRAM',
  base_clock_mhz: 'Xung cơ bản (MHz)',
  boost_clock_mhz: 'Xung boost (MHz)',
  length_mm: 'Chiều dài (mm)',
  min_psu_w: 'Nguồn tối thiểu (W)',
  // Mainboard
  chipset: 'Chipset',
  ram_type: 'Loại RAM',
  form_factor: 'Form factor',
  has_wifi: 'Có Wifi',
  ram_slots: 'Số khe RAM',
  max_ram_gb: 'RAM tối đa (GB)',
  m2_slots: 'Số khe M.2',
  // PSU
  wattage: 'Công suất (W)',
  efficiency_rating: 'Hiệu suất',
  modularity: 'Modularity',
  // Monitor
  panel_type: 'Loại tấm nền',
  resolution: 'Độ phân giải',
  refresh_rate_hz: 'Tần số quét (Hz)',
  has_hdr: 'Hỗ trợ HDR',
  aspect_ratio: 'Tỉ lệ màn hình',
  ports: 'Cổng kết nối',
  size_inch: 'Kích thước (inch)',
  brightness_cdm2: 'Độ sáng (cd/m²)',
  response_time_ms: 'Phản hồi (ms)',
  color_accuracy: 'Độ chuẩn màu',
  // Cooler
  fan_size_mm: 'Kích thước quạt (mm)',
  tdp_rating_w: 'TDP hỗ trợ (W)',
  noise_level_db: 'Độ ồn (dB)',
  radiator_size_mm: 'Radiator (mm)',
  supported_sockets: 'Socket hỗ trợ',
  // Fan
  is_addressable_rgb: 'LED ARGB',
  size_mm: 'Kích thước (mm)',
  airflow_cfm: 'Lưu lượng gió (CFM)',
  bearing_type: 'Loại trục quay (Bearing)',
  fan_speed_rpm: 'Tốc độ quay (RPM)',
  connection_type: 'Chuẩn cắm',
  // Case
  size: 'Kích thước',
  max_gpu_length_mm: 'Độ dài GPU tối đa (mm)',
  supported_mainboards: 'Bo mạch hỗ trợ',
  max_cpu_cooler_height_mm: 'Chiều cao CPU Cooler tối đa (mm)',
};

function formatSpecValue(key: string, value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  if (Array.isArray(value)) return value.join(', ');
  if (value === null || value === undefined) return '—';
  return String(value);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ProductDetailSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-4 bg-[#e2e8f0] rounded w-64 mb-8" />
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="w-full lg:w-[480px] shrink-0">
          <div className="bg-[#f1f5f9] rounded-[20px] h-[400px]" />
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <div className="h-4 bg-[#e2e8f0] rounded w-24" />
          <div className="h-8 bg-[#e2e8f0] rounded w-full" />
          <div className="h-8 bg-[#e2e8f0] rounded w-3/4" />
          <div className="h-10 bg-[#e2e8f0] rounded w-36 mt-2" />
          <div className="h-px bg-[#f1f5f9] mt-4" />
          <div className="flex gap-3 mt-4">
            <div className="h-12 bg-[#e2e8f0] rounded-[12px] flex-1" />
            <div className="h-12 bg-[#e2e8f0] rounded-[12px] w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // Gallery and Lightbox states
  const [detailImages, setDetailImages] = useState<ProductImage[]>([]);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const { addItem } = useCartStore();

  useEffect(() => {
    if (!id) return;
    const timer = setTimeout(() => {
      setLoading(true);
    }, 0);
    adminAPI
      .getProductById(id)
      .then((p) => {
        setProduct(p);
        setLoading(false);
        // Fetch detailed product images
        adminAPI.getProductImages(p.id)
          .then((imgs) => {
            const sorted = [...imgs].sort((a, b) => a.sortOrder - b.sortOrder);
            setDetailImages(sorted);
          })
          .catch((err) => {
            console.error('Error fetching product detail images:', err);
          });
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
    return () => clearTimeout(timer);
  }, [id]);

  const specs: Record<string, unknown> = (() => {
    try {
      return product?.specsJson ? JSON.parse(product.specsJson) : {};
    } catch {
      return {};
    }
  })();

  const specEntries = Object.entries(specs).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );

  const imgSrc = product?.thumbnailUrl?.startsWith('http')
    ? product.thumbnailUrl
    : product?.thumbnailUrl
      ? `http://localhost:8080${product.thumbnailUrl}`
      : null;

  const outOfStock = product ? product.stock === 0 : false;

  // Build complete list of images: main thumbnail + detail images
  const allImages = imgSrc ? [imgSrc, ...detailImages.map(img => img.url)] : (detailImages.length > 0 ? detailImages.map(img => img.url) : []);
  const activeImageUrl = allImages[selectedImgIndex] || null;

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (allImages.length <= 1) return;
    setSelectedImgIndex(prev => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (allImages.length <= 1) return;
    setSelectedImgIndex(prev => (prev + 1) % allImages.length);
  };

  async function handleAddToCart() {
    if (!product || outOfStock) return;
    setAddingToCart(true);
    try {
      await addItem(Number(product.id), quantity);
      toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
    } catch {
      toast.error('Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
    } finally {
      setAddingToCart(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="min-h-screen"
        style={{ background: 'linear-gradient(180deg, #f7f9fb 0%, #f0f4fa 100%)' }}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-1">
          <div className="h-4 bg-[#cbd5e1] rounded w-64 animate-pulse" />
        </div>
        <ProductDetailSkeleton />
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound || !product) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: 'linear-gradient(180deg, #f7f9fb 0%, #f0f4fa 100%)' }}
      >
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="size-8 text-red-400" />
        </div>
        <p className="text-[18px] font-bold text-[#0f172a]">Không tìm thấy sản phẩm</p>
        <p className="text-[14px] text-[#94a3b8]">
          Sản phẩm này không tồn tại hoặc đã bị xóa.
        </p>
        <Link
          href="/explore"
          className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-[#0058be] text-white rounded-[12px] text-[14px] font-semibold hover:bg-[#0047a3] transition-colors"
        >
          <ArrowLeft className="size-4" />
          Quay lại khám phá
        </Link>
      </div>
    );
  }

  // ── Main layout ────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #f7f9fb 0%, #f0f4fa 100%)' }}
    >
      {/* Plain Breadcrumb */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-1">
        <div className="flex items-center gap-1.5 text-[13px] text-[#64748b] flex-wrap">
          <Link href="/home" className="hover:text-[#0058be] transition-colors">
            Trang chủ
          </Link>
          <span className="text-[#cbd5e1] font-normal">/</span>
          <Link href="/explore" className="hover:text-[#0058be] transition-colors">
            Khám phá linh kiện
          </Link>
          {product.category && (
            <>
              <span className="text-[#cbd5e1] font-normal">/</span>
              <span className="text-[#64748b]">{product.category.name}</span>
            </>
          )}
          <span className="text-[#cbd5e1] font-normal">/</span>
          <span className="text-[#0f172a] font-medium line-clamp-1 max-w-[260px]">
            {product.name}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Top section: image + info ──────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-10 mb-10">
          {/* Interactive Image Gallery */}
          <div className="w-full lg:w-[460px] shrink-0 flex flex-col gap-4">
            {/* Active Large Image Frame */}
            <div 
              onClick={() => activeImageUrl && setIsLightboxOpen(true)}
              className="bg-white rounded-[24px] border border-[#e8ecf2] shadow-xs p-6 flex items-center justify-center h-[380px] relative overflow-hidden group cursor-zoom-in transition-all hover:shadow-md"
            >
              {outOfStock && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2.5px] z-10 flex items-center justify-center select-none">
                  <span className="bg-red-100 text-red-600 font-bold text-[13px] px-4 py-1.5 rounded-full border border-red-200 shadow-xs">
                    Hết hàng
                  </span>
                </div>
              )}

              {/* Main Image Renderer */}
              {activeImageUrl && !imgErr ? (
                <img
                  src={activeImageUrl}
                  alt={product.name}
                  className={`h-full w-full object-contain transition-all duration-500 ease-out select-none ${
                    outOfStock ? 'grayscale opacity-50' : 'group-hover:scale-105'
                  }`}
                  onError={() => setImgErr(true)}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-[#cbd5e1] select-none">
                  <Package className="size-16 stroke-[1.25]" />
                  <span className="text-[13px] font-medium">Chưa có ảnh</span>
                </div>
              )}

              {/* Expand Badge Overlay */}
              {activeImageUrl && !outOfStock && (
                <div className="absolute bottom-4 right-4 size-9 bg-white/80 hover:bg-white border border-slate-100 text-[#475569] rounded-full flex items-center justify-center shadow-sm backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 duration-200">
                  <Maximize2 className="size-4 shrink-0" />
                </div>
              )}

              {/* Slide Navigation Left/Right inside frame */}
              {allImages.length > 1 && !outOfStock && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 size-10 bg-white/60 hover:bg-white/90 border border-slate-100 text-[#475569] rounded-full flex items-center justify-center shadow-xs backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 size-10 bg-white/60 hover:bg-white/90 border border-slate-100 text-[#475569] rounded-full flex items-center justify-center shadow-xs backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails Row */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1 max-w-full scrollbar-thin">
                {allImages.map((img, idx) => {
                  const isActive = idx === selectedImgIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImgIndex(idx)}
                      className={`size-[72px] shrink-0 bg-white rounded-[14px] p-1.5 flex items-center justify-center border-2 overflow-hidden transition-all duration-200 hover:scale-102 hover:shadow-xs cursor-pointer ${
                        isActive 
                          ? 'border-[#0058be] shadow-xs' 
                          : 'border-[#e8ecf2] opacity-75 hover:opacity-100 hover:border-slate-300'
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain rounded-[8px]" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="flex-1 flex flex-col gap-5">
            {/* Brand + category badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.brand && (
                <span className="text-[11px] font-bold text-[#0058be] uppercase tracking-[0.8px] bg-[#eff6ff] px-3 py-1 rounded-full">
                  {product.brand.name}
                </span>
              )}
              {product.category && (
                <span className="text-[11px] font-semibold text-[#475569] bg-[#f1f5f9] px-3 py-1 rounded-full">
                  {product.category.name}
                </span>
              )}
            </div>

            {/* Product name */}
            <h2 className="text-[22px] font-bold text-[#0f172a] leading-snug">
              {product.name}
            </h2>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span
                className={`text-[32px] font-bold tracking-tight ${outOfStock ? 'text-[#94a3b8]' : 'text-[#0058be]'}`}
              >
                {product.price.toLocaleString('vi-VN')}
                <span className="text-[16px] font-normal ml-1 opacity-70">₫</span>
              </span>
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-2">
              {product.stock === 0 ? (
                <>
                  <XCircle className="size-4 text-red-500 shrink-0" />
                  <span className="text-[13px] font-semibold text-red-500">Hết hàng</span>
                </>
              ) : product.stock <= 5 ? (
                <>
                  <AlertCircle className="size-4 text-amber-500 shrink-0" />
                  <span className="text-[13px] font-semibold text-amber-600">
                    Còn {product.stock} sản phẩm — Sắp hết hàng!
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span className="text-[13px] font-semibold text-emerald-600">
                    Còn hàng ({product.stock} sản phẩm)
                  </span>
                </>
              )}
            </div>

            <div className="h-px bg-[#f1f5f9]" />

            {/* Description */}
            {product.description && (
              <p className="text-[14px] text-[#475569] leading-relaxed line-clamp-4">
                {product.description}
              </p>
            )}

            <div className="h-px bg-[#f1f5f9]" />

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Quantity stepper */}
              <div className="flex items-center gap-0 bg-[#f8fafc] border border-[#e2e8f0] rounded-[12px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={outOfStock || quantity <= 1}
                  className="w-10 h-12 flex items-center justify-center text-[#475569] hover:bg-[#e2e8f0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Giảm số lượng"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-12 h-12 flex items-center justify-center text-[15px] font-bold text-[#0f172a] border-x border-[#e2e8f0]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                  disabled={outOfStock || quantity >= product.stock}
                  className="w-10 h-12 flex items-center justify-center text-[#475569] hover:bg-[#e2e8f0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Tăng số lượng"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              {/* Add to cart button */}
              <button
                type="button"
                id="add-to-cart-btn"
                disabled={outOfStock || addingToCart}
                onClick={handleAddToCart}
                className="flex-1 min-w-[180px] h-12 flex items-center justify-center gap-2 bg-[#0058be] text-white text-[14px] font-semibold rounded-[12px] shadow-[0_4px_16px_rgba(0,88,190,0.30)] hover:bg-[#0047a3] hover:shadow-[0_4px_20px_rgba(0,88,190,0.40)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {addingToCart ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang thêm...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="size-4" />
                    {outOfStock ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
                  </>
                )}
              </button>
            </div>

            {/* Back link */}
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-[13px] text-[#64748b] hover:text-[#0058be] transition-colors mt-1 w-fit"
            >
              <ArrowLeft className="size-3.5" />
              Quay lại danh sách
            </Link>
          </div>
        </div>

        {/* ── Specs table ───────────────────────────────────────────────────── */}
        {specEntries.length > 0 && (
          <section className="bg-white rounded-[20px] border border-[#e8ecf2] shadow-sm overflow-hidden mb-8">
            {/* Section header */}
            <div className="bg-gradient-to-r from-[#0047a3] to-[#0058be] px-6 py-4">
              <h3 className="text-[16px] font-bold text-white tracking-tight">
                Thông số kỹ thuật
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <colgroup>
                  <col className="w-[40%]" />
                  <col className="w-[60%]" />
                </colgroup>
                <tbody>
                  {specEntries.map(([key, value], idx) => {
                    const label = SPEC_LABEL_MAP[key] ?? key;
                    const formatted = formatSpecValue(key, value);
                    const isEven = idx % 2 === 0;

                    return (
                      <tr
                        key={key}
                        className={`border-b border-[#f1f5f9] last:border-0 transition-colors hover:bg-[#eff6ff]/40 ${isEven ? 'bg-[#f8fafc]' : 'bg-white'}`}
                      >
                        <td className="px-6 py-3.5 text-[13px] font-semibold text-[#374151]">
                          {label}
                        </td>
                        <td className="px-6 py-3.5 text-[13px] text-[#0f172a] font-medium">
                          {typeof value === 'boolean' ? (
                            value ? (
                              <span className="inline-flex items-center gap-1.5 text-emerald-600">
                                <CheckCircle2 className="size-3.5" />
                                Có
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-red-400">
                                <XCircle className="size-3.5" />
                                Không
                              </span>
                            )
                          ) : (
                            formatted
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Description (full) ───────────────────────────────────────────── */}
        {product.description && (
          <section className="bg-white rounded-[20px] border border-[#e8ecf2] shadow-sm overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-[#0047a3] to-[#0058be] px-6 py-4">
              <h3 className="text-[16px] font-bold text-white tracking-tight">
                Mô tả sản phẩm
              </h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-[14px] text-[#475569] leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          </section>
        )}
        {/* ── Lightbox Modal ── */}
        {isLightboxOpen && activeImageUrl && (
          <div 
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200 select-none"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close Button */}
            <button 
              onClick={() => setIsLightboxOpen(false)} 
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white transition-all cursor-pointer"
              aria-label="Close lightbox"
            >
              <X className="size-6" />
            </button>
            
            {/* Navigation Left */}
            {allImages.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }} 
                className="absolute left-6 p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer"
                aria-label="Previous image"
              >
                <ChevronLeft className="size-8" />
              </button>
            )}

            {/* Active Image frame in lightbox */}
            <div 
              className="max-w-[85vw] max-h-[80vh] flex items-center justify-center animate-in zoom-in-95 duration-300" 
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={activeImageUrl} 
                alt="Product detail expanded view" 
                className="max-w-full max-h-full object-contain rounded-[12px] shadow-2xl" 
              />
            </div>

            {/* Navigation Right */}
            {allImages.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleNextImage(); }} 
                className="absolute right-6 p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer"
                aria-label="Next image"
              >
                <ChevronRight className="size-8" />
              </button>
            )}

            {/* Image Counter */}
            {allImages.length > 1 && (
              <div className="absolute bottom-8 bg-white/10 px-4 py-1.5 rounded-full border border-white/10 text-white text-[14px] font-medium tracking-wide">
                {selectedImgIndex + 1} / {allImages.length}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
