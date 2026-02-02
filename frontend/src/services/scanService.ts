import api from './api';
import type { ScanResult, BatchScanResult } from '@/types';

export const scanService = {
  async scanSingle(imageFile: File): Promise<ScanResult> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await api.post('/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async scanBatch(imageFile: File): Promise<BatchScanResult> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await api.post('/scan/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async checkDuplicate(imageFile: File): Promise<{
    wine: { name: string; producer: string | null; vintage: number | null; type: string };
    is_owned: boolean;
    owned_info: {
      user_wine_id: string;
      quantity: number;
      location_tags: string[];
      purchase_price: number | null;
      purchase_date: string | null;
    } | null;
    recommendation: string | null;
  }> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await api.post('/scan/check', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
};
