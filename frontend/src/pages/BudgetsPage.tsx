/**
 * Budgets page - Comprehensive budget management with CRUD operations
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
  IonGrid,
  IonRow,
  IonCol,
  IonProgressBar,
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetsAPI, BudgetCreate, BudgetUpdate, BudgetStatus } from '@/services/budgets';
import { categoriesAPI, Category } from '@/services/categories';
import { formatDateForInput } from '@/utils/dateUtils';

export const BudgetsPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetStatus | null>(null);
  const [formData, setFormData] = useState<BudgetCreate>({
    category_id: undefined,
    amount: 0,
    period_type: 'monthly',
    start_date: formatDateForInput(),
    end_date: formatDateForInput(new Date(new Date().setMonth(new Date().getMonth() + 1))),
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
      start_date: formatDateForInput(),
      end_date: formatDateForInput(new Date(new Date().setMonth(new Date().getMonth() + 1))),
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
            <p>Error loading budgets. Please try again.</p>
          </IonText>
        </IonCardContent>
      </IonCard>
    );
  }

  const alertLevel = getAlertLevel(overview?.percentage_used || 0);
  const categoryBudgets = overview?.category_budgets || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <IonText color="medium">
          <p className="text-sm">Manage your spending limits</p>
        </IonText>
      </div>

      {/* Overall Budget Summary */}
      {overview && overview.total_budget > 0 && (
        <IonCard color="primary">
          <IonCardContent>
            <div className="flex items-start justify-between mb-4">
              <IonText color="light">
                <div>
                  <h2 className="text-2xl font-bold">
                    ${overview.total_spent.toFixed(2)} / ${overview.total_budget.toFixed(2)}
                  </h2>
                  <p className="text-sm opacity-90 mt-1">Total spending across all budgets</p>
                </div>
              </IonText>
              <div className="flex items-center gap-2">
                {alertLevel === 'over' && (
                  <IonBadge color="danger">⚠️ Over Budget</IonBadge>
                )}
                {alertLevel === 'critical' && (
                  <IonBadge color="warning">⚠️ {overview.percentage_used.toFixed(0)}% Used</IonBadge>
                )}
                {alertLevel === 'warning' && (
                  <IonBadge color="warning">⚠️ {overview.percentage_used.toFixed(0)}% Used</IonBadge>
                )}
              </div>
            </div>

            <IonProgressBar
              value={Math.min(overview.percentage_used / 100, 1)}
              color={
                alertLevel === 'over'
                  ? 'danger'
                  : alertLevel === 'critical' || alertLevel === 'warning'
                  ? 'warning'
                  : 'light'
              }
            />
            <IonText color="light">
              <div className="flex justify-between text-sm mt-2 opacity-90">
                <span>Remaining: ${overview.total_remaining.toFixed(2)}</span>
                <span>{overview.percentage_used.toFixed(1)}% used</span>
              </div>
            </IonText>
          </IonCardContent>
        </IonCard>
      )}

      {/* Create Budget Button */}
      <div className="flex justify-center py-2">
        <IonButton onClick={handleOpenCreate}>+ Create Budget</IonButton>
      </div>

      {/* Individual Budgets */}
      <IonGrid className="ion-no-padding">
        <IonRow>
          {categoryBudgets.map((budgetStatus: BudgetStatus) => {
            const { budget, spent, remaining, percentage_used, is_over_budget } = budgetStatus;
            const alertLevel = getAlertLevel(percentage_used);
            const cardColor =
              undefined;

            return (
              <IonCol key={budget.id} size="12" sizeMd="6" sizeLg="4">
                <IonCard color={cardColor}>
                  <IonCardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <IonCardTitle className="text-base">
                          {getCategoryName(budget.category_id)}
                        </IonCardTitle>
                        <IonText color="medium">
                          <p className="text-xs mt-1">
                            📅 {new Date(budget.start_date).toLocaleDateString()} -{' '}
                            {new Date(budget.end_date).toLocaleDateString()}
                          </p>
                        </IonText>
                      </div>
                      <div className="flex items-center gap-2">
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => handleOpenEdit(budgetStatus)}
                        >
                          ✏️
                        </IonButton>
                        <IonButton
                          fill="clear"
                          size="small"
                          color="danger"
                          onClick={() => handleDelete(budget.id)}
                        >
                          🗑️
                        </IonButton>
                      </div>
                    </div>
                  </IonCardHeader>
                  <IonCardContent>
                    {/* Alert Badge */}
                    {alertLevel !== 'normal' && (
                      <IonBadge
                        color={alertLevel === 'over' ? 'danger' : 'warning'}
                        className="mb-3"
                      >
                        ⚠️{' '}
                        {is_over_budget
                          ? `Over by $${Math.abs(remaining).toFixed(2)}`
                          : `${(100 - percentage_used).toFixed(0)}% remaining`}
                      </IonBadge>
                    )}

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <IonText color="medium">
                          <span className="text-sm">Spent</span>
                        </IonText>
                        <span className="font-semibold">${spent.toFixed(2)}</span>
                      </div>

                      <IonProgressBar
                        value={Math.min(percentage_used / 100, 1)}
                        color={
                          is_over_budget
                            ? 'danger'
                            : alertLevel === 'critical' || alertLevel === 'warning'
                            ? 'warning'
                            : 'primary'
                        }
                      />

                      <div className="flex justify-between items-center">
                        <IonText color="medium">
                          <span className="text-sm">Budget</span>
                        </IonText>
                        <span className="font-semibold">${budget.amount.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t">
                        <IonText color="medium">
                          <span className="text-sm">Remaining</span>
                        </IonText>
                        <IonText color={is_over_budget ? 'danger' : 'success'}>
                          <span className="font-bold">${remaining.toFixed(2)}</span>
                        </IonText>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            );
          })}
        </IonRow>
      </IonGrid>

      {/* Empty State */}
      {categoryBudgets.length === 0 && (
        <div className="text-center py-12">
          <IonCard>
            <IonCardContent>
              <span className="text-6xl">💰</span>
              <h3 className="mt-4 text-lg font-medium">No budgets yet</h3>
              <IonText color="medium">
                <p className="mt-2">
                  Create your first budget to start tracking your spending limits.
                </p>
              </IonText>
              <IonButton onClick={handleOpenCreate} className="mt-4">
                Create Budget
              </IonButton>
            </IonCardContent>
          </IonCard>
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
            <IonTitle>{editingBudget ? 'Edit Budget' : 'Create Budget'}</IonTitle>
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
                <IonSelectOption value="">Overall Budget (All Expenses)</IonSelectOption>
                {categories
                  .filter((cat: Category) => cat.type === 'expense')
                  .map((category: Category) => (
                    <IonSelectOption key={category.id} value={category.id}>
                      {category.name}
                    </IonSelectOption>
                  ))}
              </IonSelect>
            </IonItem>

            <IonItem className="mb-4">
              <IonLabel position="stacked">Budget Amount *</IonLabel>
              <IonInput
                type="number"
                value={formData.amount}
                onIonInput={(e) =>
                  setFormData({ ...formData, amount: parseFloat((e.target as HTMLIonInputElement).value as string) })
                }
                step="0.01"
                min="0"
                required
              />
            </IonItem>

            <IonItem className="mb-4">
              <IonLabel position="stacked">Period Type</IonLabel>
              <IonSelect
                value={formData.period_type}
                onIonChange={(e) => setFormData({ ...formData, period_type: e.detail.value })}
              >
                <IonSelectOption value="monthly">Monthly</IonSelectOption>
                <IonSelectOption value="yearly">Yearly</IonSelectOption>
                <IonSelectOption value="custom">Custom</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonGrid className="ion-no-padding">
              <IonRow>
                <IonCol size="6">
                  <IonItem className="mb-4">
                    <IonLabel position="stacked">Start Date *</IonLabel>
                    <IonInput
                      type="date"
                      value={formData.start_date}
                      onIonInput={(e) =>
                        setFormData({ ...formData, start_date: (e.target as HTMLIonInputElement).value as string })
                      }
                      required
                    />
                  </IonItem>
                </IonCol>
                <IonCol size="6">
                  <IonItem className="mb-6">
                    <IonLabel position="stacked">End Date *</IonLabel>
                    <IonInput
                      type="date"
                      value={formData.end_date}
                      onIonInput={(e) =>
                        setFormData({ ...formData, end_date: (e.target as HTMLIonInputElement).value as string })
                      }
                      required
                    />
                  </IonItem>
                </IonCol>
              </IonRow>
            </IonGrid>

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
                {editingBudget ? 'Update' : 'Create'}
              </IonButton>
            </div>
          </form>
        </IonContent>
      </IonModal>
    </div>
  );
};
