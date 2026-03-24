'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

// AIDEV-NOTE: Extended role types for RBAC system
// Hierarchy: OWNER > ADMIN > MANAGER > MEMBER > CLIENT
export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'CLIENT' | 'USER';

// AIDEV-NOTE: Role hierarchy levels
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  OWNER: 100,
  ADMIN: 80,
  MANAGER: 60,
  MEMBER: 40,
  CLIENT: 20,
  USER: 40, // USER is alias for MEMBER
};

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  teamId?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  // AIDEV-NOTE: Role-based helper functions
  isOwner: () => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isMember: () => boolean;
  isClient: () => boolean;
  hasRole: (roles: UserRole[]) => boolean;
  hasMinRole: (minRole: UserRole) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password,
          });
          const { user, accessToken } = response.data;
          set({ user, token: accessToken, isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/auth/register`, {
            email,
            password,
            name,
          });
          const { user, accessToken } = response.data;
          set({ user, token: accessToken, isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null });
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true });
        try {
          const response = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          set({ user: response.data.user, isLoading: false });
        } catch (error) {
          set({ user: null, token: null, isLoading: false });
        }
      },

      // AIDEV-NOTE: Role-based helper functions
      isOwner: () => {
        const { user } = get();
        return user?.role === 'OWNER';
      },

      isAdmin: () => {
        const { user } = get();
        return user?.role === 'OWNER' || user?.role === 'ADMIN';
      },

      isManager: () => {
        const { user } = get();
        return user?.role === 'OWNER' || user?.role === 'ADMIN' || user?.role === 'MANAGER';
      },

      isMember: () => {
        const { user } = get();
        return user?.role === 'MEMBER' || user?.role === 'USER';
      },

      isClient: () => {
        const { user } = get();
        return user?.role === 'CLIENT';
      },

      hasRole: (roles: UserRole[]) => {
        const { user } = get();
        return user ? roles.includes(user.role) : false;
      },

      hasMinRole: (minRole: UserRole) => {
        const { user } = get();
        if (!user) return false;
        const userRole = user.role === 'USER' ? 'MEMBER' : user.role;
        return ROLE_HIERARCHY[userRole as UserRole] >= ROLE_HIERARCHY[minRole];
      },

      // AIDEV-NOTE: Check if user has access to admin features
      hasAdminAccess: () => {
        const { user } = get();
        return user?.role === 'OWNER' || user?.role === 'ADMIN';
      },
    }),
    {
      name: 'workmetrics-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

// API client with auth interceptor and retry logic
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
});

// Extend axios config type to include retry properties
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    retryCount?: number;
    _retry?: boolean;
  }
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// AIDEV-NOTE: Retry logic for failed requests
const retryRequest = async (error: any, retryCount: number = 0) => {
  const shouldRetry =
    retryCount < MAX_RETRIES &&
    (error.code === 'ECONNABORTED' ||
      error.response?.status === 503 ||
      error.response?.status === 502 ||
      error.response?.status === 504);

  if (!shouldRetry) {
    return Promise.reject(error);
  }

  // Wait before retrying
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));

  return api(error.config);
};

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // AIDEV-NOTE: Add retry count to config for tracking
  config.retryCount = config.retryCount || 0;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // AIDEV-NOTE: Check if we should retry
    if (config && !config._retry) {
      config._retry = true;
      try {
        return await retryRequest(error, config.retryCount);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  }
);

// AIDEV-NOTE: Helper function to get user-friendly error messages
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }
  if (error.response?.status === 503) {
    return 'Service is temporarily unavailable. Please try again later.';
  }
  if (error.response?.status === 500) {
    return 'Server error. Please try again later.';
  }
  if (!error.response) {
    return 'Network error. Please check your connection.';
  }
  return 'An unexpected error occurred. Please try again.';
};
