import api from './api';
import type {
  ApiResponse,
  PaginatedResponse,
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
  async getWines(params: WineListParams = {}): Promise<PaginatedResponse<UserWineListItem>> {
    const response = await api.get('/wines', { params });
    return response.data;
  },

  async getWine(id: string): Promise<ApiResponse<UserWine>> {
    const response = await api.get(`/wines/${id}`);
    return response.data;
  },

  async createWine(data: UserWineCreateRequest): Promise<ApiResponse<UserWine>> {
    const response = await api.post('/wines', data);
    return response.data;
  },

  async createWinesBatch(data: {
    scan_session_id: string;
    wines: Array<{ scan_index: number; quantity?: number; tag_ids?: string[] }>;
    common_tags?: string[];
    common_purchase_date?: string;
  }): Promise<ApiResponse<{ created_count: number; total_bottles: number; user_wines: UserWine[] }>> {
    const response = await api.post('/wines/batch', data);
    return response.data;
  },

  async updateWine(id: string, data: UserWineUpdateRequest): Promise<ApiResponse<UserWine>> {
    const response = await api.patch(`/wines/${id}`, data);
    return response.data;
  },

  async updateWineStatus(
    id: string,
    data: WineStatusUpdateRequest
  ): Promise<ApiResponse<{ id: string; quantity: number; status: string; consumed_count: number }>> {
    const response = await api.patch(`/wines/${id}/status`, data);
    return response.data;
  },

  async updateWineQuantity(
    id: string,
    data: WineQuantityUpdateRequest
  ): Promise<ApiResponse<{ id: string; previous_quantity: number; current_quantity: number }>> {
    const response = await api.patch(`/wines/${id}/quantity`, data);
    return response.data;
  },

  async deleteWine(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete(`/wines/${id}`);
    return response.data;
  },
};
