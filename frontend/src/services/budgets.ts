/**
 * Budgets API service
 */
import api from './api';

export interface Budget {
  id: number;
  user_id: number;
  category_id: number | null;
  amount: number;
  period_type: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetCreate {
  category_id?: number | null;
  amount: number;
  period_type: string;
  start_date: string;
  end_date: string;
}

export interface BudgetUpdate {
  category_id?: number | null;
  amount?: number;
  period_type?: string;
  start_date?: string;
  end_date?: string;
}

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage_used: number;
  is_over_budget: boolean;
}

export interface BudgetOverview {
  total_budget: number;
  total_spent: number;
  total_remaining: number;
  percentage_used: number;
  category_budgets: BudgetStatus[];
}

export const budgetsAPI = {
  getAll: async (): Promise<Budget[]> => {
    const response = await api.get('/budgets');
    return response.data;
  },

  getById: async (id: number): Promise<Budget> => {
    const response = await api.get(`/budgets/${id}`);
    return response.data;
  },

  getStatus: async (targetDate?: string): Promise<BudgetOverview> => {
    const params = targetDate ? { target_date: targetDate } : {};
    const response = await api.get('/budgets/status', { params });
    return response.data;
  },

  getSingleStatus: async (id: number): Promise<BudgetStatus> => {
    const response = await api.get(`/budgets/${id}/status`);
    return response.data;
  },

  create: async (budget: BudgetCreate): Promise<Budget> => {
    const response = await api.post('/budgets', budget);
    return response.data;
  },

  update: async (id: number, budget: BudgetUpdate): Promise<Budget> => {
    const response = await api.put(`/budgets/${id}`, budget);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/budgets/${id}`);
  },
};
