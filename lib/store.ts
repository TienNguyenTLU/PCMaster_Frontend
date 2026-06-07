import { create } from 'zustand';
import { authAPI, AuthResponse, cartAPI, CartItemDto } from './api';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'CUSTOMER';
}

interface AuthStore {
  user: User | null;
  token: string | null;
  /** True once we've checked localStorage on the client — prevents flash */
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  /** Call once on client mount to restore session from localStorage */
  hydrate: () => void;
}

// ─── JWT Utilities ───────────────────────────────────────────────────────────

interface JwtPayload {
  sub: string;       // userId (set as subject in backend)
  username: string;  // claim added by JwtTokenProvider
  role: string;      // claim added by JwtTokenProvider
  exp: number;       // expiry in seconds
  iat: number;
}

/**
 * Decode the JWT payload without verifying the signature (client-side only).
 * The backend will reject the token via 401 if tampered with.
 */
function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    // atob is available in all modern browsers and Next.js Edge runtime
    const json = atob(base64Url.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** Returns true if the token exists and has not expired yet (10s grace window). */
function isTokenAlive(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  return payload.exp * 1000 > Date.now() - 10_000;
}

/** Build a User object from a decoded JWT payload. */
function userFromPayload(payload: JwtPayload): User {
  return {
    id: payload.sub,
    username: payload.username,
    // email is not in the JWT claims — we get it from the login response
    // and store it separately in a lightweight way below
    email: '',
    role: payload.role as 'ADMIN' | 'CUSTOMER',
  };
}

// ─── localStorage helpers ────────────────────────────────────────────────────
// Only token is persisted. User info is derived from the JWT on every hydration
// so it's always in sync with the token. Email (not in JWT) is stored separately.

const TOKEN_KEY = 'authToken';
const EMAIL_KEY = 'authEmail';

function saveSession(token: string, email: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
  // Also clear any leftover keys from the old implementation
  localStorage.removeItem('user');
  localStorage.removeItem('auth-store');
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  token: null,
  isHydrated: false,
  isLoading: false,
  error: null,

  // ── Login ────────────────────────────────────────────────────────────────
  login: async (usernameOrEmail: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res: AuthResponse = await authAPI.login({ usernameOrEmail, password });

      // Backend returns flat fields: token, userId, username, email, role
      saveSession(res.token, res.email);

      const user: User = {
        id: String(res.userId),
        username: res.username,
        email: res.email,
        role: res.role,
      };

      set({ user, token: res.token, isLoading: false, isHydrated: true });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Đăng nhập thất bại';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  // ── Signup ───────────────────────────────────────────────────────────────
  signup: async (username: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res: AuthResponse = await authAPI.signup({ username, email, password });

      saveSession(res.token, res.email);

      const user: User = {
        id: String(res.userId),
        username: res.username,
        email: res.email,
        role: res.role,
      };

      set({ user, token: res.token, isLoading: false, isHydrated: true });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Đăng ký thất bại';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  // ── Login With Google ────────────────────────────────────────────────────
  loginWithGoogle: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const res: AuthResponse = await authAPI.loginWithGoogle(idToken);

      saveSession(res.token, res.email);

      const user: User = {
        id: String(res.userId),
        username: res.username,
        email: res.email,
        role: res.role,
      };

      set({ user, token: res.token, isLoading: false, isHydrated: true });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Đăng nhập Google thất bại';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  // ── Logout ───────────────────────────────────────────────────────────────
  logout: () => {
    clearSession();
    set({ user: null, token: null, error: null, isHydrated: true });
  },

  // ── Clear error ──────────────────────────────────────────────────────────
  clearError: () => set({ error: null }),

  // ── Hydrate (call once on client mount) ──────────────────────────────────
  hydrate: () => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      set({ isHydrated: true });
      return;
    }

    if (!isTokenAlive(token)) {
      // Token expired — wipe storage and mark as logged-out
      clearSession();
      set({ user: null, token: null, isHydrated: true });
      return;
    }

    // Token is valid — restore user from JWT claims + stored email
    const payload = decodeJwt(token);
    if (!payload) {
      clearSession();
      set({ user: null, token: null, isHydrated: true });
      return;
    }

    const email = localStorage.getItem(EMAIL_KEY) ?? '';
    const user: User = { ...userFromPayload(payload), email };

    set({ user, token, isHydrated: true });
  },
}));

// ─── Exported helper for axiosInstance 401 handler ──────────────────────────
export function forceLogout() {
  if (typeof window !== 'undefined') {
    clearSession();
  }
  useAuthStore.setState({ user: null, token: null, isHydrated: true });
}

// ─── Cart Store ──────────────────────────────────────────────────────────────

interface CartStore {
  items: CartItemDto[];
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: number | string, quantity?: number) => Promise<void>;
  removeItem: (itemId: number | string) => Promise<void>;
  updateQuantity: (itemId: number | string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartStore>()((set) => ({
  items: [],
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const cart = await cartAPI.getCart();
      set({ items: cart.items, isLoading: false });
    } catch (err) {
      console.error('Lỗi khi tải giỏ hàng', err);
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity = 1) => {
    set({ isLoading: true });
    try {
      const cart = await cartAPI.addToCart(productId, quantity);
      set({ items: cart.items, isLoading: false });
    } catch (err) {
      console.error('Lỗi khi thêm vào giỏ hàng', err);
      set({ isLoading: false });
      throw err;
    }
  },

  removeItem: async (itemId) => {
    set({ isLoading: true });
    try {
      const cart = await cartAPI.removeItem(itemId);
      set({ items: cart.items, isLoading: false });
    } catch (err) {
      console.error('Lỗi khi xóa khỏi giỏ hàng', err);
      set({ isLoading: false });
    }
  },

  updateQuantity: async (itemId, quantity) => {
    set({ isLoading: true });
    try {
      const cart = await cartAPI.updateQuantity(itemId, quantity);
      set({ items: cart.items, isLoading: false });
    } catch (err) {
      console.error('Lỗi khi cập nhật số lượng', err);
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    set({ isLoading: true });
    try {
      await cartAPI.clearCart();
      set({ items: [], isLoading: false });
    } catch (err) {
      console.error('Lỗi khi xóa giỏ hàng', err);
      set({ isLoading: false });
    }
  },
}));
