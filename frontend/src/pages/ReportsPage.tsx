/**
 * Reports page - Detailed financial analytics and insights
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonProgressBar,
  IonBadge,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
} from '@ionic/react';
import { reportsAPI, CategoryBreakdown, RecurringTransactionCandidate } from '@/services/reports';

type ReportView = 'overview' | 'categories' | 'trends' | 'recurring';

export const ReportsPage = () => {
  const [period, setPeriod] = useState('current_month');
  const [activeView, setActiveView] = useState<ReportView>('overview');

  // Calculate date range
  const getDateRange = () => {
    const today = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    switch (period) {
      case 'current_month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'last_month':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        startDate = lastMonth.toISOString().split('T')[0];
        endDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'last_3_months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'last_6_months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'current_year':
        startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'last_year':
        startDate = new Date(today.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
        endDate = new Date(today.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
        break;
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch reports data
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['overview', startDate, endDate],
    queryFn: () => reportsAPI.getOverview(startDate, endDate),
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<CategoryBreakdown[]>({
    queryKey: ['category-breakdown', 'expense', startDate, endDate],
    queryFn: () => reportsAPI.getCategoryBreakdown('expense', startDate, endDate),
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['monthly-trends'],
    queryFn: () => reportsAPI.getMonthlyTrend(12),
  });

  const { data: recurring, isLoading: recurringLoading } = useQuery<RecurringTransactionCandidate[]>({
    queryKey: ['recurring-patterns'],
    queryFn: () => reportsAPI.detectRecurring(),
  });

  const isLoading = overviewLoading || categoriesLoading || trendsLoading || recurringLoading;

  const savingsRate = overview?.total_income
    ? ((overview.net_income / overview.total_income) * 100).toFixed(1)
    : '0.0';

  return (
    <IonPage>
      <IonContent className="ion-padding">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Financial Reports</h1>
            <IonText color="medium">
              <p className="text-sm">
                Period: {new Date(overview?.period_start || '').toLocaleDateString()} -{' '}
                {new Date(overview?.period_end || '').toLocaleDateString()}
              </p>
            </IonText>
          </div>
          <div className="ml-4">
            <IonSelect
              value={period}
              onIonChange={(e) => setPeriod(e.detail.value)}
              interface="popover"
            >
              <IonSelectOption value="current_month">Current Month</IonSelectOption>
              <IonSelectOption value="last_month">Last Month</IonSelectOption>
              <IonSelectOption value="last_3_months">Last 3 Months</IonSelectOption>
              <IonSelectOption value="last_6_months">Last 6 Months</IonSelectOption>
              <IonSelectOption value="current_year">Current Year</IonSelectOption>
              <IonSelectOption value="last_year">Last Year</IonSelectOption>
            </IonSelect>
          </div>
        </div>

        {/* View Tabs */}
        <IonSegment value={activeView} onIonChange={(e) => setActiveView(e.detail.value as ReportView)} className="mb-6">
          <IonSegmentButton value="overview">
            <IonLabel>Overview</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="categories">
            <IonLabel>Categories</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="trends">
            <IonLabel>Trends</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="recurring">
            <IonLabel>Recurring</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {isLoading ? (
          <div className="text-center py-12">
            <IonSpinner name="crescent" />
            <IonText color="medium">
              <p className="mt-2">Loading reports...</p>
            </IonText>
          </div>
        ) : (
        <>
          {/* Overview View */}
          {activeView === 'overview' && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <IonGrid className="ion-no-padding">
                <IonRow>
                  <IonCol size="12" sizeMd="6" sizeLg="3">
                    <IonCard color="success">
                      <IonCardContent>
                        <IonText color="light">
                          <h3 className="text-sm font-medium opacity-90">Total Income</h3>
                          <p className="text-3xl font-bold mt-2">
                            ${overview?.total_income.toFixed(2)}
                          </p>
                        </IonText>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>

                  <IonCol size="12" sizeMd="6" sizeLg="3">
                    <IonCard color="danger">
                      <IonCardContent>
                        <IonText color="light">
                          <h3 className="text-sm font-medium opacity-90">Total Expenses</h3>
                          <p className="text-3xl font-bold mt-2">
                            ${overview?.total_expenses.toFixed(2)}
                          </p>
                        </IonText>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>

                  <IonCol size="12" sizeMd="6" sizeLg="3">
                    <IonCard color={(overview?.net_income || 0) >= 0 ? 'primary' : 'warning'}>
                      <IonCardContent>
                        <IonText color="light">
                          <h3 className="text-sm font-medium opacity-90">Net Income</h3>
                          <p className="text-3xl font-bold mt-2">
                            ${overview?.net_income.toFixed(2)}
                          </p>
                        </IonText>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>

                  <IonCol size="12" sizeMd="6" sizeLg="3">
                    <IonCard color="secondary">
                      <IonCardContent>
                        <IonText color="light">
                          <h3 className="text-sm font-medium opacity-90">Savings Rate</h3>
                          <p className="text-3xl font-bold mt-2">{savingsRate}%</p>
                        </IonText>
                        <IonProgressBar
                          value={Math.max(0, Math.min(1, parseFloat(savingsRate) / 100))}
                          className="mt-3"
                          color="light"
                        />
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                </IonRow>
              </IonGrid>

              {/* Quick Stats */}
              <IonGrid className="ion-no-padding">
                <IonRow>
                  <IonCol size="12" sizeMd="4">
                    <IonCard>
                      <IonCardContent>
                        <IonText color="medium">
                          <h3 className="text-sm font-medium">Total Balance</h3>
                        </IonText>
                        <p className="text-2xl font-bold mt-2">
                          ${overview?.total_balance.toFixed(2)}
                        </p>
                        <IonText color="medium">
                          <p className="text-xs mt-1">
                            Across {overview?.total_accounts} accounts
                          </p>
                        </IonText>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>

                  <IonCol size="12" sizeMd="4">
                    <IonCard>
                      <IonCardContent>
                        <IonText color="medium">
                          <h3 className="text-sm font-medium">Top Category</h3>
                        </IonText>
                        {categories && categories.length > 0 ? (
                          <>
                            <p className="text-xl font-bold mt-2">
                              {categories[0].category_name}
                            </p>
                            <IonText color="medium">
                              <p className="text-sm">
                                ${categories[0].amount.toFixed(2)} ({categories[0].percentage.toFixed(1)}%)
                              </p>
                            </IonText>
                          </>
                        ) : (
                          <IonText color="medium">
                            <p className="text-sm mt-2">No data</p>
                          </IonText>
                        )}
                      </IonCardContent>
                    </IonCard>
                  </IonCol>

                  <IonCol size="12" sizeMd="4">
                    <IonCard>
                      <IonCardContent>
                        <IonText color="medium">
                          <h3 className="text-sm font-medium">Savings Rate</h3>
                        </IonText>
                        <p className="text-xl font-bold mt-2">{savingsRate}%</p>
                        <IonText color="medium">
                          <p className="text-sm">Of income saved</p>
                        </IonText>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </div>
          )}

          {/* Categories View */}
          {activeView === 'categories' && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Spending by Category</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {categories && categories.length > 0 ? (
                  <div className="space-y-4">
                    {categories.map((category) => (
                      <div key={category.category_name}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold">{category.category_name}</span>
                          <IonBadge color="primary">{category.percentage.toFixed(1)}%</IonBadge>
                        </div>
                        <IonProgressBar
                          value={Math.min(category.percentage / 100, 1)}
                          className="mb-2"
                        />
                        <div className="flex justify-between">
                          <IonText color="medium">
                            <span className="text-sm">${category.amount.toFixed(2)}</span>
                          </IonText>
                          <IonText color="medium">
                            <span className="text-sm">{category.transaction_count} transactions</span>
                          </IonText>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-3">📊</div>
                    <IonText color="medium">
                      <p>No category data available for this period</p>
                    </IonText>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          )}

          {/* Trends View */}
          {activeView === 'trends' && (
            <div className="space-y-4">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Monthly Trends</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {trends && trends.length > 0 ? (
                    <div className="space-y-4">
                      {trends.map((trend) => (
                        <IonCard key={trend.month} className="mb-3">
                          <IonCardContent>
                            <div className="font-bold text-lg mb-4">
                              {new Date(trend.month + '-01').toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                              })}
                            </div>
                            <IonGrid className="ion-no-padding">
                              <IonRow>
                                <IonCol size="6" sizeMd="3">
                                  <IonText color="medium">
                                    <div className="text-sm mb-1">Income</div>
                                  </IonText>
                                  <IonText color="success">
                                    <div className="text-2xl font-bold">
                                      ${trend.income.toFixed(2)}
                                    </div>
                                  </IonText>
                                </IonCol>
                                <IonCol size="6" sizeMd="3">
                                  <IonText color="medium">
                                    <div className="text-sm mb-1">Expenses</div>
                                  </IonText>
                                  <IonText color="danger">
                                    <div className="text-2xl font-bold">
                                      ${trend.expenses.toFixed(2)}
                                    </div>
                                  </IonText>
                                </IonCol>
                                <IonCol size="6" sizeMd="3">
                                  <IonText color="medium">
                                    <div className="text-sm mb-1">Net</div>
                                  </IonText>
                                  <IonText color={trend.net >= 0 ? 'primary' : 'warning'}>
                                    <div className="text-2xl font-bold">
                                      ${trend.net.toFixed(2)}
                                    </div>
                                    <div className="text-xs mt-1">
                                      {trend.net >= 0 ? 'Surplus' : 'Deficit'}
                                    </div>
                                  </IonText>
                                </IonCol>
                                <IonCol size="6" sizeMd="3">
                                  <IonText color="medium">
                                    <div className="text-sm mb-1">Savings Rate</div>
                                  </IonText>
                                  <IonText color="secondary">
                                    <div className="text-2xl font-bold">
                                      {trend.income > 0 ? ((trend.net / trend.income) * 100).toFixed(1) : '0.0'}%
                                    </div>
                                  </IonText>
                                  <IonProgressBar
                                    value={Math.max(0, Math.min(1, trend.income > 0 ? trend.net / trend.income : 0))}
                                    className="mt-2"
                                    color="secondary"
                                  />
                                </IonCol>
                              </IonRow>
                            </IonGrid>
                          </IonCardContent>
                        </IonCard>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-5xl mb-3">📈</div>
                      <IonText color="medium">
                        <p>No trend data available for this period</p>
                      </IonText>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            </div>
          )}

          {/* Recurring View */}
          {activeView === 'recurring' && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Detected Recurring Patterns</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonText color="medium">
                  <p className="text-sm mb-6">
                    Transactions that appear to follow a recurring pattern based on category and amount.
                  </p>
                </IonText>
                {recurring && recurring.length > 0 ? (
                  <div className="space-y-3">
                    {recurring.map((pattern, index) => (
                      <IonCard key={index}>
                        <IonCardContent>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="font-semibold text-lg">
                                {pattern.category_name || 'Uncategorized'}
                              </div>
                              <IonText color="medium">
                                <div className="text-sm">
                                  ~${pattern.average_amount.toFixed(2)} • Every {pattern.frequency_days} days
                                </div>
                              </IonText>
                            </div>
                            <div className="flex gap-2">
                              <IonBadge color="primary">
                                {(pattern.confidence_score * 100).toFixed(0)}% Confidence
                              </IonBadge>
                              <IonBadge color="medium">
                                {pattern.occurrences} occurrences
                              </IonBadge>
                            </div>
                          </div>
                          <IonText color="medium">
                            <div className="text-sm">
                              <span className="font-medium">Next Expected:</span>{' '}
                              {new Date(pattern.next_expected_date).toLocaleDateString()}
                            </div>
                          </IonText>
                        </IonCardContent>
                      </IonCard>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-3">🔄</div>
                    <IonText color="medium">
                      <p>No recurring patterns detected yet</p>
                      <p className="text-sm mt-2">Need at least 3 similar transactions to detect patterns</p>
                    </IonText>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          )}
        </>
        )}
      </IonContent>
    </IonPage>
  );
};
