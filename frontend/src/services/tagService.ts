import api from './api';
import type { Tag, TagType, TagListResponse, TagCreateRequest, TagUpdateRequest } from '@/types';

export const tagService = {
  async getTags(type?: TagType): Promise<TagListResponse> {
    const response = await api.get('/tags', { params: type ? { type } : {} });
    return response.data;
  },

  async createTag(data: TagCreateRequest): Promise<Tag> {
    const response = await api.post('/tags', data);
    return response.data;
  },

  async updateTag(id: string, data: TagUpdateRequest): Promise<Tag> {
    const response = await api.patch(`/tags/${id}`, data);
    return response.data;
  },

  async deleteTag(id: string): Promise<{ affected_wines: number }> {
    const response = await api.delete(`/tags/${id}`);
    return response.data;
  },

  async reorderTags(type: TagType, order: string[]): Promise<void> {
    await api.put('/tags/reorder', { type, order });
  },
};
