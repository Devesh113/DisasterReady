import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiErrorResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Needed for HTTP-only refresh token cookies
  timeout: 15000,
});

// Request interceptor: inject JWT Bearer access token from memory/localStorage
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('disaster_ready_token');
      if (token && config.headers && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrency lock and promise queue to prevent simultaneous refresh calls from triggering token races
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: handle 401 token expiration and queued refresh-token rotation
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Check if error is 401 and indicates token expiration
    const isTokenExpired =
      error.response?.status === 401 &&
      (error.response?.data?.error?.code === 'TOKEN_EXPIRED' ||
        error.response?.data?.error?.message?.toLowerCase().includes('expired'));

    if (isTokenExpired && originalRequest && !originalRequest._retry) {
      // Don't attempt to refresh if the failed request was the refresh endpoint itself or login/register
      if (
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until the ongoing refresh finishes
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Dispatch refresh request with withCredentials: true so HTTP-only cookie is sent
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = refreshResponse.data?.data?.token;

        if (newToken && typeof window !== 'undefined') {
          localStorage.setItem('disaster_ready_token', newToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          processQueue(null, newToken);
          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh response did not return a valid token');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);

        if (typeof window !== 'undefined') {
          localStorage.removeItem('disaster_ready_token');
          localStorage.removeItem('disaster_ready_user');
          // Dispatch custom event so AuthContext can transition state cleanly
          window.dispatchEvent(new Event('disaster_ready_auth_expired'));
        }

        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
