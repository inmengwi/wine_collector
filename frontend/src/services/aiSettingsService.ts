import api from './api';

export interface AIModelInfo {
  provider: string;
  model: string;
}

export interface AISettingsResponse {
  scan: AIModelInfo;
  recommendation: AIModelInfo;
}

export const aiSettingsService = {
  async getSettings(): Promise<AISettingsResponse> {
    const response = await api.get('/ai-settings');
    return response.data.data;
  },
};
