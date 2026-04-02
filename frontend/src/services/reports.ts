/**
 * Reports API service
 */
import api from './api';

export interface CategoryBreakdown {
  category_id: number | null;
  category_name: string;
  amount: number;
  transaction_count: number;
  percentage: number;
}

export interface MerchantSummary {
  merchant_id: number | null;
  merchant_name: string;
  amount: number;
  transaction_count: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface FinancialOverview {
  total_income: number;
  total_expenses: number;
  net_income: number;
  total_accounts: number;
  total_balance: number;
  period_start: string;
  period_end: string;
}

export interface DashboardData {
  overview: FinancialOverview;
  category_breakdown: CategoryBreakdown[];
  top_merchants: MerchantSummary[];
  monthly_trends: MonthlyTrend[];
}

export interface RecurringTransactionCandidate {
  merchant_name: string | null;
  category_name: string | null;
  average_amount: number;
  frequency_days: number;
  occurrences: number;
  last_date: string;
  next_expected_date: string;
  confidence_score: number;
}

export const reportsAPI = {
  getOverview: async (
    startDate?: string,
    endDate?: string
  ): Promise<FinancialOverview> => {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await api.get('/reports/overview', { params });
    return response.data;
  },

  getCategoryBreakdown: async (
    transactionType: 'income' | 'expense' = 'expense',
    startDate?: string,
    endDate?: string
  ): Promise<CategoryBreakdown[]> => {
    const params: any = { transaction_type: transactionType };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await api.get('/reports/category-breakdown', { params });
    return response.data;
  },

  getTopMerchants: async (
    limit: number = 10,
    startDate?: string,
    endDate?: string
  ): Promise<MerchantSummary[]> => {
    const params: any = { limit };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await api.get('/reports/top-merchants', { params });
    return response.data;
  },

  getMonthlyTrend: async (months: number = 6): Promise<MonthlyTrend[]> => {
    const response = await api.get('/reports/monthly-trend', {
      params: { months },
    });
    return response.data;
  },

  getDashboard: async (
    startDate?: string,
    endDate?: string
  ): Promise<DashboardData> => {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await api.get('/reports/dashboard', { params });
    return response.data;
  },

  detectRecurring: async (
    minOccurrences: number = 3
  ): Promise<RecurringTransactionCandidate[]> => {
    const response = await api.get('/reports/recurring', {
      params: { min_occurrences: minOccurrences },
    });
    return response.data;
  },
};
