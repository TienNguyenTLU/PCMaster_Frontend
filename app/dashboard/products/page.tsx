"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  Loader2,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  adminAPI,
  adminChatbotAPI,
  Product,
  Brand,
  Category,
  getCategoryLabel,
} from "@/lib/api";
import { CldImage } from "next-cloudinary";
import ProductFormModal from "@/components/dashboard/ProductFormModal";
import GearvnImportModal from "@/components/dashboard/GearvnImportModal";
import toast from "react-hot-toast";

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [brandsList, setBrandsList] = useState<Brand[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);

  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 7;

  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");

  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [isGearvnModalOpen, setIsGearvnModalOpen] = useState(false);

  const [indexing, setIndexing] = useState(false);

  const handleReindex = async () => {
    setIndexing(true);
    try {
      const res = await adminChatbotAPI.reindex();
      if (res.success) {
        toast.success(
          `Index thành công ${res.indexedProducts} sản phẩm trong ${res.durationMs}ms!`,
        );
      } else {
        toast.error(res.message || "Index thất bại");
      }
    } catch {
      toast.error("Lỗi khi kết nối yêu cầu index sản phẩm.");
    } finally {
      setIndexing(false);
    }
  };

  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  
  useEffect(() => {
    adminAPI.getBrands(0, 100).then((res) => setBrandsList(res.content || []));
    adminAPI
      .getCategories(0, 100)
      .then((res) => setCategoriesList(res.content || []));
  }, []);

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

      setAllProducts(all);
    } catch {
      setError("Lỗi khi tải danh sách sản phẩm. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  
  const filteredProducts = allProducts.filter((p) => {
    const matchSearch = debouncedSearch
      ? p.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      : true;
    const matchCat = selectedCategory
      ? String(p.category?.id ?? p.categoryId) === selectedCategory
      : true;
    const matchBrand = selectedBrand
      ? String(p.brand?.id ?? p.brandId) === selectedBrand
      : true;
    return matchSearch && matchCat && matchBrand;
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
      toast.success("Xóa sản phẩm thành công!");
      fetchProducts();
    } catch {
      toast.error("Xóa sản phẩm thất bại. Vui lòng thử lại.");
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
            Sản phẩm
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReindex}
            disabled={indexing}
            className="border border-[#cbd5e1] hover:border-[#94a3b8] bg-white text-[#475569] hover:text-[#0f172a] px-4 py-2 rounded-[8px] text-[14px] font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            {indexing ? (
              <Loader2 className="size-4 animate-spin text-[#0058be]" />
            ) : (
              <RefreshCw className="size-4 text-[#0058be]" />
            )}
            Index lại sản phẩm
          </button>
          {/* Tạm thời loại bỏ nút import từ GearVN
          <button
            onClick={() => setIsGearvnModalOpen(true)}
            className="bg-gradient-to-r from-[#e31837] to-[#ff4d6d] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium flex items-center gap-2 hover:from-[#c2102a] hover:to-[#e31837] transition-all cursor-pointer shadow-sm"
          >
            <Download className="size-4" />
            Import từ GearVN
          </button>
          */}
          <button
            onClick={handleAddClick}
            className="bg-[#0058be] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium flex items-center gap-2 hover:bg-[#0047a3] transition-colors cursor-pointer"
          >
            <Plus className="size-4" />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {}
      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-[12px] border border-[#e2e8f0] gap-4">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-9 pr-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] transition-all w-full md:w-[300px]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(0);
            }}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-[14px] focus:outline-none focus:border-[#0058be] transition-all"
          >
            <option value="">Tất cả danh mục</option>
            {categoriesList.map((c) => (
              <option key={c.id} value={c.id}>
                {getCategoryLabel(c.name)}
              </option>
            ))}
          </select>

          <select
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value);
              setPage(0);
            }}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-[14px] focus:outline-none focus:border-[#0058be] transition-all"
          >
            <option value="">Tất cả thương hiệu</option>
            {brandsList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {}
      <div className="bg-white border border-[#e2e8f0] rounded-[12px] overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-[300px] text-[#64748b]">
              Đang tải dữ liệu...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[300px] text-red-500">
              {error}
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-[#64748b]">
              Không có dữ liệu sản phẩm.
            </div>
          ) : (
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-medium">
                <tr>
                  <th className="px-6 py-4 font-medium">Hình ảnh</th>
                  <th className="px-6 py-4 font-medium">Mã SP</th>
                  <th className="px-6 py-4 font-medium">Tên sản phẩm</th>
                  <th className="px-6 py-4 font-medium">Danh mục</th>
                  <th className="px-6 py-4 font-medium">Thương hiệu</th>
                  <th className="px-6 py-4 font-medium">Giá bán</th>
                  <th className="px-6 py-4 font-medium">Tồn kho</th>
                  <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {currentProducts.map((product) => {
                  const categoryName = getCategoryLabel(
                    product.category?.name ?? "",
                  );
                  const brandName = product.brand?.name ?? "";
                  const brandLogo = product.brand?.logoUrl ?? null;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-[#f8fafc] transition-colors"
                    >
                      <td className="px-6 py-4">
                        {product.thumbnailUrl ? (
                          <div className="h-10 w-10 relative bg-white border border-[#e2e8f0] rounded-[8px] overflow-hidden flex items-center justify-center">
                            <CldImage
                              src={product.thumbnailUrl}
                              alt={product.name}
                              width={40}
                              height={40}
                              crop="fill"
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 bg-gray-100 rounded-[8px] flex items-center justify-center text-[10px] text-gray-400">
                            Không ảnh
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-[#0f172a]">
                        {product.id}
                      </td>
                      <td className="px-6 py-4 text-[#475569] max-w-[200px] truncate">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 text-[#475569]">
                        {categoryName}
                      </td>
                      <td className="px-6 py-4 text-[#475569]">
                        <div className="flex items-center">
                          {brandLogo ? (
                            <div className="h-10 w-20 relative flex items-center overflow-hidden">
                              <CldImage
                                src={brandLogo}
                                alt={brandName}
                                width={80}
                                height={40}
                                crop="fit"
                                className="object-contain w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="h-8 w-16 bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-400 font-medium truncate px-1">
                              {brandName || "Không logo"}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#0f172a] font-medium">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(product.price)}
                      </td>
                      <td className="px-6 py-4 text-[#475569]">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 text-[#94a3b8]">
                          <button
                            onClick={() => handleEditClick(product)}
                            className="p-1.5 hover:text-[#0058be] hover:bg-blue-50 rounded-[6px] transition-colors cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit className="size-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(product)}
                            className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-[6px] transition-colors cursor-pointer"
                            title="Xóa"
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
              Hiển thị trang {page + 1} / {totalPages} (Tổng số: {totalElements}
              )
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
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        editingProduct={editingProduct}
      />

      {}
      <GearvnImportModal
        isOpen={isGearvnModalOpen}
        onClose={() => setIsGearvnModalOpen(false)}
        onSuccess={handleModalSuccess}
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
                  Xóa sản phẩm
                </h4>
                <p className="text-[#64748b] text-[14px] mt-1">
                  Bạn có chắc muốn xóa{" "}
                  <span className="font-medium text-[#0f172a]">
                    &ldquo;{deletingProduct.name}&rdquo;
                  </span>
                  ? Hành động này không thể hoàn tác.
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
