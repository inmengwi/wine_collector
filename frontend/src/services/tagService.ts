import api from './api';
import type { ApiResponse, Tag, TagType, TagListResponse, TagCreateRequest, TagUpdateRequest } from '@/types';

export const tagService = {
  async getTags(type?: TagType): Promise<ApiResponse<TagListResponse>> {
    const response = await api.get('/tags', { params: type ? { type } : {} });
    return response.data;
  },

  async createTag(data: TagCreateRequest): Promise<ApiResponse<Tag>> {
    const response = await api.post('/tags', data);
    return response.data;
  },

  async updateTag(id: string, data: TagUpdateRequest): Promise<ApiResponse<Tag>> {
    const response = await api.patch(`/tags/${id}`, data);
    return response.data;
  },

  async deleteTag(id: string): Promise<ApiResponse<{ affected_wines: number }>> {
    const response = await api.delete(`/tags/${id}`);
    return response.data;
  },

  async reorderTags(type: TagType, order: string[]): Promise<ApiResponse<null>> {
    const response = await api.put('/tags/reorder', { type, order });
    return response.data;
  },
};
