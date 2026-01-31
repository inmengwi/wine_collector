import api from './api';
import type { ApiResponse, PaginatedResponse, RecommendationResult, RecommendationRequest } from '@/types';

export interface RecommendationHistoryItem {
  id: string;
  query: string;
  query_type: string;
  top_recommendation: { wine_name: string; match_score: number } | null;
  total_recommendations: number;
  created_at: string;
}

export const recommendationService = {
  async getRecommendations(data: RecommendationRequest): Promise<ApiResponse<RecommendationResult>> {
    const response = await api.post('/recommendations', data);
    return response.data;
  },

  async getHistory(params: { page?: number; size?: number } = {}): Promise<PaginatedResponse<RecommendationHistoryItem>> {
    const response = await api.get('/recommendations/history', { params });
    return response.data;
  },
};
