/**
 * Transactions page - manage income, expenses, and transfers
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsAPI, Transaction, TransactionCreate, TransactionFilters } from '@/services/transactions';
import { accountsAPI } from '@/services/accounts';
import { categoriesAPI } from '@/services/categories';
import { formatUTCDate, formatDateForInput } from '@/utils/dateUtils';

const TRANSACTION_TYPES = [
  { value: 'income', label: 'Income', color: 'text-green-600', bg: 'bg-green-50' },
  { value: 'expense', label: 'Expense', color: 'text-red-600', bg: 'bg-red-50' },
  { value: 'transfer', label: 'Transfer', color: 'text-blue-600', bg: 'bg-blue-50' },
];

export const TransactionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({ limit: 100 });

  const [formData, setFormData] = useState<TransactionCreate>({
    account_id: 0,
    type: 'expense',
    amount: 0,
    description: '',
    transaction_date: formatDateForInput(),
  });

  // Fetch transactions with filters
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionsAPI.getAll(filters),
  });

  // Fetch accounts for dropdown
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsAPI.getAll,
  });

  // Fetch categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesAPI.getAll,
  });

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: transactionsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  // Update transaction mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TransactionCreate> }) =>
      transactionsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setIsModalOpen(false);
      resetForm();
      setEditingTransaction(null);
    },
  });

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: transactionsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const resetForm = () => {
    setFormData({
      account_id: accounts?.[0]?.id || 0,
      type: 'expense',
      amount: 0,
      description: '',
      transaction_date: formatDateForInput(),
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      account_id: transaction.account_id,
      to_account_id: transaction.to_account_id,
      category_id: transaction.category_id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      notes: transaction.notes,
      transaction_date: transaction.transaction_date,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteMutation.mutate(id);
    }
  };

  // Get account name by ID
  const getAccountName = (accountId: number) => {
    return accounts?.find((acc) => acc.id === accountId)?.name || 'Unknown';
  };

  // Get category name by ID
  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return 'Uncategorized';
    return categories?.find((cat) => cat.id === categoryId)?.name || 'Unknown';
  };

  // Filter categories by transaction type
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter((cat) => cat.type === formData.type);
  }, [categories, formData.type]);

  // Format currency
  const formatAmount = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

    if (type === 'income') return `+${formatted}`;
    if (type === 'expense') return `-${formatted}`;
    return formatted;
  };

  // formatDate is now handled by formatUTCDate from dateUtils

  // Get transaction type style
  const getTypeStyle = (type: string) => {
    return TRANSACTION_TYPES.find((t) => t.value === type) || TRANSACTION_TYPES[1];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading transactions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading transactions. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1">Track your income and expenses</p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          + Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
            <select
              value={filters.account_id || ''}
              onChange={(e) =>
                setFilters({ ...filters, account_id: e.target.value ? parseInt(e.target.value) : undefined })
              }
              className="input"
            >
              <option value="">All Accounts</option>
              {accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category_id || ''}
              onChange={(e) =>
                setFilters({ ...filters, category_id: e.target.value ? parseInt(e.target.value) : undefined })
              }
              className="input"
            >
              <option value="">All Categories</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type || ''}
              onChange={(e) => setFilters({ ...filters, type: e.target.value || undefined })}
              className="input"
            >
              <option value="">All Types</option>
              {TRANSACTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ limit: 100 })}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {transactions && transactions.length > 0 ? (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => {
                  const typeStyle = getTypeStyle(transaction.type);
                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatUTCDate(transaction.transaction_date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{transaction.description}</div>
                        {transaction.notes && (
                          <div className="text-xs text-gray-500 mt-1">{transaction.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {getCategoryName(transaction.category_id)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {transaction.type === 'transfer' && transaction.to_account_id ? (
                          <div>
                            <div className="font-medium">{getAccountName(transaction.account_id)}</div>
                            <div className="text-xs text-gray-500">→ {getAccountName(transaction.to_account_id)}</div>
                          </div>
                        ) : (
                          getAccountName(transaction.account_id)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${typeStyle.bg} ${typeStyle.color}`}>
                          {typeStyle.label}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${typeStyle.color}`}>
                        {formatAmount(transaction.amount, transaction.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        <button
                          onClick={() => handleOpenEdit(transaction)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <span className="text-6xl">💰</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No transactions yet</h3>
          <p className="mt-2 text-gray-500">Start tracking your finances by adding your first transaction</p>
          <button onClick={handleOpenCreate} className="btn btn-primary mt-4">
            Add Transaction
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Type *
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any, category_id: undefined, to_account_id: undefined })}
                  className="input mt-1"
                  required
                >
                  {TRANSACTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="account_id" className="block text-sm font-medium text-gray-700">
                  {formData.type === 'transfer' ? 'From Account (Source) *' : 'Account *'}
                </label>
                <select
                  id="account_id"
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: parseInt(e.target.value) })}
                  className="input mt-1"
                  required
                >
                  <option value={0}>Select account</option>
                  {accounts?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.type === 'transfer' && (
                <div>
                  <label htmlFor="to_account_id" className="block text-sm font-medium text-gray-700">
                    To Account (Target) *
                  </label>
                  <select
                    id="to_account_id"
                    value={formData.to_account_id || 0}
                    onChange={(e) => setFormData({ ...formData, to_account_id: parseInt(e.target.value) })}
                    className="input mt-1"
                    required={formData.type === 'transfer'}
                  >
                    <option value={0}>Select target account</option>
                    {accounts?.filter(acc => acc.id !== formData.account_id).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Internal transfer: money will be moved from source to target account
                  </p>
                </div>
              )}

              {formData.type !== 'transfer' && (
                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    id="category_id"
                    value={formData.category_id || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : undefined })
                    }
                    className="input mt-1"
                  >
                    <option value="">Uncategorized</option>
                    {filteredCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount *
                </label>
                <input
                  type="number"
                  id="amount"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="input mt-1"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <input
                  type="text"
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input mt-1"
                  placeholder="e.g., Grocery shopping"
                  required
                />
              </div>

              <div>
                <label htmlFor="transaction_date" className="block text-sm font-medium text-gray-700">
                  Date *
                </label>
                <input
                  type="date"
                  id="transaction_date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  className="input mt-1"
                  required
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input mt-1"
                  rows={3}
                  placeholder="Additional details (optional)"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTransaction(null);
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
                  {editingTransaction ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
