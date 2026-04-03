/**
 * Insights API service
 */
import api from './api';

export interface Insight {
  id: number;
  user_id: number;
  type: string;
  period_start: string;
  period_end: string;
  title: string;
  summary: string;
  details_json?: any;
  created_at: string;
}

export interface InsightGenerateRequest {
  type: 'daily' | 'weekly' | 'monthly';
  start_date?: string;
  end_date?: string;
}

export interface ChatRequest {
  question: string;
}

export interface ChatResponse {
  answer: string;
}

export const insightsAPI = {
  getInsights: async (limit: number = 20): Promise<Insight[]> => {
    const response = await api.get('/insights', {
      params: { limit },
    });
    return response.data;
  },

  generateInsight: async (request: InsightGenerateRequest): Promise<Insight> => {
    const response = await api.post('/insights/generate', request);
    return response.data;
  },

  askQuestion: async (question: string): Promise<ChatResponse> => {
    const response = await api.post('/insights/ask', { question });
    return response.data;
  },

  getBudgetCoaching: async (question: string): Promise<ChatResponse> => {
    const response = await api.post('/insights/budget-coaching', { question });
    return response.data;
  },

  checkAIHealth: async (): Promise<{ status: string; ollama: string }> => {
    const response = await api.get('/insights/health');
    return response.data;
  },
};
