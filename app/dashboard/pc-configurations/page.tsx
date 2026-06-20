"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  Loader2,
  Cpu,
} from "lucide-react";
import { adminAPI, Product, Brand } from "@/lib/api";
import { CldImage } from "next-cloudinary";
import PcConfigurationModal from "@/components/dashboard/PcConfigurationModal";
import toast from "react-hot-toast";

export default function PcConfigurationsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 7;

  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [brandsList, setBrandsList] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [stockStatus, setStockStatus] = useState("");

  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      let all: Product[] = [];
      let currentPage = 0;
      let totalPages = 1;

      
      while (currentPage < totalPages) {
        const response = await adminAPI.getProducts(currentPage, 1000);
        const content = response.content || [];
        all = [...all, ...content];
        totalPages = response.totalPages || 1;

        if (currentPage >= 100 || content.length === 0) break;
        currentPage++;
      }

      
      
      const pcSystems = all.filter((p) => p.category?.slug === "pc-system");

      
      
      const detailedPcSystems = await Promise.all(
        pcSystems.map(async (pc) => {
          try {
            return await adminAPI.getProductById(pc.id);
          } catch {
            return pc;
          }
        }),
      );

      setAllProducts(detailedPcSystems);
    } catch {
      setError("Lỗi khi tải danh sách cấu hình PC. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    adminAPI.getBrands(0, 100).then((res) => setBrandsList(res.content || []));
  }, []);

  
  const filteredProducts = allProducts.filter((p) => {
    const matchSearch = debouncedSearch
      ? p.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      : true;
    const matchBrand = selectedBrand
      ? String(p.brand?.id ?? p.brandId) === selectedBrand
      : true;
    const matchStock =
      stockStatus === "in-stock"
        ? p.stock > 0
        : stockStatus === "out-of-stock"
        ? p.stock === 0
        : true;
    return matchSearch && matchBrand && matchStock;
  });

  const totalElements = filteredProducts.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE) || 1;
  const currentProducts = filteredProducts.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  const handleAddClick = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchProducts();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setDeleteLoading(true);
    try {
      await adminAPI.deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
      toast.success("Xóa cấu hình PC thành công!");
      fetchProducts();
    } catch {
      toast.error("Xóa cấu hình PC thất bại. Vui lòng thử lại.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0f172a] text-[24px] font-semibold tracking-[-0.5px]">
            Cấu hình PC
          </h2>
        </div>
        <button
          onClick={handleAddClick}
          className="bg-[#0058be] text-white px-4 py-2.5 rounded-[8px] text-[14px] font-medium flex items-center gap-2 hover:bg-[#0047a3] transition-colors cursor-pointer"
        >
          <Plus className="size-4" />
          Lắp ráp PC mới
        </button>
      </div>

      {}
      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-[12px] border border-[#e2e8f0] gap-4">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Tìm cấu hình PC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-9 pr-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] transition-all w-full md:w-[300px]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value);
              setPage(0);
            }}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-[14px] focus:outline-none focus:border-[#0058be] transition-all cursor-pointer"
          >
            <option value="">Tất cả thương hiệu</option>
            {brandsList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value);
              setPage(0);
            }}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-[14px] focus:outline-none focus:border-[#0058be] transition-all cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="in-stock">Còn hàng</option>
            <option value="out-of-stock">Hết hàng</option>
          </select>
        </div>
      </div>

      {}
      <div className="bg-white border border-[#e2e8f0] rounded-[12px] overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-[#64748b] gap-2">
              <Loader2 className="size-8 animate-spin text-[#0058be]" />
              <span>Đang tải danh sách cấu hình...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[300px] text-red-500 font-medium">
              {error}
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-[#64748b] gap-2">
              <Cpu className="size-10 text-gray-300" />
              <span>Không tìm thấy sản phẩm PC lắp sẵn nào.</span>
            </div>
          ) : (
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-medium">
                <tr>
                  <th className="px-6 py-4 font-medium">Hình ảnh</th>
                  <th className="px-6 py-4 font-medium">Mã bộ PC</th>
                  <th className="px-6 py-4 font-medium">Tên bộ PC</th>
                  <th className="px-6 py-4 font-medium">Linh kiện cấu thành</th>
                  <th className="px-6 py-4 font-medium">Giá bán lẻ</th>
                  <th className="px-6 py-4 font-medium">Số bộ lắp sẵn</th>
                  <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {currentProducts.map((product) => {
                  const components = product.pcComponents || [];

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-[#f8fafc] transition-colors"
                    >
                      <td className="px-6 py-4">
                        {product.thumbnailUrl ? (
                          <div className="h-12 w-12 relative bg-white border border-[#e2e8f0] rounded-[8px] overflow-hidden flex items-center justify-center">
                            <CldImage
                              src={product.thumbnailUrl}
                              alt={product.name}
                              width={48}
                              height={48}
                              crop="fill"
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 bg-gray-100 rounded-[8px] flex items-center justify-center text-[10px] text-gray-400">
                            Không ảnh
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#0f172a]">
                        {product.id}
                      </td>
                      <td
                        className="px-6 py-4 font-medium text-[#0f172a] max-w-[180px] truncate"
                        title={product.name}
                      >
                        {product.name}
                      </td>
                      <td className="px-6 py-4">
                        {components.length === 0 ? (
                          <span className="text-gray-400 text-[12px]">
                            Chưa cấu hình
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1 max-w-[280px]">
                            <span className="text-[12px] font-semibold text-[#0058be]">
                              {components.length} linh kiện
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {components.slice(0, 3).map((c, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-[4px] truncate max-w-[120px]"
                                  title={c.componentProductName}
                                >
                                  {c.componentProductName}
                                </span>
                              ))}
                              {components.length > 3 && (
                                <span className="text-[10px] bg-blue-50 text-[#0058be] px-2 py-0.5 rounded-[4px] font-semibold">
                                  +{components.length - 3} khác
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#0f172a] font-semibold">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(product.price)}
                      </td>
                      <td className="px-6 py-4 text-[#475569]">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ${
                            product.stock > 0
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {product.stock} bộ
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 text-[#94a3b8]">
                          <button
                            onClick={() => handleEditClick(product)}
                            className="p-1.5 hover:text-[#0058be] hover:bg-blue-50 rounded-[6px] transition-colors cursor-pointer"
                            title="Sửa cấu hình"
                          >
                            <Edit className="size-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(product)}
                            className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-[6px] transition-colors cursor-pointer"
                            title="Xóa bộ PC"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {}
        {!loading && !error && currentProducts.length > 0 && (
          <div className="px-6 py-4 border-t border-[#e2e8f0] flex items-center justify-between text-[13px] text-[#64748b]">
            <span>
              Hiển thị trang {page + 1} / {totalPages} (Tổng số: {totalElements}{" "}
              cấu hình)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 border border-[#e2e8f0] rounded-[6px] hover:bg-[#f8fafc] disabled:opacity-50 cursor-pointer"
              >
                Trước
              </button>
              <button className="px-3 py-1 bg-[#0058be] text-white border border-[#0058be] rounded-[6px]">
                {page + 1}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 border border-[#e2e8f0] rounded-[6px] hover:bg-[#f8fafc] disabled:opacity-50 cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {}
      <PcConfigurationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        editingProduct={editingProduct}
      />

      {}
      {deletingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) =>
            e.target === e.currentTarget && setDeletingProduct(null)
          }
        >
          <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="size-5 text-red-600" />
              </div>
              <div>
                <h4 className="text-[#0f172a] font-semibold text-[16px]">
                  Xóa sản phẩm PC
                </h4>
                <p className="text-[#64748b] text-[14px] mt-1">
                  Bạn có chắc muốn xóa cấu hình PC{" "}
                  <span className="font-semibold text-[#0f172a]">
                    &ldquo;{deletingProduct.name}&rdquo;
                  </span>
                  ? Việc này sẽ không hoàn trả linh kiện đã lắp ráp.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 text-[14px] font-medium text-[#475569] border border-[#e2e8f0] rounded-[8px] hover:bg-[#f8fafc] transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 text-[14px] font-medium text-white bg-red-600 rounded-[8px] hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {deleteLoading && <Loader2 className="size-4 animate-spin" />}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
