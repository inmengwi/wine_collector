import api from './api';
import type { ApiResponse, CellarSummary, ExpiringWines } from '@/types';

export const dashboardService = {
  async getSummary(): Promise<ApiResponse<CellarSummary>> {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },

  async getExpiringWines(params: { years?: number; limit?: number } = {}): Promise<ApiResponse<ExpiringWines>> {
    const response = await api.get('/dashboard/expiring', { params });
    return response.data;
  },
};
