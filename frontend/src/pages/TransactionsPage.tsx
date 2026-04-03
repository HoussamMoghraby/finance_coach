/**
 * Transactions page - manage income, expenses, and transfers
 */
import { useState, useMemo } from 'react';
import {
  IonCard,
  IonCardContent,
  IonButton,
  IonSpinner,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonBadge,
  IonButtons,
  IonIcon,
  IonList,
  IonTextarea,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import { closeOutline, arrowForwardOutline, filterOutline } from 'ionicons/icons';
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
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({ limit: 100 });
  const [tempFilters, setTempFilters] = useState<TransactionFilters>({ limit: 100 });

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
        <IonSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <IonCard color="danger">
        <IonCardContent>
          <IonText color="light">
            <p>Error loading transactions. Please try again.</p>
          </IonText>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Transactions</h1>
          <IonText color="medium">
            <p className="text-sm">Track your income and expenses</p>
          </IonText>
        </div>
        <IonButton fill="clear" onClick={() => {
          setTempFilters(filters);
          setIsFilterModalOpen(true);
        }}>
          <IonIcon icon={filterOutline} slot="icon-only" />
        </IonButton>
      </div>

      {/* Add Transaction Button */}
      <div className="flex justify-center py-2">
        <IonButton onClick={handleOpenCreate}>+ Add Transaction</IonButton>
      </div>

      {/* Transactions List */}
      {transactions && transactions.length > 0 ? (
        <IonList>
          {transactions.map((transaction) => {
            const typeStyle = getTypeStyle(transaction.type);
            const typeColor =
              transaction.type === 'income'
                ? 'success'
                : transaction.type === 'expense'
                ? 'danger'
                : 'primary';

            return (
              <IonCard key={transaction.id}>
                <IonCardContent>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <IonBadge color={typeColor}>{typeStyle.label}</IonBadge>
                        <IonText color="medium">
                          <span className="text-xs">{formatUTCDate(transaction.transaction_date)}</span>
                        </IonText>
                      </div>
                      <h3 className="font-semibold text-base">{transaction.description}</h3>
                      {transaction.notes && (
                        <IonText color="medium">
                          <p className="text-xs mt-1">{transaction.notes}</p>
                        </IonText>
                      )}
                    </div>
                    <div className="text-right">
                      <IonText color={typeColor}>
                        <p className="font-bold text-lg">{formatAmount(transaction.amount, transaction.type)}</p>
                      </IonText>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="text-sm">
                      {transaction.type === 'transfer' && transaction.to_account_id ? (
                        <IonText color="medium">
                          <div className="flex items-center space-x-1">
                            <span>{getAccountName(transaction.account_id)}</span>
                            <IonIcon icon={arrowForwardOutline} className="text-xs" />
                            <span>{getAccountName(transaction.to_account_id)}</span>
                          </div>
                        </IonText>
                      ) : (
                        <IonText color="medium">
                          <div>
                            <div className="font-medium">{getAccountName(transaction.account_id)}</div>
                            <div className="text-xs">{getCategoryName(transaction.category_id)}</div>
                          </div>
                        </IonText>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <IonButton
                        size="small"
                        fill="clear"
                        onClick={() => handleOpenEdit(transaction)}
                      >
                        Edit
                      </IonButton>
                      <IonButton
                        size="small"
                        fill="clear"
                        color="danger"
                        onClick={() => handleDelete(transaction.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </IonButton>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            );
          })}
        </IonList>
      ) : (
        <div className="text-center py-12">
          <IonCard>
            <IonCardContent>
              <span className="text-6xl">💰</span>
              <h3 className="mt-4 text-lg font-medium">No transactions yet</h3>
              <IonText color="medium">
                <p className="mt-2">Start tracking your finances by adding your first transaction</p>
              </IonText>
              <IonButton onClick={handleOpenCreate} className="mt-4">
                Add Transaction
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      )}

      {/* Filter Modal */}
      <IonModal
        isOpen={isFilterModalOpen}
        onDidDismiss={() => setIsFilterModalOpen(false)}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Filter Transactions</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setIsFilterModalOpen(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonGrid className="ion-no-padding">
            <IonRow>
              <IonCol size="12">
                <IonItem>
                  <IonLabel position="stacked">Account</IonLabel>
                  <IonSelect
                    interface="action-sheet"
                    value={tempFilters.account_id || ''}
                    onIonChange={(e) =>
                      setTempFilters({ ...tempFilters, account_id: e.detail.value ? parseInt(e.detail.value) : undefined })
                    }
                  >
                    <IonSelectOption value="">All Accounts</IonSelectOption>
                    {accounts?.map((account) => (
                      <IonSelectOption key={account.id} value={account.id}>
                        {account.name}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </IonCol>

              <IonCol size="12">
                <IonItem>
                  <IonLabel position="stacked">Category</IonLabel>
                  <IonSelect
                    interface="action-sheet"
                    value={tempFilters.category_id || ''}
                    onIonChange={(e) =>
                      setTempFilters({ ...tempFilters, category_id: e.detail.value ? parseInt(e.detail.value) : undefined })
                    }
                  >
                    <IonSelectOption value="">All Categories</IonSelectOption>
                    {categories?.map((category) => (
                      <IonSelectOption key={category.id} value={category.id}>
                        {category.name}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </IonCol>

              <IonCol size="12">
                <IonItem>
                  <IonLabel position="stacked">Type</IonLabel>
                  <IonSelect
                    interface="action-sheet"
                    value={tempFilters.type || ''}
                    onIonChange={(e) => setTempFilters({ ...tempFilters, type: e.detail.value || undefined })}
                  >
                    <IonSelectOption value="">All Types</IonSelectOption>
                    {TRANSACTION_TYPES.map((type) => (
                      <IonSelectOption key={type.value} value={type.value}>
                        {type.label}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </IonCol>

              <IonCol size="12" className="mt-4">
                <div className="flex space-x-3">
                  <IonButton
                    fill="outline"
                    expand="block"
                    onClick={() => {
                      setFilters({ limit: 100 });
                      setTempFilters({ limit: 100 });
                      setIsFilterModalOpen(false);
                    }}
                    className="flex-1"
                  >
                    Clear Filters
                  </IonButton>
                  <IonButton
                    expand="block"
                    onClick={() => {
                      setFilters(tempFilters);
                      setIsFilterModalOpen(false);
                    }}
                    className="flex-1"
                  >
                    Filter
                  </IonButton>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
      </IonModal>

      {/* Create/Edit Modal */}
      <IonModal
        isOpen={isModalOpen}
        onDidDismiss={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
          resetForm();
        }}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</IonTitle>
            <IonButtons slot="end">
              <IonButton
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTransaction(null);
                  resetForm();
                }}
              >
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <form onSubmit={handleSubmit}>
            <IonItem className="mb-4">
              <IonLabel position="stacked">Type *</IonLabel>
              <IonSelect
                value={formData.type}
                onIonChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.detail.value as any,
                    category_id: undefined,
                    to_account_id: undefined,
                  })
                }
              >
                {TRANSACTION_TYPES.map((type) => (
                  <IonSelectOption key={type.value} value={type.value}>
                    {type.label}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem className="mb-4">
              <IonLabel position="stacked">
                {formData.type === 'transfer' ? 'From Account (Source) *' : 'Account *'}
              </IonLabel>
              <IonSelect
                value={formData.account_id}
                onIonChange={(e) => setFormData({ ...formData, account_id: parseInt(e.detail.value) })}
              >
                <IonSelectOption value={0}>Select account</IonSelectOption>
                {accounts?.map((account) => (
                  <IonSelectOption key={account.id} value={account.id}>
                    {account.name}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            {formData.type === 'transfer' && (
              <IonItem className="mb-4">
                <IonLabel position="stacked">To Account (Target) *</IonLabel>
                <IonSelect
                  value={formData.to_account_id || 0}
                  onIonChange={(e) => setFormData({ ...formData, to_account_id: parseInt(e.detail.value) })}
                >
                  <IonSelectOption value={0}>Select target account</IonSelectOption>
                  {accounts
                    ?.filter((acc) => acc.id !== formData.account_id)
                    .map((account) => (
                      <IonSelectOption key={account.id} value={account.id}>
                        {account.name}
                      </IonSelectOption>
                    ))}
                </IonSelect>
                <IonText color="medium">
                  <p className="text-xs mt-1">Internal transfer: money will be moved from source to target account</p>
                </IonText>
              </IonItem>
            )}

            {formData.type !== 'transfer' && (
              <IonItem className="mb-4">
                <IonLabel position="stacked">Category</IonLabel>
                <IonSelect
                  value={formData.category_id || ''}
                  onIonChange={(e) =>
                    setFormData({ ...formData, category_id: e.detail.value ? parseInt(e.detail.value) : undefined })
                  }
                >
                  <IonSelectOption value="">Uncategorized</IonSelectOption>
                  {filteredCategories.map((category) => (
                    <IonSelectOption key={category.id} value={category.id}>
                      {category.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            )}

            <IonItem className="mb-4">
              <IonLabel position="stacked">Amount *</IonLabel>
              <IonInput
                type="number"
                value={formData.amount || ''}
                onIonInput={(e) => setFormData({ ...formData, amount: parseFloat((e.target as HTMLIonInputElement).value as string) })}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
              />
            </IonItem>

            <IonItem className="mb-4">
              <IonLabel position="stacked">Description *</IonLabel>
              <IonInput
                type="text"
                value={formData.description}
                onIonInput={(e) => setFormData({ ...formData, description: (e.target as HTMLIonInputElement).value as string })}
                placeholder="e.g., Grocery shopping"
                required
              />
            </IonItem>

            <IonItem className="mb-4">
              <IonLabel position="stacked">Date *</IonLabel>
              <IonInput
                type="date"
                value={formData.transaction_date}
                onIonInput={(e) => setFormData({ ...formData, transaction_date: (e.target as HTMLIonInputElement).value as string })}
                required
              />
            </IonItem>

            <IonItem className="mb-6">
              <IonLabel position="stacked">Notes</IonLabel>
              <IonTextarea
                value={formData.notes || ''}
                onIonInput={(e) => setFormData({ ...formData, notes: (e.target as HTMLIonTextareaElement).value as string })}
                rows={3}
                placeholder="Additional details (optional)"
              />
            </IonItem>

            <div className="flex space-x-3">
              <IonButton
                fill="outline"
                expand="block"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTransaction(null);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </IonButton>
              <IonButton
                type="submit"
                expand="block"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1"
              >
                {editingTransaction ? 'Update' : 'Create'}
              </IonButton>
            </div>
          </form>
        </IonContent>
      </IonModal>
    </div>
  );
};
