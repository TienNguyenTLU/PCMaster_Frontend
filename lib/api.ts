import axiosInstance from './axiosInstance';

// ─── Auth Response (matches backend flat record) ───────────────────────────
// Backend AuthResponse record:
//   String token, Long userId, String username, String email, UserRole role
export interface AuthResponse {
  token: string;
  userId: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

// Auth API
/**
 * Dịch vụ xác thực người dùng (Đăng nhập, Đăng ký, Đăng xuất)
 */
export const authAPI = {
  /** Đăng nhập tài khoản bằng tên đăng nhập hoặc email */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post<AuthResponse>('/api/auth/login', {
      usernameOrEmail: credentials.usernameOrEmail,
      password: credentials.password,
    });
    return data;
  },

  /** Đăng ký tài khoản khách hàng mới */
  signup: async (payload: SignupRequest): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post<AuthResponse>('/api/auth/register', {
      username: payload.username,
      email: payload.email,
      password: payload.password,
    });
    return data;
  },

  /** Đăng xuất tài khoản và xóa token lưu trữ */
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  },

  /** Lấy token xác thực hiện tại lưu trữ dưới LocalStorage */
  getStoredToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  },
};

// Generic Spring Boot Pagination Response
export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

// Product Interfaces
export interface PcComponentResponse {
  componentProductId: number;
  componentProductName: string;
  componentProductThumbnailUrl: string | null;
  componentProductPrice: number;
  quantity: number;
}

export interface Product {
  id: string | number;
  categoryId?: string | number;
  brandId?: string | number;
  name: string;
  slug?: string;
  price: number;
  discountPrice?: number | null;
  discountPercent?: number | null;
  stock: number;
  description?: string;
  specsJson?: string;
  thumbnailUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  category?: { id: string | number; name: string; slug?: string; parentId?: string | number | null };
  brand?: { id: string | number; name: string; logoUrl?: string };
  pcComponents?: PcComponentResponse[];
}

export interface ProductFormData {
  name: string;
  categoryId: string | number;
  brandId: string | number;
  price: number;
  stock: number;
  description?: string;
  thumbnailUrl?: string;
  specsJson?: string;
  pcComponents?: { componentProductId: number; quantity: number }[];
}

export interface Supplier {
  id: string | number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  brandIds?: (string | number)[];
}

export interface Brand {
  id: string | number;
  name: string;
  logoUrl?: string;
  description?: string;
}

export interface Category {
  id: string | number;
  name: string;
  slug?: string;
  parentId?: string | number | null;
}

export interface PurchaseOrderItemRequest {
  productId: number;
  quantity: number;
  importPrice: number;
}

export interface PurchaseOrderCreateRequest {
  supplierId: number;
  items: PurchaseOrderItemRequest[];
}

export interface PurchaseOrderItemResponse {
  id: number;
  productId: number;
  quantity: number;
  importPrice: number;
}

export interface PurchaseOrder {
  id: number;
  supplierId: number;
  createdBy?: number;
  status: 'DRAFT' | 'RECEIVED';
  totalAmount: number;
  createdAt: string;
  documentUrl?: string;
  items: PurchaseOrderItemResponse[];
}

export interface DashboardStatsResponse {
  totalRevenue: number;
  totalProfit: number;
  activeOrders: number;
  lowStockItems: number;
  pendingPurchaseOrders: number;
  recentActivities: {
    title: string;
    timeAgo: string;
    type: string;
  }[];
}

// Cart Models
export interface CartItemDto {
  id: number;
  productId: number;
  productName: string;
  productThumbnailUrl: string | null;
  productPrice: number; // BigDecimal serialised as number by Jackson
  productDiscountPrice?: number | null;
  productStock: number;
  quantity: number;
}

export interface CartDto {
  id: number;
  items: CartItemDto[];
}

// Order Models
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type DeliveryType = 'HOME_DELIVERY' | 'SHOWROOM_PICKUP';

export interface OrderItemResponse {
  id: number;
  productId: number | null;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
}

export interface OrderResponse {
  id: number;
  userId: number | null;
  username: string | null;
  email: string | null;
  totalAmount: number;
  status: OrderStatus;
  deliveryType: DeliveryType;
  recipientName: string | null;
  recipientPhone: string | null;
  shippingAddress: string | null;
  documentUrl: string | null;
  createdAt: string;
  couponCode?: string | null;
  couponDiscount?: number;
  items: OrderItemResponse[];
}

export interface OrderItemRequest {
  productId: number;
  quantity: number;
}

export interface OrderRequest {
  items: OrderItemRequest[];
  deliveryType: DeliveryType;
  recipientName?: string;
  recipientPhone?: string;
  shippingAddress?: string;
  couponCode?: string;
}

// Inventory & Issue Slip Models
export interface InventoryBatchResponse {
  id: number;
  productId: number | null;
  productName: string;
  thumbnailUrl: string | null;
  quantity: number;
  remainingQuantity: number;
  importPrice: number;
  sellingPrice: number;
  importedAt: string;
}

export interface IssueSlipItemResponse {
  id: number;
  productId: number | null;
  productName: string;
  quantity: number;
}

export interface IssueSlipResponse {
  id: number;
  code: string;
  orderId: number;
  status: 'PENDING' | 'COMPLETED';
  documentUrl: string | null;
  createdAt: string;
  completedAt: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  shippingAddress: string | null;
  deliveryType: string;
  items: IssueSlipItemResponse[];
}


// Banner & Product Image Models
export interface Banner {
  id: number;
  imageUrl: string;
  linkUrl?: string;
  displayOrder: number;
}

export interface ProductImage {
  id: number;
  url: string;
  sortOrder: number;
  createdAt: string;
}

// Admin API Services
/**
 * Dịch vụ quản trị hệ thống (Banners, Sản phẩm, Danh mục, Thương hiệu, Nhà cung cấp, Nhập hàng, Đơn hàng, Thống kê, Kho)
 */
export const adminAPI = {
  /** Lấy danh sách banner quảng cáo */
  getBanners: async (): Promise<Banner[]> => {
    const { data } = await axiosInstance.get<Banner[]>('/api/banners');
    return data;
  },

  /** Tạo banner quảng cáo mới (Upload ảnh và liên kết) */
  createBanner: async (formData: FormData): Promise<Banner> => {
    const { data } = await axiosInstance.post<Banner>('/api/banners', formData);
    return data;
  },

  /** Cập nhật thông tin và hình ảnh của một banner */
  updateBanner: async (id: number | string, formData: FormData): Promise<Banner> => {
    const { data } = await axiosInstance.put<Banner>(`/api/banners/${id}`, formData);
    return data;
  },

  /** Xóa banner quảng cáo khỏi hệ thống */
  deleteBanner: async (id: number | string): Promise<void> => {
    await axiosInstance.delete(`/api/banners/${id}`);
  },

  /** Lấy danh sách thư viện hình ảnh của một sản phẩm cụ thể */
  getProductImages: async (productId: number | string): Promise<ProductImage[]> => {
    const { data } = await axiosInstance.get<ProductImage[]>(`/api/product-images/product/${productId}`);
    return data;
  },

  /** Tải hình ảnh phụ mới lên cho một sản phẩm */
  uploadProductImage: async (productId: number | string, file: File): Promise<ProductImage> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await axiosInstance.post<ProductImage>(`/api/product-images/product/${productId}`, formData);
    return data;
  },

  /** Xóa hình ảnh sản phẩm khỏi thư viện */
  deleteProductImage: async (imageId: number | string): Promise<void> => {
    await axiosInstance.delete(`/api/product-images/${imageId}`);
  },

  /** Lấy danh sách sản phẩm phân trang, cho phép tìm kiếm, lọc theo danh mục hoặc thương hiệu */
  getProducts: async (
    page = 0,
    size = 10,
    search?: string,
    category?: string,
    brandId?: string | number,
  ): Promise<PageResponse<Product>> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });
      if (search) params.append('keyword', search);
      if (category) params.append('categoryId', category);
      if (brandId) params.append('brandId', brandId.toString());

      const { data } = await axiosInstance.get(`/api/products?${params.toString()}`);
      if (Array.isArray(data)) {
        return { content: data, totalPages: 1, totalElements: data.length, size, number: page };
      }
      return data;
    } catch (error) {
      console.error('Error fetching products:', error);
      return { content: [], totalPages: 0, totalElements: 0, size, number: page };
    }
  },

  /** Lấy thông tin chi tiết của một sản phẩm theo ID */
  getProductById: async (id: string | number): Promise<Product> => {
    const { data } = await axiosInstance.get(`/api/products/${id}`);
    return data;
  },

  /** Tạo sản phẩm mới kèm theo ảnh đại diện và thông số kĩ thuật */
  createProduct: async (formData: FormData): Promise<Product> => {
    const { data } = await axiosInstance.post<Product>('/api/admin/products', formData);
    return data;
  },

  /** Cập nhật thông tin chi tiết một sản phẩm */
  updateProduct: async (id: string | number, payload: Record<string, unknown>): Promise<Product> => {
    const { data } = await axiosInstance.put<Product>(`/api/admin/products/${id}`, payload);
    return data;
  },

  /** Xóa sản phẩm khỏi hệ thống */
  deleteProduct: async (id: string | number): Promise<void> => {
    await axiosInstance.delete(`/api/admin/products/${id}`);
  },

  /** Lấy danh sách các danh mục sản phẩm (Phân trang mặc định) */
  getCategories: async (page = 0, size = 100): Promise<PageResponse<Category>> => {
    try {
      const { data } = await axiosInstance.get(`/api/categories?page=${page}&size=${size}`);
      if (Array.isArray(data)) {
        return { content: data, totalPages: 1, totalElements: data.length, size, number: page };
      }
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { content: [], totalPages: 0, totalElements: 0, size, number: page };
    }
  },

  /** Lấy danh sách các nhà cung cấp linh kiện */
  getSuppliers: async (page = 0, size = 10): Promise<PageResponse<Supplier>> => {
    try {
      const { data } = await axiosInstance.get(`/api/admin/suppliers?page=${page}&size=${size}`);
      if (Array.isArray(data)) {
        return { content: data, totalPages: 1, totalElements: data.length, size, number: page };
      }
      return data;
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return { content: [], totalPages: 0, totalElements: 0, size, number: page };
    }
  },

  /** Tạo mới một nhà cung cấp */
  createSupplier: async (payload: Partial<Supplier>): Promise<Supplier> => {
    const { data } = await axiosInstance.post<Supplier>('/api/admin/suppliers', payload);
    return data;
  },

  /** Cập nhật thông tin chi tiết của một nhà cung cấp */
  updateSupplier: async (id: string | number, payload: Partial<Supplier>): Promise<Supplier> => {
    const { data } = await axiosInstance.put<Supplier>(`/api/admin/suppliers/${id}`, payload);
    return data;
  },

  /** Xóa nhà cung cấp khỏi danh mục quản lý */
  deleteSupplier: async (id: string | number): Promise<void> => {
    await axiosInstance.delete(`/api/admin/suppliers/${id}`);
  },

  /** Lấy danh sách toàn bộ các thương hiệu linh kiện */
  getBrands: async (page = 0, size = 10): Promise<PageResponse<Brand>> => {
    try {
      const { data } = await axiosInstance.get(`/api/brands?page=${page}&size=${size}`);
      if (Array.isArray(data)) {
        return { content: data, totalPages: 1, totalElements: data.length, size, number: page };
      }
      return data;
    } catch (error) {
      console.error('Error fetching brands:', error);
      return { content: [], totalPages: 0, totalElements: 0, size, number: page };
    }
  },

  /** Lấy danh sách toàn bộ các đơn đặt/nhập hàng từ nhà cung cấp */
  getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    try {
      const { data } = await axiosInstance.get('/api/admin/purchase-orders');
      return data;
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      return [];
    }
  },

  /** Lấy chi tiết đơn đặt nhập hàng cụ thể theo ID */
  getPurchaseOrderById: async (id: number): Promise<PurchaseOrder> => {
    const { data } = await axiosInstance.get(`/api/admin/purchase-orders/${id}`);
    return data;
  },

  /** Tạo đơn nhập hàng mới từ nhà cung cấp (Lưu bản nháp kèm tài liệu hoá đơn chứng từ) */
  createPurchaseOrder: async (request: PurchaseOrderCreateRequest, document?: File): Promise<PurchaseOrder> => {
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (document) {
      formData.append('document', document);
    }
    const { data } = await axiosInstance.post('/api/admin/purchase-orders', formData);
    return data;
  },

  /** Xác nhận nhập kho thực tế cho đơn nhập hàng và cập nhật lại đơn giá nhập kho */
  receivePurchaseOrder: async (id: number, newPrices?: Record<number, number>): Promise<PurchaseOrder> => {
    const { data } = await axiosInstance.put(`/api/admin/purchase-orders/${id}/receive`, newPrices || {});
    return data;
  },

  /** Tạo thương hiệu sản phẩm mới */
  createBrand: async (formData: FormData): Promise<Brand> => {
    const { data } = await axiosInstance.post<Brand>('/api/admin/brands', formData);
    return data;
  },

  /** Cập nhật logo hoặc thông tin của một thương hiệu */
  updateBrand: async (id: string | number, formData: FormData): Promise<Brand> => {
    const { data } = await axiosInstance.put<Brand>(`/api/admin/brands/${id}`, formData);
    return data;
  },

  /** Xóa thương hiệu sản phẩm */
  deleteBrand: async (id: string | number): Promise<void> => {
    await axiosInstance.delete(`/api/admin/brands/${id}`);
  },

  /** Lấy các chỉ số báo cáo tổng quan (doanh thu, lợi nhuận, đơn bán hàng, cảnh báo kho) của Dashboard admin */
  getDashboardStats: async (): Promise<DashboardStatsResponse> => {
    const { data } = await axiosInstance.get<DashboardStatsResponse>('/api/admin/dashboard/stats');
    return data;
  },

  /** Lấy danh sách chi tiết các lô hàng/bạch hàng trong kho kèm hạn sử dụng và số lượng còn lại */
  getInventoryBatches: async (page = 0, size = 10): Promise<PageResponse<InventoryBatchResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<InventoryBatchResponse>>(`/api/admin/inventory/batches?page=${page}&size=${size}`);
    return data;
  },

  /** Lấy danh sách các phiếu xuất kho linh kiện */
  getIssueSlips: async (page = 0, size = 10): Promise<PageResponse<IssueSlipResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<IssueSlipResponse>>(`/api/admin/inventory/issue-slips?page=${page}&size=${size}`);
    return data;
  },

  /** Cập nhật giá nhập kho và giá niêm yết bán lẻ cho một lô hàng tồn kho */
  updateInventoryPrices: async (id: number, importPrice: number, sellingPrice: number): Promise<void> => {
    await axiosInstance.put(`/api/admin/inventory/batches/${id}/prices?importPrice=${importPrice}&sellingPrice=${sellingPrice}`);
  },

  /** Tạo phiếu xuất kho mới tương ứng với một đơn bán hàng */
  createIssueSlip: async (orderId: number): Promise<IssueSlipResponse> => {
    const { data } = await axiosInstance.post<IssueSlipResponse>(`/api/admin/inventory/issue-slips/create?orderId=${orderId}`);
    return data;
  },

  /** Phê duyệt hoàn tất xuất kho thực tế, chuyển trạng thái đơn hàng sang ĐANG GIAO */
  dispatchIssueSlip: async (id: number): Promise<IssueSlipResponse> => {
    const { data } = await axiosInstance.post<IssueSlipResponse>(`/api/admin/inventory/issue-slips/${id}/dispatch`);
    return data;
  },

  // Promotions Management
  getPromotions: async (): Promise<Promotion[]> => {
    const { data } = await axiosInstance.get<Promotion[]>('/api/admin/promotions');
    return data;
  },
  getPromotionById: async (id: number | string): Promise<Promotion> => {
    const { data } = await axiosInstance.get<Promotion>(`/api/admin/promotions/${id}`);
    return data;
  },
  createPromotion: async (payload: PromotionRequest): Promise<Promotion> => {
    const { data } = await axiosInstance.post<Promotion>('/api/admin/promotions', payload);
    return data;
  },
  updatePromotion: async (id: number | string, payload: PromotionRequest): Promise<Promotion> => {
    const { data } = await axiosInstance.put<Promotion>(`/api/admin/promotions/${id}`, payload);
    return data;
  },
  deletePromotion: async (id: number | string): Promise<void> => {
    await axiosInstance.delete(`/api/admin/promotions/${id}`);
  },

  // Coupons Management
  getCoupons: async (): Promise<Coupon[]> => {
    const { data } = await axiosInstance.get<Coupon[]>('/api/admin/coupons');
    return data;
  },
  getCouponById: async (id: number | string): Promise<Coupon> => {
    const { data } = await axiosInstance.get<Coupon>(`/api/admin/coupons/${id}`);
    return data;
  },
  createCoupon: async (payload: CouponRequest): Promise<Coupon> => {
    const { data } = await axiosInstance.post<Coupon>('/api/admin/coupons', payload);
    return data;
  },
  updateCoupon: async (id: number | string, payload: CouponRequest): Promise<Coupon> => {
    const { data } = await axiosInstance.put<Coupon>(`/api/admin/coupons/${id}`, payload);
    return data;
  },
  deleteCoupon: async (id: number | string): Promise<void> => {
    await axiosInstance.delete(`/api/admin/coupons/${id}`);
  },
};

// Cart API Services
/**
 * Dịch vụ giỏ hàng (Xem giỏ hàng, Thêm sản phẩm, Sửa số lượng, Xóa linh kiện khỏi giỏ)
 */
export const cartAPI = {
  /** Lấy thông tin chi tiết giỏ hàng hiện tại */
  getCart: async (): Promise<CartDto> => {
    const { data } = await axiosInstance.get<CartDto>('/api/cart');
    return data;
  },

  /** Thêm mới sản phẩm vào giỏ hàng kèm theo số lượng cụ thể */
  addToCart: async (productId: number | string, quantity: number): Promise<CartDto> => {
    const { data } = await axiosInstance.post<CartDto>('/api/cart/items', { productId, quantity });
    return data;
  },

  /** Cập nhật số lượng mới của một linh kiện nằm trong giỏ hàng */
  updateQuantity: async (itemId: number | string, quantity: number): Promise<CartDto> => {
    const { data } = await axiosInstance.put<CartDto>(`/api/cart/items/${itemId}`, { quantity });
    return data;
  },

  /** Xóa bỏ hoàn toàn một mặt hàng khỏi giỏ hàng */
  removeItem: async (itemId: number | string): Promise<CartDto> => {
    const { data } = await axiosInstance.delete<CartDto>(`/api/cart/items/${itemId}`);
    return data;
  },

  /** Làm rỗng toàn bộ giỏ hàng */
  clearCart: async (): Promise<void> => {
    await axiosInstance.delete('/api/cart');
  }
};

// Order API Services
/**
 * Dịch vụ đơn đặt hàng (Tạo đơn mua hàng, Lấy danh sách đơn, Xem chi tiết, [Admin] Phê duyệt & Cập nhật trạng thái)
 */
export const orderAPI = {
  /** Tạo đơn mua hàng mới từ giỏ hàng hiện tại */
  create: async (request: OrderRequest): Promise<OrderResponse> => {
    const { data } = await axiosInstance.post<OrderResponse>('/api/orders', request);
    return data;
  },

  /** Lấy lịch sử mua hàng của khách hàng hiện tại */
  list: async (): Promise<OrderResponse[]> => {
    const { data } = await axiosInstance.get<OrderResponse[]>('/api/orders');
    return data;
  },

  /** Lấy thông tin chi tiết một đơn đặt hàng theo ID đơn */
  getById: async (id: number): Promise<OrderResponse> => {
    const { data } = await axiosInstance.get<OrderResponse>(`/api/orders/${id}`);
    return data;
  },

  /** [Admin] Lấy danh sách toàn bộ các đơn đặt hàng trong hệ thống */
  adminListAll: async (): Promise<OrderResponse[]> => {
    const { data } = await axiosInstance.get<OrderResponse[]>('/api/orders/admin/all');
    return data;
  },

  /** [Admin] Lấy chi tiết đơn đặt hàng theo ID đơn */
  adminGetById: async (id: number): Promise<OrderResponse> => {
    const { data } = await axiosInstance.get<OrderResponse>(`/api/orders/admin/${id}`);
    return data;
  },

  /** [Admin] Phê duyệt/Chấp thuận đơn hàng (Xác nhận đơn hàng hợp lệ) */
  adminConfirm: async (id: number): Promise<OrderResponse> => {
    const { data } = await axiosInstance.put<OrderResponse>(`/api/orders/admin/${id}/confirm`);
    return data;
  },

  /** [Admin] Cập nhật trạng thái xử lý đơn đặt hàng */
  adminUpdateStatus: async (id: number, status: OrderStatus): Promise<OrderResponse> => {
    const { data } = await axiosInstance.put<OrderResponse>(`/api/orders/admin/${id}/status`, { status });
    return data;
  },
};

export interface PcBuildItemResponse {
  id: number;
  productId: number | null;
  componentType: string;
}

export interface PcBuildResponse {
  id: number;
  userId: number | null;
  name: string;
  totalPrice: number;
  totalPower: number;
  createdAt: string;
  items: PcBuildItemResponse[];
}

// ─── Custom PC Build API ───────────────────────────────────────────────────
/**
 * Dịch vụ thiết kế và quản lý cấu hình PC tự chọn (Tạo bản lưu, Lấy danh sách bản lưu, Thêm linh kiện vào khe, Xóa cấu hình)
 */
export const buildAPI = {
  /** Lưu thông tin cấu hình PC tự ráp mới */
  create: async (name: string): Promise<PcBuildResponse> => {
    const { data } = await axiosInstance.post<PcBuildResponse>('/api/builds', { name });
    return data;
  },

  /** Lấy danh sách toàn bộ các cấu hình PC tự ráp đã lưu của người dùng */
  list: async (): Promise<PcBuildResponse[]> => {
    const { data } = await axiosInstance.get<PcBuildResponse[]>('/api/builds');
    return data;
  },

  /** Lấy chi tiết thông tin cấu hình PC đã lưu theo ID */
  getById: async (id: number): Promise<PcBuildResponse> => {
    const { data } = await axiosInstance.get<PcBuildResponse>(`/api/builds/${id}`);
    return data;
  },

  /** Thêm mới/Liên kết linh kiện sản phẩm vào một khe chỉ định của PC cấu hình */
  addItem: async (buildId: number, productId: number, componentType: string): Promise<PcBuildResponse> => {
    const { data } = await axiosInstance.post<PcBuildResponse>(`/api/builds/${buildId}/items`, {
      productId,
      componentType
    });
    return data;
  },

  /** Xóa cấu hình PC tự ráp khỏi danh mục lưu trữ */
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/api/builds/${id}`);
  }
};

// ─── Promotion & Coupon Interfaces ──────────────────────────────────────────

export interface Promotion {
  id: number;
  name: string;
  slug: string;
  description?: string;
  bannerUrl?: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  active: boolean;
  productIds: number[];
  createdAt: string;
}

export interface PromotionResponseWithProducts extends Omit<Promotion, 'productIds'> {
  products: Product[];
}

export interface PromotionRequest {
  name: string;
  slug: string;
  description?: string;
  bannerUrl?: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  active?: boolean;
  productIds?: number[];
}

export interface Coupon {
  id: number;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  startDate: string;
  endDate: string;
  usageLimit?: number | null;
  usageCount: number;
  active: boolean;
  createdAt: string;
}

export interface CouponRequest {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number | null;
  startDate: string;
  endDate: string;
  usageLimit?: number | null;
  active?: boolean;
}

export interface CouponValidationResponse {
  valid: boolean;
  code: string;
  discountAmount: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
}

// ─── Public Customer Promotion & Coupon API ─────────────────────────────────

export const promotionAPI = {
  /** Lấy danh sách tất cả các chương trình khuyến mãi đang hoạt động */
  listActive: async (): Promise<Promotion[]> => {
    const { data } = await axiosInstance.get<Promotion[]>('/api/promotions/active');
    return data;
  },

  /** Lấy thông tin chi tiết của một chương trình khuyến mãi kèm các sản phẩm được giảm giá */
  getBySlug: async (slug: string): Promise<PromotionResponseWithProducts> => {
    const { data } = await axiosInstance.get<PromotionResponseWithProducts>(`/api/promotions/${slug}`);
    return data;
  }
};

export const couponAPI = {
  /** Kiểm tra mã giảm giá và tính toán số tiền được chiết khấu */
  validate: async (code: string, amount: number): Promise<CouponValidationResponse> => {
    const { data } = await axiosInstance.get<CouponValidationResponse>(
      `/api/coupons/validate?code=${encodeURIComponent(code)}&amount=${amount}`
    );
    return data;
  }
};

// ─── Chatbot RAG API ─────────────────────────────────────────────────────────
import type { ChatHistoryItem, ChatResponse as ChatbotResponse } from './types/chatbot';

/**
 * Dịch vụ chatbot RAG (Ollama + PGVector)
 * Giao tiếp với Spring AI backend để tư vấn linh kiện PC theo ngữ nghĩa.
 */
export const chatbotAPI = {
  /**
   * Gửi tin nhắn và nhận câu trả lời AI kèm sản phẩm đề xuất.
   */
  chat: async (message: string, history: ChatHistoryItem[] = []): Promise<ChatbotResponse> => {
    const { data } = await axiosInstance.post<ChatbotResponse>('/api/chat', {
      message,
      history,
    });
    return data;
  },
};

/**
 * Dịch vụ quản trị chatbot (chỉ dành cho ADMIN)
 */
export const adminChatbotAPI = {
  /** Reindex toàn bộ catalog sản phẩm vào PGVector */
  reindex: async (): Promise<{ success: boolean; indexedProducts: number; durationMs: number; message: string }> => {
    const { data } = await axiosInstance.post('/api/admin/chatbot/reindex');
    return data;
  },

  /** Lấy trạng thái hiện tại của vector store */
  getStatus: async (): Promise<{ indexableProducts: number; chatModel: string; embeddingModel: string; message: string }> => {
    const { data } = await axiosInstance.get('/api/admin/chatbot/status');
    return data;
  },
};

// ─── Bottleneck Analysis API ──────────────────────────────────────────────────

export interface BottleneckResponse {
  id: number | null;
  cpuProductId: number;
  gpuProductId: number;
  cpuName: string;
  gpuName: string;
  resolution: string;
  bottleneckPercent: number;
  bottleneckSide: 'CPU' | 'GPU' | 'BALANCED';
  fpsEstimate: number;
  recommendations: string[];
  details: Record<string, unknown>;
}

/**
 * Dịch vụ phân tích nghẽn cổ chai (Bottleneck) giữa CPU và GPU
 * Sử dụng mô hình ML (LightGBM) với fallback về dữ liệu tĩnh
 */
export const bottleneckAPI = {
  /** Phân tích mức độ nghẽn giữa CPU và GPU tại một độ phân giải cho trước */
  analyze: async (cpuId: number, gpuId: number, resolution: string = '1080p'): Promise<BottleneckResponse> => {
    const { data } = await axiosInstance.get<BottleneckResponse>(
      `/api/bottleneck?cpuId=${cpuId}&gpuId=${gpuId}&res=${encodeURIComponent(resolution)}`
    );
    return data;
  },
};
