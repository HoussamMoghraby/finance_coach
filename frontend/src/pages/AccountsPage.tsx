/**
 * Accounts page - manage financial accounts and wallets
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsAPI, Account, AccountCreate } from '@/services/accounts';

const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bank Account', icon: '🏦' },
  { value: 'cash', label: 'Cash Wallet', icon: '💵' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
  { value: 'debit_card', label: 'Debit Card', icon: '💳' },
  { value: 'savings', label: 'Savings Account', icon: '🏦' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

export const AccountsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState<AccountCreate>({
    name: '',
    type: 'bank',
    currency: 'USD',
    opening_balance: 0,
  });

  // Fetch accounts
  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsAPI.getAll,
  });

  // Create account mutation
  const createMutation = useMutation({
    mutationFn: accountsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  // Update account mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AccountCreate> }) =>
      accountsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsModalOpen(false);
      resetForm();
      setEditingAccount(null);
    },
  });

  // Delete account mutation
  const deleteMutation = useMutation({
    mutationFn: accountsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'bank',
      currency: 'USD',
      opening_balance: 0,
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      currency: account.currency,
      opening_balance: account.opening_balance,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      deleteMutation.mutate(id);
    }
  };

  const getAccountIcon = (type: string) => {
    return ACCOUNT_TYPES.find((t) => t.value === type)?.icon || '💼';
  };

  const formatBalance = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getTotalBalance = () => {
    if (!accounts) return 0;
    return accounts
      .filter((acc) => acc.is_active)
      .reduce((sum, acc) => sum + acc.current_balance, 0);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading accounts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading accounts. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounts & Wallets</h1>
          <p className="text-gray-600 mt-1">Manage your financial accounts</p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          + Add Account
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
        <h3 className="text-lg font-medium opacity-90">Total Balance</h3>
        <p className="text-4xl font-bold mt-2">{formatBalance(getTotalBalance(), 'USD')}</p>
        <p className="text-sm opacity-80 mt-1">
          Across {accounts?.filter((acc) => acc.is_active).length || 0} active accounts
        </p>
      </div>

      {/* Accounts Grid */}
      {accounts && accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`card ${!account.is_active ? 'opacity-50' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{getAccountIcon(account.type)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{account.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {account.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                {!account.is_active && (
                  <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                    Inactive
                  </span>
                )}
              </div>

              <div className="mb-4">
                <p className="text-2xl font-bold text-gray-900">
                  {formatBalance(account.current_balance, account.currency)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Opening: {formatBalance(account.opening_balance, account.currency)}
                </p>
              </div>

              <div className="flex space-x-2 pt-4 border-t">
                <button
                  onClick={() => handleOpenEdit(account)}
                  className="btn btn-secondary flex-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="btn bg-red-50 text-red-600 hover:bg-red-100 flex-1"
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <span className="text-6xl">💰</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No accounts yet</h3>
          <p className="mt-2 text-gray-500">Get started by creating your first account</p>
          <button onClick={handleOpenCreate} className="btn btn-primary mt-4">
            Create Account
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">
              {editingAccount ? 'Edit Account' : 'Create New Account'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Account Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input mt-1"
                  placeholder="e.g., Chase Checking"
                  required
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Account Type *
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input mt-1"
                  required
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                  Currency
                </label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="input mt-1"
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="opening_balance"
                  className="block text-sm font-medium text-gray-700"
                >
                  Opening Balance
                </label>
                <input
                  type="number"
                  id="opening_balance"
                  value={formData.opening_balance}
                  onChange={(e) =>
                    setFormData({ ...formData, opening_balance: parseFloat(e.target.value) })
                  }
                  className="input mt-1"
                  step="0.01"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingAccount(null);
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
                  {editingAccount ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
