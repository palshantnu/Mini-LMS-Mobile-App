import { create } from "zustand";
import { authService } from "../services/authService";
import { storageService } from "../services/storageService";
import { LoginInput, RegisterInput, User } from "../types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  updateUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    try {
      const hasToken = await authService.hasValidToken();
      if (!hasToken) {
        set({ isInitialized: true, isAuthenticated: false });
        return;
      }

      // Show cached user instantly so app feels fast
      const storedUser = await storageService.getUser();
      if (storedUser) {
        set({ user: storedUser, isAuthenticated: true, isInitialized: true });
      }

      // Try to refresh user data from API in background
      try {
        const freshUser = await authService.getCurrentUser();
        await storageService.saveUser(freshUser);
        set({ user: freshUser, isAuthenticated: true, isInitialized: true });
      } catch (apiError) {
        const status = (apiError as { statusCode?: number })?.statusCode;
        if (status === 401) {
          // Token is actually expired/invalid — logout
          await storageService.clearAll();
          set({ isAuthenticated: false, isInitialized: true, user: null });
        } else {
          // Network/server error — keep cached session alive
          set({ isInitialized: true });
        }
      }
    } catch {
      // SecureStore or AsyncStorage failure — stay logged out
      set({ isAuthenticated: false, isInitialized: true, user: null });
    }
  },

  login: async (credentials: LoginInput) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authService.login(credentials);
      await storageService.saveUser(user);
      await storageService.updateLastActive();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const message = (err as { message?: string })?.message ?? "Login failed";
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  register: async (input: RegisterInput) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authService.register(input);
      await storageService.saveUser(user);
      await storageService.updateLastActive();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const message = (err as { message?: string })?.message ?? "Registration failed";
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      await storageService.clearAll();
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  updateUser: (user: User) => {
    set({ user });
    storageService.saveUser(user);
  },

  clearError: () => set({ error: null }),
}));
