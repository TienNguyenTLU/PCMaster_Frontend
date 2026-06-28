"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  Maximize2,
} from "lucide-react";
import { adminAPI, Product, ProductImage, getCategoryLabel } from "@/lib/api";
import { SPEC_LABEL_MAP } from "@/utils/labelMapping";
import { useCartManager } from "@/hooks/useCartManager";
import LightboxModal from "./LightboxModal";



function formatSpecValue(key: string, value: unknown): string {
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "—";

  const valStr = String(value).trim();
  const valLower = valStr.toLowerCase();

  
  if (valLower === "true" || valLower === "yes" || valLower === "có")
    return "Có";
  if (valLower === "false" || valLower === "no" || valLower === "không")
    return "Không";

  
  const numericVal = parseFloat(valStr.replace(/[^0-9.]/g, ""));
  if (!isNaN(numericVal)) {
    if (key === "mtbf") {
      return numericVal.toLocaleString("vi-VN") + " giờ";
    }
    if (
      key === "read_speed_mbps" ||
      key === "write_speed_mbps" ||
      key === "t_c_c_mb_s" ||
      key === "t_c_ghi_mb_s"
    ) {
      return numericVal.toLocaleString("vi-VN") + " MB/s";
    }
    if (key === "warranty") {
      return numericVal.toLocaleString("vi-VN") + " tháng";
    }
    if (key === "capacity_gb" || key === "capacity" || key === "dung_l_ng") {
      return numericVal.toLocaleString("vi-VN") + " GB";
    }
    if (key === "tbw" || key === "tbw_b_n_ghi" || key === "tbw_w") {
      return numericVal.toLocaleString("vi-VN") + " TBW";
    }
  }

  return valStr;
}


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


export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const [detailImages, setDetailImages] = useState<ProductImage[]>([]);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const { handleAddToCart, addingIds } = useCartManager();
  const addingToCart = product ? addingIds.has(Number(product.id)) : false;

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      await Promise.resolve();
      setLoading(true);
      adminAPI
        .getProductById(id)
        .then((p) => {
          setProduct(p);
          setLoading(false);
          
          adminAPI
            .getProductImages(p.id)
            .then((imgs) => {
              const sorted = [...imgs].sort((a, b) => a.sortOrder - b.sortOrder);
              setDetailImages(sorted);
            })
            .catch((err) => {
              console.error("Error fetching product detail images:", err);
            });
        })
        .catch(() => {
          setNotFound(true);
          setLoading(false);
        });
    };
    loadData();
  }, [id]);

  const specs: Record<string, unknown> = (() => {
    try {
      return product?.specsJson ? JSON.parse(product.specsJson) : {};
    } catch {
      return {};
    }
  })();

  const specEntries = Object.entries(specs).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );

  const imgSrc = product?.thumbnailUrl?.startsWith("http")
    ? product.thumbnailUrl
    : product?.thumbnailUrl
      ? `http://localhost:8080${product.thumbnailUrl}`
      : null;

  const outOfStock = product ? product.stock === 0 : false;

  
  const allImages = imgSrc
    ? [imgSrc, ...detailImages.map((img) => img.url)]
    : detailImages.length > 0
      ? detailImages.map((img) => img.url)
      : [];
  const activeImageUrl = allImages[selectedImgIndex] || null;

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (allImages.length <= 1) return;
    setSelectedImgIndex(
      (prev) => (prev - 1 + allImages.length) % allImages.length,
    );
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (allImages.length <= 1) return;
    setSelectedImgIndex((prev) => (prev + 1) % allImages.length);
  };

  async function handleAddToCartClick() {
    if (!product || outOfStock) return;
    await handleAddToCart(Number(product.id), quantity);
  }

  
  if (loading) {
    return (
      <div
        className="min-h-screen"
        style={{
          background: "linear-gradient(180deg, #f7f9fb 0%, #f0f4fa 100%)",
        }}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-1">
          <div className="h-4 bg-[#cbd5e1] rounded w-64 animate-pulse" />
        </div>
        <ProductDetailSkeleton />
      </div>
    );
  }

  
  if (notFound || !product) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{
          background: "linear-gradient(180deg, #f7f9fb 0%, #f0f4fa 100%)",
        }}
      >
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="size-8 text-red-400" />
        </div>
        <p className="text-[18px] font-bold text-[#0f172a]">
          Không tìm thấy sản phẩm
        </p>
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

  
  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #f7f9fb 0%, #f0f4fa 100%)",
      }}
    >
      {}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-1">
        <div className="flex items-center gap-1.5 text-[13px] text-[#64748b] flex-wrap">
          <Link href="/home" className="hover:text-[#0058be] transition-colors">
            Trang chủ
          </Link>
          <span className="text-[#cbd5e1] font-normal">/</span>
          <Link
            href="/explore"
            className="hover:text-[#0058be] transition-colors"
          >
            Khám phá linh kiện
          </Link>
          {product.category && (
            <>
              <span className="text-[#cbd5e1] font-normal">/</span>
              <span className="text-[#64748b]">
                {getCategoryLabel(product.category.name)}
              </span>
            </>
          )}
          <span className="text-[#cbd5e1] font-normal">/</span>
          <span className="text-[#0f172a] font-medium line-clamp-1 max-w-[260px]">
            {product.name}
          </span>
        </div>
      </div>

      {}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {}
        <div className="flex flex-col lg:flex-row gap-10 mb-10">
          {}
          <div className="w-full lg:w-[460px] shrink-0 flex flex-col gap-4">
            {}
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

              {}
              {activeImageUrl && !imgErr ? (
                <img
                  src={activeImageUrl}
                  alt={product.name}
                  className={`h-full w-full object-contain transition-all duration-500 ease-out select-none ${
                    outOfStock
                      ? "grayscale opacity-50"
                      : "group-hover:scale-105"
                  }`}
                  onError={() => setImgErr(true)}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-[#cbd5e1] select-none">
                  <Package className="size-16 stroke-[1.25]" />
                  <span className="text-[13px] font-medium">Chưa có ảnh</span>
                </div>
              )}

              {}
              {activeImageUrl && !outOfStock && (
                <div className="absolute bottom-4 right-4 size-9 bg-white/80 hover:bg-white border border-slate-100 text-[#475569] rounded-full flex items-center justify-center shadow-sm backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 duration-200">
                  <Maximize2 className="size-4 shrink-0" />
                </div>
              )}

              {}
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

            {}
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
                          ? "border-[#0058be] shadow-xs"
                          : "border-[#e8ecf2] opacity-75 hover:opacity-100 hover:border-slate-300"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-contain rounded-[8px]"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {}
          <div className="flex-1 flex flex-col gap-5">
            {}
            <div className="flex items-center gap-2 flex-wrap">
              {product.brand && (
                <span className="text-[11px] font-bold text-[#0058be] uppercase tracking-[0.8px] bg-[#eff6ff] px-3 py-1 rounded-full">
                  {product.brand.name}
                </span>
              )}
              {product.category && (
                <span className="text-[11px] font-semibold text-[#475569] bg-[#f1f5f9] px-3 py-1 rounded-full">
                  {getCategoryLabel(product.category.name)}
                </span>
              )}
            </div>

            {}
            <h2 className="text-[22px] font-bold text-[#0f172a] leading-snug">
              {product.name}
            </h2>

            {}
            <div className="flex items-baseline gap-3 flex-wrap">
              {product.discountPrice ? (
                <>
                  <span
                    className={`text-[32px] font-bold tracking-tight ${outOfStock ? "text-[#94a3b8]" : "text-red-500"}`}
                  >
                    {product.discountPrice.toLocaleString("vi-VN")}
                    <span className="text-[16px] font-normal ml-1 opacity-70">
                      ₫
                    </span>
                  </span>
                  <span className="text-[16px] text-[#cbd5e1] line-through font-semibold">
                    {product.price.toLocaleString("vi-VN")}₫
                  </span>
                  <span className="bg-red-100 text-red-600 text-[12px] font-bold px-2 py-0.5 rounded-full border border-red-200 shadow-xs">
                    Giảm -{product.discountPercent}%
                  </span>
                </>
              ) : (
                <span
                  className={`text-[32px] font-bold tracking-tight ${outOfStock ? "text-[#94a3b8]" : "text-[#0058be]"}`}
                >
                  {product.price.toLocaleString("vi-VN")}
                  <span className="text-[16px] font-normal ml-1 opacity-70">
                    ₫
                  </span>
                </span>
              )}
            </div>

            {}
            <div className="flex items-center gap-2">
              {product.stock === 0 ? (
                <>
                  <XCircle className="size-4 text-red-500 shrink-0" />
                  <span className="text-[13px] font-semibold text-red-500">
                    Hết hàng
                  </span>
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

            {}
            {product.description && (
              <p className="text-[14px] text-[#475569] leading-relaxed line-clamp-4">
                {product.description}
              </p>
            )}

            <div className="h-px bg-[#f1f5f9]" />

            {}
            <div className="flex items-center gap-3 flex-wrap">
              {}
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

              {}
              <button
                type="button"
                id="add-to-cart-btn"
                disabled={outOfStock || addingToCart}
                onClick={handleAddToCartClick}
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
                    {outOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"}
                  </>
                )}
              </button>
            </div>

            {}
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-[13px] text-[#64748b] hover:text-[#0058be] transition-colors mt-1 w-fit"
            >
              <ArrowLeft className="size-3.5" />
              Quay lại danh sách
            </Link>
          </div>
        </div>

        {}
        {specEntries.length > 0 && (
          <section className="bg-white rounded-[20px] border border-[#e8ecf2] shadow-sm overflow-hidden mb-8">
            {}
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

                    const isBool =
                      typeof value === "boolean" ||
                      (typeof value === "string" &&
                        (value.toLowerCase() === "true" ||
                          value.toLowerCase() === "false" ||
                          value.toLowerCase() === "có" ||
                          value.toLowerCase() === "không")) ||
                      key.startsWith("has_") ||
                      key.startsWith("is_") ||
                      key === "t_n_nhi_t" ||
                      key === "water_cooled";

                    const boolVal =
                      typeof value === "boolean"
                        ? value
                        : typeof value === "string" &&
                          (value.toLowerCase() === "true" ||
                            value.toLowerCase() === "có" ||
                            value.toLowerCase() === "yes");

                    return (
                      <tr
                        key={key}
                        className={`border-b border-[#f1f5f9] last:border-0 transition-colors hover:bg-[#eff6ff]/40 ${isEven ? "bg-[#f8fafc]" : "bg-white"}`}
                      >
                        <td className="px-6 py-3.5 text-[13px] font-semibold text-[#374151]">
                          {label}
                        </td>
                        <td className="px-6 py-3.5 text-[13px] text-[#0f172a] font-medium">
                          {isBool ? (
                            boolVal ? (
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

        {}
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
        {}
        <LightboxModal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          activeImageUrl={activeImageUrl}
          allImages={allImages}
          selectedImgIndex={selectedImgIndex}
          onPrevImage={handlePrevImage}
          onNextImage={handleNextImage}
        />
      </div>
    </div>
  );
}
