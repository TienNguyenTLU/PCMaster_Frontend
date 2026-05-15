import axiosInstance from './axiosInstance';

// API Response interfaces
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: 'ADMIN' | 'CUSTOMER';
  };
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

// Auth API – uses axios interceptor (token auto-attached on subsequent requests)
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
      localStorage.removeItem('user');
      // Also clear the cookies used by middleware
      document.cookie = 'authToken=; path=/; max-age=0';
      document.cookie = 'user=; path=/; max-age=0';
    }
  },

  getStoredUser: () => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getStoredToken: () => {
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
  // Nested objects returned by the API
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
  activeOrders: number;
  lowStockItems: number;
  pendingPurchaseOrders: number;
  recentActivities: {
    title: string;
    timeAgo: string;
    type: string;
  }[];
}

// Admin API Services
export const adminAPI = {
  getProducts: async (
    page = 0, 
    size = 10, 
    search?: string, 
    category?: string, 
    brandId?: string | number
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
      // Handle cases where backend might return direct array or paginated object
      if (Array.isArray(data)) {
        return { content: data, totalPages: 1, totalElements: data.length, size, number: page };
      }
      return data;
    } catch (error) {
      console.error('Error fetching products:', error);
      return { content: [], totalPages: 0, totalElements: 0, size, number: page };
    }
  },

  createProduct: async (formData: FormData): Promise<Product> => {
    const { data } = await axiosInstance.post<Product>('/api/admin/products', formData);
    return data;
  },

  updateProduct: async (id: string | number, payload: Record<string, any>): Promise<Product> => {
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
};
