import apiClient from './apiClient';
import { ApiResponse } from '@/types/api';
import {
  User,
  AuthSuccessData,
  LoginCredentials,
  RegisterCredentials,
  ChangePasswordData,
} from '@/types/auth';

export const authService = {
  /**
   * Authenticate user credentials and receive access token + HttpOnly cookie
   */
  async login(credentials: LoginCredentials): Promise<AuthSuccessData> {
    const res = await apiClient.post<ApiResponse<AuthSuccessData>>('/auth/login', credentials);
    return res.data.data;
  },

  /**
   * Register a new citizen account
   * Security constraint: role is forced to CITIZEN
   */
  async register(data: RegisterCredentials): Promise<AuthSuccessData> {
    const payload = {
      ...data,
      role: 'CITIZEN' as const,
    };
    const res = await apiClient.post<ApiResponse<AuthSuccessData>>('/auth/register', payload);
    return res.data.data;
  },

  /**
   * Invalidate current session and clear HttpOnly cookie
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('disaster_ready_token');
        localStorage.removeItem('disaster_ready_user');
      }
    }
  },

  /**
   * Retrieve current authenticated user profile
   */
  async getMe(): Promise<User> {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },

  /**
   * Rotate refresh token and get a new access token
   */
  async refreshToken(): Promise<AuthSuccessData> {
    const res = await apiClient.post<ApiResponse<AuthSuccessData>>('/auth/refresh');
    return res.data.data;
  },

  /**
   * Change user password (revokes previous sessions)
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    await apiClient.patch('/auth/change-password', data);
  },
};

export default authService;
