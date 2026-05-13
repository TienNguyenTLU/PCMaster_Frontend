import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, AuthResponse } from './api';

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'CUSTOMER';
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  hydrate: () => void;
}

/** Persist token in localStorage AND as cookies for middleware access */
function persistAuthData(response: AuthResponse) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('authToken', response.token);
  localStorage.setItem('user', JSON.stringify(response.user));
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  document.cookie = `authToken=${response.token}; path=/; max-age=${maxAge}`;
  // Encode user object so middleware can read the role without decoding JWT
  document.cookie = `user=${encodeURIComponent(JSON.stringify(response.user))}; path=/; max-age=${maxAge}`;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (usernameOrEmail: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login({ usernameOrEmail, password });
          persistAuthData(response);
          set({ user: response.user as User, token: response.token, isLoading: false });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Login failed';
          set({ error: errorMessage, isLoading: false });
          throw err;
        }
      },

      signup: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.signup({ username, email, password });
          persistAuthData(response);
          set({ user: response.user as User, token: response.token, isLoading: false });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Signup failed';
          set({ error: errorMessage, isLoading: false });
          throw err;
        }
      },

      logout: () => {
        authAPI.logout();
        set({ user: null, token: null, error: null });
      },

      clearError: () => set({ error: null }),

      hydrate: () => {
        const token = authAPI.getStoredToken();
        const user = authAPI.getStoredUser();
        if (token && user) {
          set({ token, user });
        }
      },
    }),
    {
      name: 'auth-store',
      skipHydration: true,
    },
  ),
);
