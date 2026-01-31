import api from './api';
import type { ApiResponse, LoginRequest, RegisterRequest, LoginResponse, User, TokenResponse } from '@/types';

export const authService = {
  async register(data: RegisterRequest): Promise<ApiResponse<User>> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async logout(): Promise<ApiResponse<null>> {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<ApiResponse<TokenResponse>> {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },

  async getMe(): Promise<ApiResponse<User>> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async updateProfile(data: { name?: string; profile_image?: string }): Promise<ApiResponse<User>> {
    const response = await api.patch('/auth/me', data);
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<null>> {
    const response = await api.post('/auth/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};
