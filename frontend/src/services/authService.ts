import api from './api';
import type { LoginRequest, RegisterRequest, LoginResponse, User, TokenResponse, ProfileUpdateRequest } from '@/types';

export const authService = {
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await api.post('/auth/register', data);
    return response.data.data;
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post('/auth/login', data);
    return response.data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  async updateProfile(data: ProfileUpdateRequest): Promise<User> {
    const response = await api.patch('/auth/me', data);
    return response.data.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },
};
