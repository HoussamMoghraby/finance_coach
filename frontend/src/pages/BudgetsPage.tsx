/**
 * Budgets page - Comprehensive budget management with CRUD operations
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetsAPI, BudgetCreate, BudgetUpdate, BudgetStatus } from '@/services/budgets';
import { categoriesAPI, Category } from '@/services/categories';

export const BudgetsPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetStatus | null>(null);
  const [formData, setFormData] = useState<BudgetCreate>({
    category_id: undefined,
    amount: 0,
    period_type: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
  });

  // Fetch budget overview with spending status
  const { data: overview, isLoading, error } = useQuery({
    queryKey: ['budgets', 'overview'],
    queryFn: () => budgetsAPI.getStatus(),
  });

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesAPI.getAll,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: budgetsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: BudgetUpdate }) =>
      budgetsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsModalOpen(false);
      setEditingBudget(null);
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: budgetsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const resetForm = () => {
    setFormData({
      category_id: undefined,
      amount: 0,
      period_type: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 1))
        .toISOString()
        .split('T')[0],
    });
    setEditingBudget(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (budgetStatus: BudgetStatus) => {
    setEditingBudget(budgetStatus);
    setFormData({
      category_id: budgetStatus.budget.category_id,
      amount: budgetStatus.budget.amount,
      period_type: budgetStatus.budget.period_type,
      start_date: budgetStatus.budget.start_date,
      end_date: budgetStatus.budget.end_date,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.budget.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      deleteMutation.mutate(id);
    }
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return 'Overall Budget';
    const category = categories.find((c: Category) => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const getAlertLevel = (percentageUsed: number) => {
    if (percentageUsed >= 100) return 'over';
    if (percentageUsed >= 90) return 'critical';
    if (percentageUsed >= 75) return 'warning';
    return 'normal';
  };

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

  const alertLevel = getAlertLevel(overview?.percentage_used || 0);
  const categoryBudgets = overview?.category_budgets || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          + Create Budget
        </button>
      </div>

      {/* Overall Budget Summary */}
      {overview && overview.total_budget > 0 && (
        <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                ${overview.total_spent.toFixed(2)} / ${overview.total_budget.toFixed(2)}
              </h2>
              <p className="text-sm text-gray-600 mt-1">Total spending across all budgets</p>
            </div>
            <div className="flex items-center gap-2">
              {alertLevel === 'over' && (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  ⚠️ Over Budget
                </span>
              )}
              {alertLevel === 'critical' && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  ⚠️ {overview.percentage_used.toFixed(0)}% Used
                </span>
              )}
              {alertLevel === 'warning' && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  ⚠️ {overview.percentage_used.toFixed(0)}% Used
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  alertLevel === 'over'
                    ? 'bg-red-600'
                    : alertLevel === 'critical'
                    ? 'bg-orange-600'
                    : alertLevel === 'warning'
                    ? 'bg-yellow-600'
                    : 'bg-primary-600'
                }`}
                style={{ width: `${Math.min(overview.percentage_used, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Remaining: ${overview.total_remaining.toFixed(2)}</span>
              <span>{overview.percentage_used.toFixed(1)}% used</span>
            </div>
          </div>
        </div>
      )}

      {/* Individual Budgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoryBudgets.map((budgetStatus: BudgetStatus) => {
          const { budget, spent, remaining, percentage_used, is_over_budget } = budgetStatus;
          const alertLevel = getAlertLevel(percentage_used);

          return (
            <div
              key={budget.id}
              className={`card border-l-4 ${
                alertLevel === 'over'
                  ? 'border-l-red-500 bg-red-50'
                  : alertLevel === 'critical'
                  ? 'border-l-orange-500 bg-orange-50'
                  : alertLevel === 'warning'
                  ? 'border-l-yellow-500 bg-yellow-50'
                  : 'border-l-primary-500'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getCategoryName(budget.category_id)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    📅 {new Date(budget.start_date).toLocaleDateString()} -{' '}
                    {new Date(budget.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(budgetStatus)}
                    className="px-2 py-1 text-sm text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="px-2 py-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Alert Badge */}
              {alertLevel !== 'normal' && (
                <div
                  className={`px-3 py-2 rounded-lg mb-3 text-sm font-medium ${
                    alertLevel === 'over'
                      ? 'bg-red-100 text-red-800'
                      : alertLevel === 'critical'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  ⚠️{' '}
                  {is_over_budget
                    ? `Over by $${Math.abs(remaining).toFixed(2)}`
                    : `${(100 - percentage_used).toFixed(0)}% remaining`}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Spent</span>
                  <span className="font-semibold text-gray-900">${spent.toFixed(2)}</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      is_over_budget
                        ? 'bg-red-600'
                        : alertLevel === 'critical'
                        ? 'bg-orange-600'
                        : alertLevel === 'warning'
                        ? 'bg-yellow-600'
                        : 'bg-primary-600'
                    }`}
                    style={{ width: `${Math.min(percentage_used, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Budget</span>
                  <span className="font-semibold text-gray-900">${budget.amount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Remaining</span>
                  <span
                    className={`font-bold ${
                      is_over_budget ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    ${remaining.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {categoryBudgets.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first budget to start tracking your spending limits.
          </p>
          <button onClick={handleOpenCreate} className="btn btn-primary">
            Create Budget
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingBudget ? 'Edit Budget' : 'Create Budget'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category_id"
                  value={formData.category_id || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category_id: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="input"
                >
                  <option value="">Overall Budget (All Expenses)</option>
                  {categories
                    .filter((cat: Category) => cat.type === 'expense')
                    .map((category: Category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Amount
                </label>
                <input
                  type="number"
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="input"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label htmlFor="period_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Period Type
                </label>
                <select
                  id="period_type"
                  value={formData.period_type}
                  onChange={(e) => setFormData({ ...formData, period_type: e.target.value })}
                  className="input"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingBudget ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
