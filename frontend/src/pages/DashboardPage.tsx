/**
 * Dashboard page - Comprehensive financial overview
 */
import { useState } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSelect,
  IonSelectOption,
  IonText,
  IonSpinner,
  IonProgressBar,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI, DashboardData } from '@/services/reports';
import { budgetsAPI } from '@/services/budgets';
import { getDateRange } from '@/utils/dateUtils';

export const DashboardPage = () => {
  const [dateRange, setDateRange] = useState('current_month');

  // Get date range using centralized utility
  const { startDate, endDate } = getDateRange(dateRange);

  // Fetch dashboard data
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard', startDate, endDate],
    queryFn: () => reportsAPI.getDashboard(startDate, endDate),
  });

  // Fetch budget status
  const { data: budgetOverview } = useQuery({
    queryKey: ['budgets', 'overview'],
    queryFn: () => budgetsAPI.getStatus(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IonSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <IonText color="danger">
          <p>Error loading dashboard data</p>
        </IonText>
      </div>
    );
  }

  const savingsRate = data?.overview.total_income
    ? ((data.overview.net_income / data.overview.total_income) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <IonSelect
          value={dateRange}
          onIonChange={(e) => setDateRange(e.detail.value)}
          interface="popover"
        >
          <IonSelectOption value="current_month">Current Month</IonSelectOption>
          <IonSelectOption value="last_month">Last Month</IonSelectOption>
          <IonSelectOption value="last_3_months">Last 3 Months</IonSelectOption>
          <IonSelectOption value="current_year">Current Year</IonSelectOption>
        </IonSelect>
      </div>

      {/* Period Display */}
      <IonText color="medium">
        <p className="text-sm">
          Period: {new Date(data?.overview.period_start || '').toLocaleDateString()} -{' '}
          {new Date(data?.overview.period_end || '').toLocaleDateString()}
        </p>
      </IonText>

      {/* Overview Cards */}
      <IonGrid className="ion-no-padding">
        <IonRow>
          <IonCol size="12" sizeMd="6" sizeLg="3">
            <IonCard className="ion-no-margin" color="success" style={{ '--background': 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              <IonCardContent>
                <IonText color="light">
                  <p className="text-xs font-medium opacity-90">Total Income</p>
                  <h2 className="text-2xl font-bold mt-1">
                    ${data?.overview.total_income.toFixed(2)}
                  </h2>
                  <p className="text-xs mt-1 opacity-80">Revenue for the period</p>
                </IonText>
              </IonCardContent>
            </IonCard>
          </IonCol>

          <IonCol size="12" sizeMd="6" sizeLg="3">
            <IonCard className="ion-no-margin" color="danger" style={{ '--background': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
              <IonCardContent>
                <IonText color="light">
                  <p className="text-xs font-medium opacity-90">Total Expenses</p>
                  <h2 className="text-2xl font-bold mt-1">
                    ${data?.overview.total_expenses.toFixed(2)}
                  </h2>
                  <p className="text-xs mt-1 opacity-80">Spending for the period</p>
                </IonText>
              </IonCardContent>
            </IonCard>
          </IonCol>

          <IonCol size="12" sizeMd="6" sizeLg="3">
            <IonCard
              className="ion-no-margin"
              color={(data?.overview.net_income || 0) >= 0 ? 'primary' : 'warning'}
              style={{
                '--background': (data?.overview.net_income || 0) >= 0
                  ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              }}
            >
              <IonCardContent>
                <IonText color="light">
                  <p className="text-xs font-medium opacity-90">Net Income</p>
                  <h2 className="text-2xl font-bold mt-1">
                    ${data?.overview.net_income.toFixed(2)}
                  </h2>
                  <p className="text-xs mt-1 opacity-80">
                    {(data?.overview.net_income || 0) >= 0 ? 'Surplus' : 'Deficit'}
                  </p>
                </IonText>
              </IonCardContent>
            </IonCard>
          </IonCol>

          <IonCol size="12" sizeMd="6" sizeLg="3">
            <IonCard className="ion-no-margin" color="secondary" style={{ '--background': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
              <IonCardContent>
                <IonText color="light">
                  <p className="text-xs font-medium opacity-90">Total Balance</p>
                  <h2 className="text-2xl font-bold mt-1">
                    ${data?.overview.total_balance.toFixed(2)}
                  </h2>
                  <p className="text-xs mt-1 opacity-80">
                    Across {data?.overview.total_accounts} accounts
                  </p>
                </IonText>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonGrid>

      {/* Secondary Metrics */}
      <IonGrid className="ion-no-padding">
        <IonRow>
          <IonCol size="12" sizeMd="4">
            <IonCard>
              <IonCardContent>
                <IonText>
                  <p className="text-sm font-medium">Savings Rate</p>
                  <h3 className="text-xl font-bold mt-1">{savingsRate}%</h3>
                </IonText>
                <IonProgressBar
                  value={Math.max(0, Math.min(1, parseFloat(savingsRate) / 100))}
                  color="primary"
                  className="mt-2"
                />
              </IonCardContent>
            </IonCard>
          </IonCol>

          <IonCol size="12" sizeMd="4">
            <IonCard>
              <IonCardContent>
                <IonText>
                  <p className="text-sm font-medium">Budget Status</p>
                </IonText>
                {budgetOverview && budgetOverview.total_budget > 0 ? (
                  <>
                    <h3 className="text-xl font-bold mt-1">
                      {budgetOverview.percentage_used.toFixed(0)}%
                    </h3>
                    <IonProgressBar
                      value={Math.min(1, budgetOverview.percentage_used / 100)}
                      color={
                        budgetOverview.percentage_used >= 100
                          ? 'danger'
                          : budgetOverview.percentage_used >= 90
                          ? 'warning'
                          : 'success'
                      }
                      className="mt-2"
                    />
                    <IonText color="medium">
                      <p className="text-xs mt-1">
                        ${budgetOverview.total_remaining.toFixed(2)} remaining
                      </p>
                    </IonText>
                  </>
                ) : (
                  <IonText color="medium">
                    <p className="text-sm mt-2">No budgets set</p>
                  </IonText>
                )}
              </IonCardContent>
            </IonCard>
          </IonCol>

          <IonCol size="12" sizeMd="4">
            <IonCard>
              <IonCardContent>
                <IonText>
                  <p className="text-sm font-medium">Average Daily Spending</p>
                  <h3 className="text-xl font-bold mt-1">
                    ${data?.overview.total_expenses && data?.overview.period_end && data?.overview.period_start ? (
                      data.overview.total_expenses /
                      Math.max(
                        1,
                        Math.ceil(
                          (new Date(data.overview.period_end).getTime() -
                            new Date(data.overview.period_start).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )
                    ).toFixed(2) : '0.00'}
                  </h3>
                </IonText>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonGrid>

      {/* Category Breakdown */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Spending by Category</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {data?.category_breakdown && data.category_breakdown.length > 0 ? (
            <div className="space-y-4">
              {data.category_breakdown.slice(0, 8).map((category) => (
                <div key={category.category_name}>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="font-medium">{category.category_name}</span>
                    <IonText color="medium">
                      <span className="text-sm">
                        ${category.amount.toFixed(2)} ({category.percentage.toFixed(1)}%)
                      </span>
                    </IonText>
                  </div>
                  <IonProgressBar
                    value={Math.min(1, category.percentage / 100)}
                    color="primary"
                  />
                  <IonText color="medium">
                    <p className="text-xs mt-1">
                      {category.transaction_count} transactions
                    </p>
                  </IonText>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📊</div>
              <IonText color="medium">
                <p>No spending data yet</p>
              </IonText>
            </div>
          )}
        </IonCardContent>
      </IonCard>

      {/* Monthly Trends */}
      {data?.monthly_trends && data.monthly_trends.length > 0 && (
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Monthly Trend</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="space-y-3">
              {data.monthly_trends.map((trend) => (
                <div key={trend.month} className="border-l-4 border-primary pl-3 py-2">
                  <div className="font-semibold mb-2">
                    {new Date(trend.month + '-01').toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </div>
                  <IonGrid className="ion-no-padding">
                    <IonRow>
                      <IonCol size="4">
                        <IonText color="medium">
                          <p className="text-xs">Income</p>
                        </IonText>
                        <IonText color="success">
                          <p className="font-bold text-sm">${trend.income.toFixed(2)}</p>
                        </IonText>
                      </IonCol>
                      <IonCol size="4">
                        <IonText color="medium">
                          <p className="text-xs">Expenses</p>
                        </IonText>
                        <IonText color="danger">
                          <p className="font-bold text-sm">${trend.expenses.toFixed(2)}</p>
                        </IonText>
                      </IonCol>
                      <IonCol size="4">
                        <IonText color="medium">
                          <p className="text-xs">Net</p>
                        </IonText>
                        <IonText color={trend.net >= 0 ? 'primary' : 'warning'}>
                          <p className="font-bold text-sm">${trend.net.toFixed(2)}</p>
                        </IonText>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </div>
              ))}
            </div>
          </IonCardContent>
        </IonCard>
      )}
    </div>
  );
};
