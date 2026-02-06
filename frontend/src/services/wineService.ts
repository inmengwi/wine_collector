import api from './api';
import type {
  PaginatedData,
  PaginationParams,
  SortParams,
  UserWine,
  UserWineListItem,
  UserWineCreateRequest,
  UserWineUpdateRequest,
  WineStatusUpdateRequest,
  WineQuantityUpdateRequest,
  WineFilterParams,
} from '@/types';

export interface WineListParams extends PaginationParams, SortParams, WineFilterParams {}

export const wineService = {
  async getWines(params: WineListParams = {}): Promise<PaginatedData<UserWineListItem>> {
    const response = await api.get('/wines', { params });
    return response.data.data;
  },

  async getUserWines(params: WineListParams = {}): Promise<PaginatedData<UserWineListItem>> {
    return this.getWines(params);
  },

  async getWine(id: string): Promise<UserWine> {
    const response = await api.get(`/wines/${id}`);
    return response.data.data;
  },

  async getUserWine(id: string): Promise<UserWine> {
    return this.getWine(id);
  },

  async createWine(data: UserWineCreateRequest): Promise<UserWine> {
    const response = await api.post('/wines', data);
    return response.data.data;
  },

  async createUserWine(data: UserWineCreateRequest): Promise<UserWine> {
    return this.createWine(data);
  },

  async createWinesBatch(data: {
    scan_session_id: string;
    wines: Array<{ scan_index: number; quantity?: number; tag_ids?: string[] }>;
    common_tags?: string[];
    common_purchase_date?: string;
  }): Promise<{ created_count: number; total_bottles: number; user_wines: UserWine[] }> {
    const response = await api.post('/wines/batch', data);
    return response.data.data;
  },

  async updateWine(id: string, data: UserWineUpdateRequest): Promise<UserWine> {
    const response = await api.patch(`/wines/${id}`, data);
    return response.data.data;
  },

  async updateWineStatus(
    id: string,
    data: WineStatusUpdateRequest
  ): Promise<{ id: string; quantity: number; status: string; consumed_count: number; history_id: string; event_date: string }> {
    const response = await api.patch(`/wines/${id}/status`, data);
    return response.data.data;
  },

  async updateStatus(
    id: string,
    data: WineStatusUpdateRequest
  ): Promise<{ id: string; quantity: number; status: string; consumed_count: number; history_id: string; event_date: string }> {
    return this.updateWineStatus(id, data);
  },

  async updateWineQuantity(
    id: string,
    data: WineQuantityUpdateRequest
  ): Promise<{ id: string; previous_quantity: number; current_quantity: number }> {
    const response = await api.patch(`/wines/${id}/quantity`, data);
    return response.data.data;
  },

  async updateQuantity(
    id: string,
    data: WineQuantityUpdateRequest
  ): Promise<{ id: string; previous_quantity: number; current_quantity: number }> {
    return this.updateWineQuantity(id, data);
  },

  async deleteWine(id: string): Promise<void> {
    await api.delete(`/wines/${id}`);
  },

  async deleteUserWine(id: string): Promise<void> {
    return this.deleteWine(id);
  },
};
