/**
 * Transactions API service
 */
import api from './api';

export interface Transaction {
  id: number;
  user_id: number;
  account_id: number;
  to_account_id?: number;  // For internal transfers
  category_id?: number;
  merchant_id?: number;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  description: string;
  notes?: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreate {
  account_id: number;
  to_account_id?: number;  // For internal transfers
  category_id?: number;
  merchant_id?: number;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency?: string;
  description: string;
  notes?: string;
  transaction_date: string;
}

export interface TransactionFilters {
  account_id?: number;
  category_id?: number;
  merchant_id?: number;
  type?: string;
  skip?: number;
  limit?: number;
}

export const transactionsAPI = {
  getAll: async (filters?: TransactionFilters): Promise<Transaction[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/transactions?${params.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<Transaction> => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  create: async (data: TransactionCreate): Promise<Transaction> => {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  update: async (id: number, data: Partial<TransactionCreate>): Promise<Transaction> => {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },
};
