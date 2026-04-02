/**
 * Reports page
 */
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { useState } from 'react';

export const ReportsPage = () => {
  const [period, setPeriod] = useState('current_month');

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['report', period],
    queryFn: async () => {
      const response = await api.get(`/reports/${period}`);
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading report...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        Error loading report
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="current_month">Current Month</option>
          <option value="last_month">Last Month</option>
          <option value="current_year">Current Year</option>
          <option value="last_year">Last Year</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">
            ${report?.total_income?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">
            ${report?.total_expenses?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500">Net Income</h3>
          <p className={`text-2xl font-bold mt-2 ${
            (report?.net_income || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ${report?.net_income?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500">Savings Rate</h3>
          <p className="text-2xl font-bold text-primary-600 mt-2">
            {report?.savings_rate?.toFixed(1) || '0.0'}%
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Expense Breakdown by Category</h2>
        <div className="space-y-3">
          {report?.category_breakdown?.map((category: any) => (
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
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Merchants */}
      {report?.top_merchants && report.top_merchants.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Top Merchants</h2>
          <div className="space-y-2">
            {report.top_merchants.map((merchant: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <span className="font-medium">{merchant.merchant_name}</span>
                <span className="text-gray-600">${merchant.total_amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
