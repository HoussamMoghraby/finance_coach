/**
 * Recurring Transactions page - Manage recurring bills, subscriptions, and income
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  recurringTransactionsAPI,
  RecurringTransaction,
  RecurringTransactionCreate,
  RecurringTransactionDetection,
} from '@/services/recurringTransactions';
import { categoriesAPI, Category } from '@/services/categories';
import { formatDateForInput, formatUTCDate } from '@/utils/dateUtils';

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export const RecurringTransactionsPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'list' | 'detect' | 'upcoming'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const [formData, setFormData] = useState<RecurringTransactionCreate>({
    description: '',
    expected_amount: 0,
    frequency: 'monthly',
    next_expected_date: formatDateForInput(),
    is_active: true,
    confidence_score: 1.0,
  });

  // Fetch recurring transactions
  const { data: recurring = [], isLoading } = useQuery({
    queryKey: ['recurring-transactions'],
    queryFn: () => recurringTransactionsAPI.getAll(false),
  });

  // Fetch upcoming recurring
  const { data: upcoming = [] } = useQuery({
    queryKey: ['recurring-transactions', 'upcoming'],
    queryFn: () => recurringTransactionsAPI.getUpcoming(30),
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesAPI.getAll,
  });

  // Detect patterns mutation
  const detectMutation = useMutation({
    mutationFn: () => recurringTransactionsAPI.detect(3, 180),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: recurringTransactionsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RecurringTransactionCreate }) =>
      recurringTransactionsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      setIsModalOpen(false);
      setEditingRecurring(null);
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: recurringTransactionsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
    },
  });

  const resetForm = () => {
    setFormData({
      description: '',
      expected_amount: 0,
      frequency: 'monthly',
      next_expected_date: formatDateForInput(),
      is_active: true,
      confidence_score: 1.0,
    });
    setEditingRecurring(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: RecurringTransaction) => {
    setEditingRecurring(rec);
    setFormData({
      description: rec.description,
      expected_amount: rec.expected_amount,
      frequency: rec.frequency,
      next_expected_date: rec.next_expected_date,
      category_id: rec.category_id,
      is_active: rec.is_active,
      confidence_score: rec.confidence_score,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecurring) {
      updateMutation.mutate({ id: editingRecurring.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this recurring transaction?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDetect = () => {
    detectMutation.mutate();
  };

  const handleAddDetection = (detection: RecurringTransactionDetection) => {
    setFormData({
      description: detection.description,
      expected_amount: detection.expected_amount,
      frequency: detection.frequency,
      next_expected_date: formatDateForInput(),
      category_id: detection.category_id,
      is_active: true,
      confidence_score: detection.confidence_score,
    });
    setIsModalOpen(true);
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find((c: Category) => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getFrequencyLabel = (frequency: string) => {
    const option = FREQUENCY_OPTIONS.find((o) => o.value === frequency);
    return option?.label || frequency;
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return '📅';
      case 'weekly':
        return '📆';
      case 'monthly':
        return '🗓️';
      case 'quarterly':
        return '📊';
      case 'yearly':
        return '🎯';
      default:
        return '🔄';
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading recurring transactions...</div>;
  }

  const activeRecurring = recurring.filter((r) => r.is_active);
  const inactiveRecurring = recurring.filter((r) => !r.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Recurring Transactions</h1>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          + Add Recurring
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'list'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Recurring ({activeRecurring.length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'upcoming'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setActiveTab('detect')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'detect'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🔍 Detect Patterns
        </button>
      </div>

      {/* List Tab */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* Active Recurring */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRecurring.map((rec) => (
                <div key={rec.id} className="card border-l-4 border-l-primary-500">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-2xl">{getFrequencyIcon(rec.frequency)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{rec.description}</h3>
                        <p className="text-xs text-gray-500">{getFrequencyLabel(rec.frequency)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(rec)}
                        className="text-sm text-gray-600 hover:text-primary-600"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(rec.id)}
                        className="text-sm text-gray-600 hover:text-red-600"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-semibold text-gray-900">
                        ${rec.expected_amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Category</span>
                      <span className="text-gray-900">{getCategoryName(rec.category_id)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Next Due</span>
                      <span className="text-gray-900">
                        {formatUTCDate(rec.next_expected_date)}
                      </span>
                    </div>
                    {rec.confidence_score < 1.0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Confidence</span>
                        <span className="text-orange-600">
                          {(rec.confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {activeRecurring.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">🔄</div>
                <p>No active recurring transactions</p>
                <p className="text-sm mt-2">Add recurring bills, subscriptions, or income</p>
              </div>
            )}
          </div>

          {/* Inactive Recurring */}
          {inactiveRecurring.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Inactive</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inactiveRecurring.map((rec) => (
                  <div key={rec.id} className="card border-l-4 border-l-gray-300 opacity-60">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-2xl grayscale">{getFrequencyIcon(rec.frequency)}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{rec.description}</h3>
                          <p className="text-xs text-gray-500">{getFrequencyLabel(rec.frequency)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          className="text-sm text-gray-600 hover:text-primary-600"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id)}
                          className="text-sm text-gray-600 hover:text-red-600"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      ${rec.expected_amount.toFixed(2)} • {getCategoryName(rec.category_id)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upcoming Tab */}
      {activeTab === 'upcoming' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Next 30 Days</h2>
          <div className="space-y-3">
            {upcoming.map((rec) => {
              const daysUntil = Math.ceil(
                (new Date(rec.next_expected_date).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              const isOverdue = daysUntil < 0;
              const isSoon = daysUntil <= 7;

              return (
                <div
                  key={rec.id}
                  className={`card flex justify-between items-center ${
                    isOverdue
                      ? 'border-l-4 border-l-red-500 bg-red-50'
                      : isSoon
                      ? 'border-l-4 border-l-orange-500 bg-orange-50'
                      : 'border-l-4 border-l-primary-500'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-3xl">{getFrequencyIcon(rec.frequency)}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{rec.description}</h3>
                      <p className="text-sm text-gray-600">
                        {getCategoryName(rec.category_id)} • {getFrequencyLabel(rec.frequency)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-900">
                      ${rec.expected_amount.toFixed(2)}
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        isOverdue
                          ? 'text-red-600'
                          : isSoon
                          ? 'text-orange-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {isOverdue
                        ? `Overdue ${Math.abs(daysUntil)} days`
                        : daysUntil === 0
                        ? 'Due Today'
                        : `In ${daysUntil} days`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatUTCDate(rec.next_expected_date)}
                    </div>
                  </div>
                </div>
              );
            })}

            {upcoming.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">✅</div>
                <p>No upcoming recurring transactions in the next 30 days</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detect Tab */}
      {activeTab === 'detect' && (
        <div className="space-y-4">
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">🔍 Pattern Detection</h3>
            <p className="text-sm text-blue-800 mb-4">
              Analyze your transaction history to automatically detect recurring patterns like
              subscriptions, bills, and regular income.
            </p>
            <button
              onClick={handleDetect}
              disabled={detectMutation.isPending}
              className="btn btn-primary"
            >
              {detectMutation.isPending ? 'Detecting...' : 'Detect Patterns'}
            </button>
          </div>

          {detectMutation.data && detectMutation.data.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Detected {detectMutation.data.length} Patterns
              </h3>
              <div className="space-y-3">
                {detectMutation.data.map((detection, index) => (
                  <div key={index} className="card border-l-4 border-l-green-500">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{detection.description}</h4>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {(detection.confidence_score * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Amount: </span>
                            <span className="font-medium">
                              ${detection.expected_amount.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Frequency: </span>
                            <span className="font-medium">
                              {getFrequencyLabel(detection.frequency)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Occurrences: </span>
                            <span className="font-medium">{detection.transaction_count}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Category: </span>
                            <span className="font-medium">
                              {getCategoryName(detection.category_id)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Sample dates:{' '}
                          {detection.sample_dates
                            .map((d) => new Date(d).toLocaleDateString())
                            .join(', ')}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddDetection(detection)}
                        className="btn btn-primary btn-sm ml-4"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detectMutation.data && detectMutation.data.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🔍</div>
              <p>No recurring patterns detected</p>
              <p className="text-sm mt-2">
                Try adding more transactions or adjusting detection parameters
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingRecurring ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}
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
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  required
                  placeholder="e.g., Netflix Subscription, Rent Payment"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expected_amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    id="expected_amount"
                    value={formData.expected_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, expected_amount: parseFloat(e.target.value) })
                    }
                    className="input"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    id="frequency"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="input"
                  >
                    {FREQUENCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                  <option value="">Uncategorized</option>
                  {categories.map((category: Category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="next_expected_date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Next Expected Date
                </label>
                <input
                  type="date"
                  id="next_expected_date"
                  value={formData.next_expected_date}
                  onChange={(e) =>
                    setFormData({ ...formData, next_expected_date: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active
                </label>
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
                  {editingRecurring ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
