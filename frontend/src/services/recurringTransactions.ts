/**
 * Recurring Transactions API service
 */
import api from './api';

export interface RecurringTransaction {
  id: number;
  user_id: number;
  category_id: number | null;
  description: string;
  expected_amount: number;
  frequency: string;
  next_expected_date: string;
  confidence_score: number;
  is_active: boolean;
  last_matched_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransactionCreate {
  category_id?: number | null;
  description: string;
  expected_amount: number;
  frequency: string;
  next_expected_date: string;
  confidence_score?: number;
  is_active?: boolean;
}

export interface RecurringTransactionUpdate {
  category_id?: number | null;
  description?: string;
  expected_amount?: number;
  frequency?: string;
  next_expected_date?: string;
  confidence_score?: number;
  is_active?: boolean;
}

export interface RecurringTransactionDetection {
  description: string;
  category_id: number | null;
  expected_amount: number;
  frequency: string;
  transaction_count: number;
  confidence_score: number;
  sample_dates: string[];
}

export const recurringTransactionsAPI = {
  getAll: async (activeOnly: boolean = false): Promise<RecurringTransaction[]> => {
    const response = await api.get('/recurring-transactions', {
      params: { active_only: activeOnly },
    });
    return response.data;
  },

  getUpcoming: async (daysAhead: number = 30): Promise<RecurringTransaction[]> => {
    const response = await api.get('/recurring-transactions/upcoming', {
      params: { days_ahead: daysAhead },
    });
    return response.data;
  },

  detect: async (
    minOccurrences: number = 3,
    lookbackDays: number = 180
  ): Promise<RecurringTransactionDetection[]> => {
    const response = await api.post('/recurring-transactions/detect', null, {
      params: {
        min_occurrences: minOccurrences,
        lookback_days: lookbackDays,
      },
    });
    return response.data;
  },

  getById: async (id: number): Promise<RecurringTransaction> => {
    const response = await api.get(`/recurring-transactions/${id}`);
    return response.data;
  },

  create: async (
    recurring: RecurringTransactionCreate
  ): Promise<RecurringTransaction> => {
    const response = await api.post('/recurring-transactions', recurring);
    return response.data;
  },

  update: async (
    id: number,
    recurring: RecurringTransactionUpdate
  ): Promise<RecurringTransaction> => {
    const response = await api.put(`/recurring-transactions/${id}`, recurring);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/recurring-transactions/${id}`);
  },
};
