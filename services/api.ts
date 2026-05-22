import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import axiosRetry from "axios-retry";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL, REQUEST_TIMEOUT, RETRY_COUNT, STORAGE_KEYS } from "../constants";
import { ApiError } from "../types";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}> = [];

let _onAuthExpired: (() => void) | null = null;

export function registerAuthExpiredHandler(cb: () => void) {
  _onAuthExpired = cb;
}

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosRetry(api, {
  retries: RETRY_COUNT,
  retryDelay: (retryCount) => {
    return Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
  },
  retryCondition: (error: AxiosError) => {
    if (!error.response) return true;
    const status = error.response.status;
    return status === 408 || status === 429 || status >= 500;
  },
  onRetry: (retryCount, error) => {
    console.warn(`Retry attempt ${retryCount} for ${error.config?.url}`);
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(`${API_BASE_URL}/api/v1/users/refresh-token`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        _onAuthExpired?.();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const apiError: ApiError = {
      message:
        (error.response?.data as { message?: string })?.message ||
        error.message ||
        "Something went wrong",
      statusCode: error.response?.status ?? 0,
      errors: (error.response?.data as { errors?: Record<string, string[]> })?.errors,
    };

    return Promise.reject(apiError);
  }
);

export default api;
