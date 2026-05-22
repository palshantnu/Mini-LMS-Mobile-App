import * as SecureStore from "expo-secure-store";
import { api } from "./api";
import { STORAGE_KEYS } from "../constants";
import {
  ApiResponse,
  AuthResponse,
  LoginInput,
  RegisterInput,
  User,
} from "../types";

export const authService = {
  async login(credentials: LoginInput): Promise<AuthResponse> {
    const { data } = await api.post<ApiResponse<AuthResponse>>(
      "/api/v1/users/login",
      credentials
    );
    await persistTokens(data.data.accessToken, data.data.refreshToken);
    return data.data;
  },

  async register(input: RegisterInput): Promise<AuthResponse> {
    await api.post<ApiResponse<{ user: User }>>(
      "/api/v1/users/register",
      input
    );
    // freeapi.app register does not return tokens — auto-login to get them
    return authService.login({ username: input.username, password: input.password });
  },

  async logout(): Promise<void> {
    try {
      await api.post("/api/v1/users/logout");
    } finally {
      await clearTokens();
    }
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<ApiResponse<{ user: User }>>(
      "/api/v1/users/current-user"
    );
    return data.data.user;
  },

  async updateProfile(input: { fullName?: string; email?: string }): Promise<User> {
    const { data } = await api.patch<ApiResponse<User>>(
      "/api/v1/users/update-account",
      input
    );
    return data.data;
  },

  async updateAvatar(localUri: string): Promise<User> {
    const formData = new FormData();
    const filename = localUri.split("/").pop() ?? "avatar.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append("avatar", {
      uri: localUri,
      name: filename,
      type,
    } as unknown as Blob);

    const { data } = await api.patch<ApiResponse<User>>("/api/v1/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  async hasValidToken(): Promise<boolean> {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    return !!token;
  },

  async getStoredTokens(): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
    return { accessToken, refreshToken };
  },
};

async function persistTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
    SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
  ]);
}

async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
  ]);
}
