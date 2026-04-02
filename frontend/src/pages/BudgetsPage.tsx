/**
 * Budgets page
 */
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export const BudgetsPage = () => {
  const { data: budgets, isLoading, error } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const response = await api.get('/budgets');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading budgets...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        Error loading budgets
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
        <button className="btn btn-primary">
          Create Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets?.map((budget: any) => {
          const spent = budget.spent || 0;
          const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
          const isOverBudget = percentage > 100;

          return (
            <div key={budget.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{budget.category_name}</h3>
                  <p className="text-sm text-gray-500">
                    {budget.period} • {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  isOverBudget ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {percentage.toFixed(0)}%
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Spent</span>
                  <span className="font-medium">${spent.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      isOverBudget ? 'bg-red-600' : 'bg-primary-600'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Budget</span>
                  <span className="font-medium">${budget.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remaining</span>
                  <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                    ${(budget.amount - spent).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(!budgets || budgets.length === 0) && (
        <div className="text-center py-12 text-gray-500">
          No budgets found. Create your first budget to track spending.
        </div>
      )}
    </div>
  );
};
