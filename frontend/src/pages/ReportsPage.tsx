/**
 * Reports page - Detailed financial analytics and insights
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI, CategoryBreakdown, RecurringTransactionCandidate } from '@/services/reports';

type ReportView = 'overview' | 'categories' | 'trends' | 'recurring';

export const ReportsPage = () => {
  const [period, setPeriod] = useState('current_month');
  const [activeView, setActiveView] = useState<ReportView>('overview');

  // Calculate date range
  const getDateRange = () => {
    const today = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    switch (period) {
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
      case 'last_6_months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'current_year':
        startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'last_year':
        startDate = new Date(today.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
        endDate = new Date(today.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
        break;
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch reports data
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['overview', startDate, endDate],
    queryFn: () => reportsAPI.getOverview(startDate, endDate),
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<CategoryBreakdown[]>({
    queryKey: ['category-breakdown', 'expense', startDate, endDate],
    queryFn: () => reportsAPI.getCategoryBreakdown('expense', startDate, endDate),
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['monthly-trends'],
    queryFn: () => reportsAPI.getMonthlyTrend(12),
  });

  const { data: recurring, isLoading: recurringLoading } = useQuery<RecurringTransactionCandidate[]>({
    queryKey: ['recurring-patterns'],
    queryFn: () => reportsAPI.detectRecurring(),
  });

  const isLoading = overviewLoading || categoriesLoading || trendsLoading || recurringLoading;

  const savingsRate = overview?.total_income
    ? ((overview.net_income / overview.total_income) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="current_month">Current Month</option>
            <option value="last_month">Last Month</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="last_6_months">Last 6 Months</option>
            <option value="current_year">Current Year</option>
            <option value="last_year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Period Display */}
      <div className="text-sm text-gray-600">
        Period: {new Date(overview?.period_start || '').toLocaleDateString()} -{' '}
        {new Date(overview?.period_end || '').toLocaleDateString()}
      </div>

      {/* View Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'categories', label: 'Categories' },
            { id: 'trends', label: 'Trends' },
            { id: 'recurring', label: 'Recurring' },
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as ReportView)}
              className={`${
                activeView === view.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {view.label}
            </button>
          ))}
        </nav>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading reports...</div>
      ) : (
        <>
          {/* Overview View */}
          {activeView === 'overview' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <h3 className="text-sm font-medium text-green-700">Total Income</h3>
                  <p className="text-3xl font-bold text-green-900 mt-2">
                    ${overview?.total_income.toFixed(2)}
                  </p>
                </div>

                <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                  <h3 className="text-sm font-medium text-red-700">Total Expenses</h3>
                  <p className="text-3xl font-bold text-red-900 mt-2">
                    ${overview?.total_expenses.toFixed(2)}
                  </p>
                </div>

                <div className={`card bg-gradient-to-br ${
                  (overview?.net_income || 0) >= 0
                    ? 'from-blue-50 to-blue-100 border-blue-200'
                    : 'from-orange-50 to-orange-100 border-orange-200'
                }`}>
                  <h3 className={`text-sm font-medium ${
                    (overview?.net_income || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'
                  }`}>
                    Net Income
                  </h3>
                  <p className={`text-3xl font-bold mt-2 ${
                    (overview?.net_income || 0) >= 0 ? 'text-blue-900' : 'text-orange-900'
                  }`}>
                    ${overview?.net_income.toFixed(2)}
                  </p>
                </div>

                <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <h3 className="text-sm font-medium text-purple-700">Savings Rate</h3>
                  <p className="text-3xl font-bold text-purple-900 mt-2">{savingsRate}%</p>
                  <div className="mt-2 w-full bg-purple-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${Math.max(0, Math.min(100, parseFloat(savingsRate)))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card">
                  <h3 className="text-sm font-medium text-gray-700">Total Balance</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    ${overview?.total_balance.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Across {overview?.total_accounts} accounts
                  </p>
                </div>

                <div className="card">
                  <h3 className="text-sm font-medium text-gray-700">Top Category</h3>
                  {categories && categories.length > 0 ? (
                    <>
                      <p className="text-xl font-bold text-gray-900 mt-2">
                        {categories[0].category_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        ${categories[0].amount.toFixed(2)} ({categories[0].percentage.toFixed(1)}%)
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">No data</p>
                  )}
                </div>

                <div className="card">
                  <h3 className="text-sm font-medium text-gray-700">Savings Rate</h3>
                  <p className="text-xl font-bold text-gray-900 mt-2">{savingsRate}%</p>
                  <p className="text-sm text-gray-600">Of income saved</p>
                </div>
              </div>
            </div>
          )}

          {/* Categories View */}
          {activeView === 'categories' && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Spending by Category</h2>
              {categories && categories.length > 0 ? (
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.category_name} className="border-l-4 border-primary-500 pl-4 py-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900">{category.category_name}</span>
                        <span className="text-sm font-medium text-gray-600">
                          {category.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div
                          className="bg-primary-600 h-3 rounded-full transition-all"
                          style={{ width: `${Math.min(category.percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>${category.amount.toFixed(2)}</span>
                        <span>{category.transaction_count} transactions</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-3">📊</div>
                  <p>No category data available for this period</p>
                </div>
              )}
            </div>
          )}

          {/* Trends View */}
          {activeView === 'trends' && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Trends</h2>
              {trends && trends.length > 0 ? (
                <div className="space-y-4">
                  {trends.map((trend) => (
                    <div key={trend.month} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="font-bold text-lg text-gray-900 mb-4">
                        {new Date(trend.month + '-01').toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                        })}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Income</div>
                          <div className="text-2xl font-bold text-green-600">
                            ${trend.income.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Expenses</div>
                          <div className="text-2xl font-bold text-red-600">
                            ${trend.expenses.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Net</div>
                          <div className={`text-2xl font-bold ${
                            trend.net >= 0 ? 'text-blue-600' : 'text-orange-600'
                          }`}>
                            ${trend.net.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {trend.net >= 0 ? 'Surplus' : 'Deficit'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Savings Rate</div>
                          <div className="text-2xl font-bold text-purple-600">
                            {trend.income > 0 ? ((trend.net / trend.income) * 100).toFixed(1) : '0.0'}%
                          </div>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{
                                width: `${Math.max(0, Math.min(100, trend.income > 0 ? (trend.net / trend.income) * 100 : 0))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-3">📈</div>
                  <p>No trend data available for this period</p>
                </div>
              )}
            </div>
          )}

          {/* Recurring View */}
          {activeView === 'recurring' && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Detected Recurring Patterns</h2>
              <p className="text-sm text-gray-600 mb-6">
                Transactions that appear to follow a recurring pattern based on category and amount.
              </p>
              {recurring && recurring.length > 0 ? (
                <div className="space-y-4">
                  {recurring.map((pattern, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold text-lg text-gray-900">
                            {pattern.category_name || 'Uncategorized'}
                          </div>
                          <div className="text-sm text-gray-600">
                            ~${pattern.average_amount.toFixed(2)} • Every {pattern.frequency_days} days
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                            {(pattern.confidence_score * 100).toFixed(0)}% Confidence
                          </span>
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            {pattern.occurrences} occurrences
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Next Expected:</span>{' '}
                        {new Date(pattern.next_expected_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-3">🔄</div>
                  <p>No recurring patterns detected yet</p>
                  <p className="text-sm mt-2">Need at least 3 similar transactions to detect patterns</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
