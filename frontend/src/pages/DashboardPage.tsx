/**
 * Dashboard page - Comprehensive financial overview
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI, DashboardData } from '@/services/reports';
import { budgetsAPI } from '@/services/budgets';

export const DashboardPage = () => {
  const [dateRange, setDateRange] = useState('current_month');

  // Calculate date range
  const getDateRange = () => {
    const today = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    switch (dateRange) {
      case 'current_month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'last_month':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        startDate = lastMonth.toISOString().split('T')[0];
        endDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'last_3_months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'current_year':
        startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch dashboard data
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard', startDate, endDate],
    queryFn: () => reportsAPI.getDashboard(startDate, endDate),
  });

  // Fetch budget status
  const { data: budgetOverview } = useQuery({
    queryKey: ['budgets', 'overview'],
    queryFn: () => budgetsAPI.getStatus(),
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

  const savingsRate = data?.overview.total_income
    ? ((data.overview.net_income / data.overview.total_income) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="current_month">Current Month</option>
          <option value="last_month">Last Month</option>
          <option value="last_3_months">Last 3 Months</option>
          <option value="current_year">Current Year</option>
        </select>
      </div>

      {/* Period Display */}
      <div className="text-sm text-gray-600">
        Period: {new Date(data?.overview.period_start || '').toLocaleDateString()} -{' '}
        {new Date(data?.overview.period_end || '').toLocaleDateString()}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <h3 className="text-sm font-medium text-green-700">Total Income</h3>
          <p className="text-3xl font-bold text-green-900 mt-2">
            ${data?.overview.total_income.toFixed(2)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            Revenue for the period
          </p>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <h3 className="text-sm font-medium text-red-700">Total Expenses</h3>
          <p className="text-3xl font-bold text-red-900 mt-2">
            ${data?.overview.total_expenses.toFixed(2)}
          </p>
          <p className="text-xs text-red-600 mt-1">
            Spending for the period
          </p>
        </div>

        <div className={`card bg-gradient-to-br ${
          (data?.overview.net_income || 0) >= 0
            ? 'from-blue-50 to-blue-100 border-blue-200'
            : 'from-orange-50 to-orange-100 border-orange-200'
        }`}>
          <h3 className={`text-sm font-medium ${
            (data?.overview.net_income || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'
          }`}>
            Net Income
          </h3>
          <p className={`text-3xl font-bold mt-2 ${
            (data?.overview.net_income || 0) >= 0 ? 'text-blue-900' : 'text-orange-900'
          }`}>
            ${data?.overview.net_income.toFixed(2)}
          </p>
          <p className={`text-xs mt-1 ${
            (data?.overview.net_income || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
          }`}>
            {(data?.overview.net_income || 0) >= 0 ? 'Surplus' : 'Deficit'}
          </p>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <h3 className="text-sm font-medium text-purple-700">Total Balance</h3>
          <p className="text-3xl font-bold text-purple-900 mt-2">
            ${data?.overview.total_balance.toFixed(2)}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            Across {data?.overview.total_accounts} accounts
          </p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700">Savings Rate</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">{savingsRate}%</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full"
              style={{ width: `${Math.max(0, Math.min(100, parseFloat(savingsRate)))}%` }}
            />
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-700">Budget Status</h3>
          {budgetOverview && budgetOverview.total_budget > 0 ? (
            <>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {budgetOverview.percentage_used.toFixed(0)}%
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    budgetOverview.percentage_used >= 100
                      ? 'bg-red-600'
                      : budgetOverview.percentage_used >= 90
                      ? 'bg-orange-600'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(100, budgetOverview.percentage_used)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                ${budgetOverview.total_remaining.toFixed(2)} remaining
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500 mt-2">No budgets set</p>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-700">Average Daily Spending</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ${data?.overview.total_expenses && data?.overview.period_end && data?.overview.period_start ? (
              data.overview.total_expenses /
              Math.max(
                1,
                Math.ceil(
                  (new Date(data.overview.period_end).getTime() -
                    new Date(data.overview.period_start).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              )
            ).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Spending by Category</h2>
          {data?.category_breakdown && data.category_breakdown.length > 0 ? (
            <div className="space-y-4">
              {data.category_breakdown.slice(0, 8).map((category) => (
                <div key={category.category_name}>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="font-medium text-gray-900">{category.category_name}</span>
                    <span className="text-gray-600">
                      ${category.amount.toFixed(2)} ({category.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-primary-600 h-2.5 rounded-full transition-all"
                      style={{ width: `${Math.min(category.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {category.transaction_count} transactions
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p>No spending data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trends */}
      {data?.monthly_trends && data.monthly_trends.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Trend</h2>
          <div className="space-y-3">
            {data.monthly_trends.map((trend) => (
              <div key={trend.month} className="border-l-4 border-primary-500 pl-4 py-2">
                <div className="font-semibold text-gray-900 mb-2">
                  {new Date(trend.month + '-01').toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Income</div>
                    <div className="font-bold text-green-600">${trend.income.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Expenses</div>
                    <div className="font-bold text-red-600">${trend.expenses.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Net</div>
                    <div
                      className={`font-bold ${
                        trend.net >= 0 ? 'text-blue-600' : 'text-orange-600'
                      }`}
                    >
                      ${trend.net.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
