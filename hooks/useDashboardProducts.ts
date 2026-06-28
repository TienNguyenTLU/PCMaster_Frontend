"use client";

import { useState, useEffect } from "react";
import { adminAPI, adminChatbotAPI, Product, Brand, Category } from "@/lib/api";
import toast from "react-hot-toast";

// ==========================================
// HOOK QUẢN LÝ NGHIỆP VỤ SẢN PHẨM Ở DASHBOARD
// ==========================================

export function useDashboardProducts() {
  // Trạng thái lưu trữ danh sách từ API
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [brandsList, setBrandsList] = useState<Brand[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);

  // Trạng thái phân trang và tiến trình tải
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 7;

  // Trạng thái tìm kiếm và bộ lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [sortBy, setSortBy] = useState("id-desc");

  // Trạng thái đóng/mở modal Thêm/Sửa sản phẩm
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Trạng thái đóng/mở modal Xóa sản phẩm
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Trạng thái tiến trình index dữ liệu chatbot
  const [indexing, setIndexing] = useState(false);

  // Gọi API re-index lại sản phẩm tìm kiếm AI
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

  // Tự động debounce tìm kiếm sau 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Tải danh sách thương hiệu và danh mục khi mount
  useEffect(() => {
    adminAPI.getBrands(0, 100).then((res) => setBrandsList(res.content || []));
    adminAPI
      .getCategories(0, 100)
      .then((res) => setCategoriesList(res.content || []));
  }, []);

  // Hàm gọi API tải toàn bộ sản phẩm (đọc tất cả các trang)
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

  // Tải sản phẩm lần đầu khi mount
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Lọc sản phẩm ở client dựa trên từ khóa tìm kiếm và bộ lọc
  const filteredProducts = allProducts.filter((p) => {
    const matchSearch = debouncedSearch
      ? p.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      : true;
    const matchCat = selectedCategory
      ? (() => {
          const pCatId = String(p.category?.id ?? p.categoryId ?? "");
          if (pCatId === selectedCategory) return true;
          const parentId = p.category?.parentId ?? categoriesList.find((c) => String(c.id) === pCatId)?.parentId;
          return parentId !== undefined && parentId !== null && String(parentId) === selectedCategory;
        })()
      : true;
    const matchBrand = selectedBrand
      ? String(p.brand?.id ?? p.brandId) === selectedBrand
      : true;
    return matchSearch && matchCat && matchBrand;
  });

  // Sắp xếp sản phẩm ở client
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "name-asc") {
      return a.name.localeCompare(b.name, "vi");
    }
    if (sortBy === "name-desc") {
      return b.name.localeCompare(a.name, "vi");
    }
    if (sortBy === "id-asc") {
      const valA = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.id);
      const valB = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.id);
      return valA - valB;
    }
    // default: id-desc (mới nhất)
    const valA = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.id);
    const valB = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.id);
    return valB - valA;
  });

  const totalElements = sortedProducts.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE) || 1;
  const currentProducts = sortedProducts.slice(
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

  // Xác nhận thực hiện xóa sản phẩm
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

  return {
    allProducts,
    brandsList,
    categoriesList,
    loading,
    error,
    page,
    setPage,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    sortBy,
    setSortBy,
    isModalOpen,
    setIsModalOpen,
    editingProduct,
    setEditingProduct,
    deletingProduct,
    setDeletingProduct,
    deleteLoading,
    indexing,
    handleReindex,
    fetchProducts,
    filteredProducts,
    totalElements,
    totalPages,
    currentProducts,
    handleAddClick,
    handleEditClick,
    handleModalSuccess,
    handleDeleteConfirm,
  };
}
