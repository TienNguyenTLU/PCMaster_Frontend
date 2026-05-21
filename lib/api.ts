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
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post<AuthResponse>('/api/auth/login', {
      usernameOrEmail: credentials.usernameOrEmail,
      password: credentials.password,
    });
    return data;
  },

  signup: async (payload: SignupRequest): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post<AuthResponse>('/api/auth/register', {
      username: payload.username,
      email: payload.email,
      password: payload.password,
    });
    return data;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  },

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
export interface Product {
  id: string | number;
  categoryId?: string | number;
  brandId?: string | number;
  name: string;
  slug?: string;
  price: number;
  stock: number;
  description?: string;
  specsJson?: string;
  thumbnailUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  category?: { id: string | number; name: string; slug?: string; parentId?: string | number | null };
  brand?: { id: string | number; name: string; logoUrl?: string };
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
export const adminAPI = {
  getBanners: async (): Promise<Banner[]> => {
    const { data } = await axiosInstance.get<Banner[]>('/api/banners');
    return data;
  },

  createBanner: async (formData: FormData): Promise<Banner> => {
    const { data } = await axiosInstance.post<Banner>('/api/banners', formData);
    return data;
  },

  updateBanner: async (id: number | string, formData: FormData): Promise<Banner> => {
    const { data } = await axiosInstance.put<Banner>(`/api/banners/${id}`, formData);
    return data;
  },

  deleteBanner: async (id: number | string): Promise<void> => {
    await axiosInstance.delete(`/api/banners/${id}`);
  },

  getProductImages: async (productId: number | string): Promise<ProductImage[]> => {
    const { data } = await axiosInstance.get<ProductImage[]>(`/api/product-images/product/${productId}`);
    return data;
  },

  uploadProductImage: async (productId: number | string, file: File): Promise<ProductImage> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await axiosInstance.post<ProductImage>(`/api/product-images/product/${productId}`, formData);
    return data;
  },

  deleteProductImage: async (imageId: number | string): Promise<void> => {
    await axiosInstance.delete(`/api/product-images/${imageId}`);
  },

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

  getProductById: async (id: string | number): Promise<Product> => {
    const { data } = await axiosInstance.get(`/api/products/${id}`);
    return data;
  },

  createProduct: async (formData: FormData): Promise<Product> => {
    const { data } = await axiosInstance.post<Product>('/api/admin/products', formData);
    return data;
  },

  updateProduct: async (id: string | number, payload: Record<string, unknown>): Promise<Product> => {
    const { data } = await axiosInstance.put<Product>(`/api/admin/products/${id}`, payload);
    return data;
  },

  deleteProduct: async (id: string | number): Promise<void> => {
    await axiosInstance.delete(`/api/admin/products/${id}`);
  },

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

  createSupplier: async (payload: Partial<Supplier>): Promise<Supplier> => {
    const { data } = await axiosInstance.post<Supplier>('/api/admin/suppliers', payload);
    return data;
  },

  updateSupplier: async (id: string | number, payload: Partial<Supplier>): Promise<Supplier> => {
    const { data } = await axiosInstance.put<Supplier>(`/api/admin/suppliers/${id}`, payload);
    return data;
  },

  deleteSupplier: async (id: string | number): Promise<void> => {
    await axiosInstance.delete(`/api/admin/suppliers/${id}`);
  },

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

  getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    try {
      const { data } = await axiosInstance.get('/api/admin/purchase-orders');
      return data;
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      return [];
    }
  },

  getPurchaseOrderById: async (id: number): Promise<PurchaseOrder> => {
    const { data } = await axiosInstance.get(`/api/admin/purchase-orders/${id}`);
    return data;
  },

  createPurchaseOrder: async (request: PurchaseOrderCreateRequest, document?: File): Promise<PurchaseOrder> => {
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (document) {
      formData.append('document', document);
    }
    const { data } = await axiosInstance.post('/api/admin/purchase-orders', formData);
    return data;
  },

  receivePurchaseOrder: async (id: number, newPrices?: Record<number, number>): Promise<PurchaseOrder> => {
    const { data } = await axiosInstance.put(`/api/admin/purchase-orders/${id}/receive`, newPrices || {});
    return data;
  },

  createBrand: async (formData: FormData): Promise<Brand> => {
    const { data } = await axiosInstance.post<Brand>('/api/admin/brands', formData);
    return data;
  },

  updateBrand: async (id: string | number, formData: FormData): Promise<Brand> => {
    const { data } = await axiosInstance.put<Brand>(`/api/admin/brands/${id}`, formData);
    return data;
  },

  deleteBrand: async (id: string | number): Promise<void> => {
    await axiosInstance.delete(`/api/admin/brands/${id}`);
  },

  getDashboardStats: async (): Promise<DashboardStatsResponse> => {
    const { data } = await axiosInstance.get<DashboardStatsResponse>('/api/admin/dashboard/stats');
    return data;
  },

  getInventoryBatches: async (page = 0, size = 10): Promise<PageResponse<InventoryBatchResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<InventoryBatchResponse>>(`/api/admin/inventory/batches?page=${page}&size=${size}`);
    return data;
  },

  getIssueSlips: async (page = 0, size = 10): Promise<PageResponse<IssueSlipResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<IssueSlipResponse>>(`/api/admin/inventory/issue-slips?page=${page}&size=${size}`);
    return data;
  },

  updateInventoryPrices: async (id: number, importPrice: number, sellingPrice: number): Promise<void> => {
    await axiosInstance.put(`/api/admin/inventory/batches/${id}/prices?importPrice=${importPrice}&sellingPrice=${sellingPrice}`);
  },

  createIssueSlip: async (orderId: number): Promise<IssueSlipResponse> => {
    const { data } = await axiosInstance.post<IssueSlipResponse>(`/api/admin/inventory/issue-slips/create?orderId=${orderId}`);
    return data;
  },

  dispatchIssueSlip: async (id: number): Promise<IssueSlipResponse> => {
    const { data } = await axiosInstance.post<IssueSlipResponse>(`/api/admin/inventory/issue-slips/${id}/dispatch`);
    return data;
  },
};

// Cart API Services
export const cartAPI = {
  getCart: async (): Promise<CartDto> => {
    const { data } = await axiosInstance.get<CartDto>('/api/cart');
    return data;
  },

  addToCart: async (productId: number | string, quantity: number): Promise<CartDto> => {
    const { data } = await axiosInstance.post<CartDto>('/api/cart/items', { productId, quantity });
    return data;
  },

  updateQuantity: async (itemId: number | string, quantity: number): Promise<CartDto> => {
    const { data } = await axiosInstance.put<CartDto>(`/api/cart/items/${itemId}`, { quantity });
    return data;
  },

  removeItem: async (itemId: number | string): Promise<CartDto> => {
    const { data } = await axiosInstance.delete<CartDto>(`/api/cart/items/${itemId}`);
    return data;
  },

  clearCart: async (): Promise<void> => {
    await axiosInstance.delete('/api/cart');
  }
};

// Order API Services
export const orderAPI = {
  create: async (request: OrderRequest): Promise<OrderResponse> => {
    const { data } = await axiosInstance.post<OrderResponse>('/api/orders', request);
    return data;
  },

  list: async (): Promise<OrderResponse[]> => {
    const { data } = await axiosInstance.get<OrderResponse[]>('/api/orders');
    return data;
  },

  getById: async (id: number): Promise<OrderResponse> => {
    const { data } = await axiosInstance.get<OrderResponse>(`/api/orders/${id}`);
    return data;
  },

  // Admin
  adminListAll: async (): Promise<OrderResponse[]> => {
    const { data } = await axiosInstance.get<OrderResponse[]>('/api/orders/admin/all');
    return data;
  },

  adminGetById: async (id: number): Promise<OrderResponse> => {
    const { data } = await axiosInstance.get<OrderResponse>(`/api/orders/admin/${id}`);
    return data;
  },

  adminConfirm: async (id: number): Promise<OrderResponse> => {
    const { data } = await axiosInstance.put<OrderResponse>(`/api/orders/admin/${id}/confirm`);
    return data;
  },

  adminUpdateStatus: async (id: number, status: OrderStatus): Promise<OrderResponse> => {
    const { data } = await axiosInstance.put<OrderResponse>(`/api/orders/admin/${id}/status`, { status });
    return data;
  },
};

