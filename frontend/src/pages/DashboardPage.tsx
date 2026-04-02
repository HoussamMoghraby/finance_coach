/**
 * Dashboard page
 */
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

interface DashboardData {
  overview: {
    total_income: number;
    total_expenses: number;
    net_income: number;
    total_balance: number;
  };
  category_breakdown: Array<{
    category_name: string;
    amount: number;
    percentage: number;
  }>;
}

export const DashboardPage = () => {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/reports/dashboard');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        Error loading dashboard data
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
          <p className="text-2xl font-bold text-success mt-2">
            ${data?.overview.total_income.toFixed(2)}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
          <p className="text-2xl font-bold text-danger mt-2">
            ${data?.overview.total_expenses.toFixed(2)}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500">Net Income</h3>
          <p className="text-2xl font-bold text-primary-600 mt-2">
            ${data?.overview.net_income.toFixed(2)}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500">Total Balance</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ${data?.overview.total_balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Spending by Category</h2>
        {data?.category_breakdown && data.category_breakdown.length > 0 ? (
          <div className="space-y-3">
            {data.category_breakdown.slice(0, 5).map((category) => (
              <div key={category.category_name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{category.category_name}</span>
                  <span className="text-gray-600">
                    ${category.amount.toFixed(2)} ({category.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${Math.min(category.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No spending data yet</p>
        )}
      </div>
    </div>
  );
};
