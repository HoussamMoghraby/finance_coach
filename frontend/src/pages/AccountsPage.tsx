/**
 * Accounts page - manage financial accounts and wallets
 */
import { useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
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
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
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
        <IonSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <IonCard color="danger">
        <IonCardContent>
          <IonText color="light">
            <p>Error loading accounts. Please try again.</p>
          </IonText>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Accounts & Wallets</h1>
          <IonText color="medium">
            <p className="text-sm">Manage your financial accounts</p>
          </IonText>
        </div>
        <IonButton onClick={handleOpenCreate}>+ Add Account</IonButton>
      </div>

      {/* Summary Card */}
      <IonCard color="primary">
        <IonCardContent>
          <IonText color="light">
            <p className="text-sm font-medium opacity-90">Total Balance</p>
            <h2 className="text-3xl font-bold mt-1">{formatBalance(getTotalBalance(), 'USD')}</h2>
            <p className="text-sm opacity-80 mt-1">
              Across {accounts?.filter((acc) => acc.is_active).length || 0} active accounts
            </p>
          </IonText>
        </IonCardContent>
      </IonCard>

      {/* Accounts Grid */}
      {accounts && accounts.length > 0 ? (
        <IonGrid className="ion-no-padding">
          <IonRow>
            {accounts.map((account) => (
              <IonCol key={account.id} size="12" sizeMd="6" sizeLg="4">
                <IonCard className={!account.is_active ? 'opacity-50' : ''}>
                  <IonCardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">{getAccountIcon(account.type)}</span>
                        <div>
                          <IonCardTitle className="text-base">{account.name}</IonCardTitle>
                          <IonText color="medium">
                            <p className="text-sm capitalize">
                              {account.type.replace('_', ' ')}
                            </p>
                          </IonText>
                        </div>
                      </div>
                      {!account.is_active && (
                        <IonBadge color="medium">Inactive</IonBadge>
                      )}
                    </div>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="mb-3">
                      <p className="text-2xl font-bold">
                        {formatBalance(account.current_balance, account.currency)}
                      </p>
                      <IonText color="medium">
                        <p className="text-xs mt-1">
                          Opening: {formatBalance(account.opening_balance, account.currency)}
                        </p>
                      </IonText>
                    </div>

                    <div className="flex space-x-2 pt-3 border-t">
                      <IonButton
                        fill="outline"
                        size="small"
                        expand="block"
                        onClick={() => handleOpenEdit(account)}
                        className="flex-1"
                      >
                        Edit
                      </IonButton>
                      <IonButton
                        fill="outline"
                        size="small"
                        expand="block"
                        color="danger"
                        onClick={() => handleDelete(account.id)}
                        disabled={deleteMutation.isPending}
                        className="flex-1"
                      >
                        Delete
                      </IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      ) : (
        <div className="text-center py-12">
          <IonCard>
            <IonCardContent>
              <span className="text-6xl">💰</span>
              <h3 className="mt-4 text-lg font-medium">No accounts yet</h3>
              <IonText color="medium">
                <p className="mt-2">Get started by creating your first account</p>
              </IonText>
              <IonButton onClick={handleOpenCreate} className="mt-4">
                Create Account
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      )}

      {/* Create/Edit Modal */}
      <IonModal isOpen={isModalOpen} onDidDismiss={() => {
        setIsModalOpen(false);
        setEditingAccount(null);
        resetForm();
      }}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{editingAccount ? 'Edit Account' : 'Create New Account'}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => {
                setIsModalOpen(false);
                setEditingAccount(null);
                resetForm();
              }}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <form onSubmit={handleSubmit}>
            <IonItem className="mb-4">
              <IonLabel position="stacked">Account Name *</IonLabel>
              <IonInput
                type="text"
                value={formData.name}
                onIonChange={(e) => setFormData({ ...formData, name: e.detail.value! })}
                placeholder="e.g., Chase Checking"
                required
              />
            </IonItem>

            <IonItem className="mb-4">
              <IonLabel position="stacked">Account Type *</IonLabel>
              <IonSelect
                value={formData.type}
                onIonChange={(e) => setFormData({ ...formData, type: e.detail.value })}
              >
                {ACCOUNT_TYPES.map((type) => (
                  <IonSelectOption key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem className="mb-4">
              <IonLabel position="stacked">Currency</IonLabel>
              <IonSelect
                value={formData.currency}
                onIonChange={(e) => setFormData({ ...formData, currency: e.detail.value })}
              >
                {CURRENCIES.map((curr) => (
                  <IonSelectOption key={curr} value={curr}>
                    {curr}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem className="mb-6">
              <IonLabel position="stacked">Opening Balance</IonLabel>
              <IonInput
                type="number"
                value={formData.opening_balance}
                onIonChange={(e) =>
                  setFormData({ ...formData, opening_balance: parseFloat(e.detail.value!) })
                }
                step="0.01"
              />
            </IonItem>

            <div className="flex space-x-3">
              <IonButton
                fill="outline"
                expand="block"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingAccount(null);
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
                {editingAccount ? 'Update' : 'Create'}
              </IonButton>
            </div>
          </form>
        </IonContent>
      </IonModal>
    </div>
  );
};
