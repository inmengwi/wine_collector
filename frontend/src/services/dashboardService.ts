import api from './api';
import type { CellarSummary, ExpiringWines } from '@/types';

export const dashboardService = {
  async getSummary(): Promise<CellarSummary> {
    const response = await api.get('/dashboard/summary');
    return response.data.data;
  },

  async getCellarSummary(): Promise<CellarSummary> {
    const response = await api.get('/dashboard/summary');
    return response.data.data;
  },

  async getExpiringWines(params: { years?: number; limit?: number } = {}): Promise<ExpiringWines> {
    const response = await api.get('/dashboard/expiring', { params });
    return response.data.data;
  },
};
