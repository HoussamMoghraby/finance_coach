/**
 * Recurring Transactions page - Manage recurring bills, subscriptions, and income
 */
import { useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
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
  IonText,
  IonSegment,
  IonSegmentButton,
  IonCheckbox,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
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
    return (
      <div className="flex justify-center items-center h-64">
        <IonSpinner />
      </div>
    );
  }

  const activeRecurring = recurring.filter((r) => r.is_active);
  const inactiveRecurring = recurring.filter((r) => !r.is_active);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Recurring Transactions</h1>
          <IonText color="medium">
            <p className="text-sm">Manage subscriptions and recurring bills</p>
          </IonText>
        </div>
        <IonButton onClick={handleOpenCreate}>
          + Add Recurring
        </IonButton>
      </div>

      {/* Tabs */}
      <IonSegment value={activeTab} onIonChange={(e) => setActiveTab(e.detail.value as any)}>
        <IonSegmentButton value="list">
          <IonLabel>All ({activeRecurring.length})</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="upcoming">
          <IonLabel>Upcoming ({upcoming.length})</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="detect">
          <IonLabel>🔍 Detect</IonLabel>
        </IonSegmentButton>
      </IonSegment>

      {/* List Tab */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Active Recurring */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Active</h2>
            <IonGrid className="ion-no-padding">
              <IonRow>
                {activeRecurring.map((rec) => (
                  <IonCol key={rec.id} size="12" sizeMd="6" sizeLg="4">
                    <IonCard color="primary">
                      <IonCardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-2xl">{getFrequencyIcon(rec.frequency)}</span>
                            <div>
                              <IonCardTitle className="text-base">{rec.description}</IonCardTitle>
                              <IonText color="light">
                                <p className="text-xs opacity-80">{getFrequencyLabel(rec.frequency)}</p>
                              </IonText>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <IonButton fill="clear" size="small" onClick={() => handleOpenEdit(rec)}>
                              ✏️
                            </IonButton>
                            <IonButton fill="clear" size="small" color="danger" onClick={() => handleDelete(rec.id)}>
                              🗑️
                            </IonButton>
                          </div>
                        </div>
                      </IonCardHeader>

                      <IonCardContent>
                        <IonText color="light">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="opacity-80">Amount</span>
                              <span className="font-semibold">${rec.expected_amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="opacity-80">Category</span>
                              <span>{getCategoryName(rec.category_id)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="opacity-80">Next Due</span>
                              <span>{formatUTCDate(rec.next_expected_date)}</span>
                            </div>
                            {rec.confidence_score < 1.0 && (
                              <div className="flex justify-between text-sm">
                                <span className="opacity-80">Confidence</span>
                                <IonBadge color="warning">{(rec.confidence_score * 100).toFixed(0)}%</IonBadge>
                              </div>
                            )}
                          </div>
                        </IonText>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>

            {activeRecurring.length === 0 && (
              <IonCard>
                <IonCardContent className="text-center py-8">
                  <div className="text-4xl mb-4">🔄</div>
                  <IonText color="medium">
                    <p>No active recurring transactions</p>
                    <p className="text-sm mt-2">Add recurring bills, subscriptions, or income</p>
                  </IonText>
                </IonCardContent>
              </IonCard>
            )}
          </div>

          {/* Inactive Recurring */}
          {inactiveRecurring.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Inactive</h2>
              <IonGrid className="ion-no-padding">
                <IonRow>
                  {inactiveRecurring.map((rec) => (
                    <IonCol key={rec.id} size="12" sizeMd="6" sizeLg="4">
                      <IonCard className="opacity-60">
                        <IonCardContent>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-2xl grayscale">{getFrequencyIcon(rec.frequency)}</span>
                              <div>
                                <h3 className="font-semibold">{rec.description}</h3>
                                <IonText color="medium">
                                  <p className="text-xs">{getFrequencyLabel(rec.frequency)}</p>
                                </IonText>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <IonButton fill="clear" size="small" onClick={() => handleOpenEdit(rec)}>
                                ✏️
                              </IonButton>
                              <IonButton fill="clear" size="small" color="danger" onClick={() => handleDelete(rec.id)}>
                                🗑️
                              </IonButton>
                            </div>
                          </div>
                          <IonText color="medium">
                            <p className="text-sm mt-2">
                              ${rec.expected_amount.toFixed(2)} • {getCategoryName(rec.category_id)}
                            </p>
                          </IonText>
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            </div>
          )}
        </div>
      )}

      {/* Upcoming Tab */}
      {activeTab === 'upcoming' && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Next 30 Days</h2>
          <div className="space-y-3">
            {upcoming.map((rec) => {
              const daysUntil = Math.ceil(
                (new Date(rec.next_expected_date).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              const isOverdue = daysUntil < 0;
              const isSoon = daysUntil <= 7;

              const cardColor = /*isOverdue ? 'danger' : isSoon ? 'warning' : */undefined;
              return (
                <IonCard key={rec.id} color={cardColor}>
                  <IonCardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-3xl">{getFrequencyIcon(rec.frequency)}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold">{rec.description}</h3>
                          <IonText color="medium">
                            <p className="text-sm">
                              {getCategoryName(rec.category_id)} • {getFrequencyLabel(rec.frequency)}
                            </p>
                          </IonText>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-lg">
                          ${rec.expected_amount.toFixed(2)}
                        </div>
                        <IonBadge color={isOverdue ? 'danger' : isSoon ? 'warning' : 'medium'}>
                          {isOverdue
                            ? `Overdue ${Math.abs(daysUntil)} days`
                            : daysUntil === 0
                            ? 'Due Today'
                            : `In ${daysUntil} days`}
                        </IonBadge>
                        <IonText color="medium">
                          <p className="text-xs mt-1">{formatUTCDate(rec.next_expected_date)}</p>
                        </IonText>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              );
            })}

            {upcoming.length === 0 && (
              <IonCard>
                <IonCardContent className="text-center py-8">
                  <div className="text-4xl mb-4">✅</div>
                  <IonText color="medium">
                    <p>No upcoming recurring transactions in the next 30 days</p>
                  </IonText>
                </IonCardContent>
              </IonCard>
            )}
          </div>
        </div>
      )}

      {/* Detect Tab */}
      {activeTab === 'detect' && (
        <div className="space-y-4">
          <IonCard color="secondary">
            <IonCardContent>
              <IonText color="light">
                <h3 className="font-semibold mb-2">🔍 Pattern Detection</h3>
                <p className="text-sm mb-4 opacity-90">
                  Analyze your transaction history to automatically detect recurring patterns like
                  subscriptions, bills, and regular income.
                </p>
              </IonText>
              <IonButton
                onClick={handleDetect}
                disabled={detectMutation.isPending}
                expand="block"
              >
                {detectMutation.isPending ? 'Detecting...' : 'Detect Patterns'}
              </IonButton>
            </IonCardContent>
          </IonCard>

          {detectMutation.data && detectMutation.data.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Detected {detectMutation.data.length} Patterns
              </h3>
              <div className="space-y-3">
                {detectMutation.data.map((detection, index) => (
                  <IonCard key={index} color="success">
                    <IonCardContent>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <IonText color="light">
                              <h4 className="font-semibold">{detection.description}</h4>
                            </IonText>
                            <IonBadge color="light">
                              {(detection.confidence_score * 100).toFixed(0)}% confidence
                            </IonBadge>
                          </div>
                          <IonText color="light">
                            <div className="grid grid-cols-2 gap-3 text-sm opacity-90">
                              <div>
                                <span>Amount: </span>
                                <span className="font-medium">${detection.expected_amount.toFixed(2)}</span>
                              </div>
                              <div>
                                <span>Frequency: </span>
                                <span className="font-medium">{getFrequencyLabel(detection.frequency)}</span>
                              </div>
                              <div>
                                <span>Occurrences: </span>
                                <span className="font-medium">{detection.transaction_count}</span>
                              </div>
                              <div>
                                <span>Category: </span>
                                <span className="font-medium">{getCategoryName(detection.category_id)}</span>
                              </div>
                            </div>
                            <p className="mt-2 text-xs opacity-75">
                              Sample dates:{' '}
                              {detection.sample_dates
                                .map((d) => new Date(d).toLocaleDateString())
                                .join(', ')}
                            </p>
                          </IonText>
                        </div>
                        <IonButton
                          onClick={() => handleAddDetection(detection)}
                          size="small"
                          className="ml-4"
                        >
                          + Add
                        </IonButton>
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </div>
            </div>
          )}

          {detectMutation.data && detectMutation.data.length === 0 && (
            <IonCard>
              <IonCardContent className="text-center py-8">
                <div className="text-4xl mb-4">🔍</div>
                <IonText color="medium">
                  <p>No recurring patterns detected</p>
                  <p className="text-sm mt-2">
                    Try adding more transactions or adjusting detection parameters
                  </p>
                </IonText>
              </IonCardContent>
            </IonCard>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <IonModal
        isOpen={isModalOpen}
        onDidDismiss={() => {
          setIsModalOpen(false);
          resetForm();
        }}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>
              {editingRecurring ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}
            </IonTitle>
            <IonButtons slot="end">
              <IonButton
                onClick={() => {
                  setIsModalOpen(false);
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
              <IonLabel position="stacked">Description *</IonLabel>
              <IonInput
                type="text"
                value={formData.description}
                onIonInput={(e) =>
                  setFormData({ ...formData, description: (e.target as HTMLIonInputElement).value as string })
                }
                required
                placeholder="e.g., Netflix Subscription, Rent Payment"
              />
            </IonItem>

            <IonGrid className="ion-no-padding">
              <IonRow>
                <IonCol size="6">
                  <IonItem className="mb-4">
                    <IonLabel position="stacked">Amount *</IonLabel>
                    <IonInput
                      type="number"
                      value={formData.expected_amount}
                      onIonInput={(e) =>
                        setFormData({
                          ...formData,
                          expected_amount: parseFloat((e.target as HTMLIonInputElement).value as string),
                        })
                      }
                      step="0.01"
                      min="0"
                      required
                    />
                  </IonItem>
                </IonCol>

                <IonCol size="6">
                  <IonItem className="mb-4">
                    <IonLabel position="stacked">Frequency *</IonLabel>
                    <IonSelect
                      value={formData.frequency}
                      onIonChange={(e) => setFormData({ ...formData, frequency: e.detail.value })}
                    >
                      {FREQUENCY_OPTIONS.map((option) => (
                        <IonSelectOption key={option.value} value={option.value}>
                          {option.label}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                </IonCol>
              </IonRow>
            </IonGrid>

            <IonItem className="mb-4">
              <IonLabel position="stacked">Category</IonLabel>
              <IonSelect
                value={formData.category_id || ''}
                onIonChange={(e) =>
                  setFormData({
                    ...formData,
                    category_id: e.detail.value ? parseInt(e.detail.value) : undefined,
                  })
                }
              >
                <IonSelectOption value="">Uncategorized</IonSelectOption>
                {categories.map((category: Category) => (
                  <IonSelectOption key={category.id} value={category.id}>
                    {category.name}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem className="mb-4">
              <IonLabel position="stacked">Next Expected Date *</IonLabel>
              <IonInput
                type="date"
                value={formData.next_expected_date}
                onIonInput={(e) =>
                  setFormData({ ...formData, next_expected_date: (e.target as HTMLIonInputElement).value as string })
                }
                required
              />
            </IonItem>

            <IonItem className="mb-6">
              <IonLabel>Active</IonLabel>
              <IonCheckbox
                checked={formData.is_active}
                onIonChange={(e) => setFormData({ ...formData, is_active: e.detail.checked })}
                slot="end"
              />
            </IonItem>

            <div className="flex gap-3">
              <IonButton
                fill="outline"
                expand="block"
                onClick={() => {
                  setIsModalOpen(false);
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
                {editingRecurring ? 'Update' : 'Create'}
              </IonButton>
            </div>
          </form>
        </IonContent>
      </IonModal>
    </div>
  );
};
