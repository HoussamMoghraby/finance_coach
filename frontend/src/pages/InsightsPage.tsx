/**
 * Insights page - AI-generated financial summaries
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonBadge,
  IonText,
  IonSpinner,
} from '@ionic/react';
import { insightsAPI, Insight, InsightGenerateRequest } from '@/services/insights';
import { formatDateForInput, formatUTCDate, formatUTCDateTime } from '@/utils/dateUtils';

export const InsightsPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const queryClient = useQueryClient();

  // Fetch insights
  const { data: insights, isLoading, error } = useQuery<Insight[]>({
    queryKey: ['insights'],
    queryFn: () => insightsAPI.getInsights(20),
  });

  // Generate insight mutation
  const generateMutation = useMutation({
    mutationFn: (request: InsightGenerateRequest) =>
      insightsAPI.generateInsight(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      setIsGenerating(false);
    },
    onError: (error: any) => {
      console.error('Failed to generate insight:', error);
      alert(error.response?.data?.detail || 'Failed to generate insight');
      setIsGenerating(false);
    },
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    const today = formatDateForInput();

    const request: InsightGenerateRequest = {
      type: selectedType,
      end_date: today,
    };

    // For weekly, set start date to 7 days ago
    if (selectedType === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      request.start_date = formatDateForInput(weekAgo);
    }
    // For monthly, set start date to first day of current month
    else if (selectedType === 'monthly') {
      const firstDay = new Date();
      firstDay.setDate(1);
      request.start_date = formatDateForInput(firstDay);
    }

    generateMutation.mutate(request);
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="text-center py-12">
            <IonSpinner name="crescent" />
            <IonText color="medium">
              <p className="mt-2">Loading insights...</p>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <IonCard color="danger">
            <IonCardContent className="text-center">
              <IonText color="light">
                <p>Error loading insights</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="ion-padding">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">AI Insights</h1>
            <IonText color="medium">
              <p className="text-sm">AI-generated financial summaries and analysis</p>
            </IonText>
          </div>
          <div className="ml-4">
            <IonSelect
              value={selectedType}
              onIonChange={(e) => setSelectedType(e.detail.value as any)}
              interface="popover"
            >
              <IonSelectOption value="daily">Daily Summary</IonSelectOption>
              <IonSelectOption value="weekly">Weekly Summary</IonSelectOption>
              <IonSelectOption value="monthly">Monthly Summary</IonSelectOption>
            </IonSelect>
          </div>
        </div>

        {/* Info Banner */}
        <IonCard color="primary">
          <IonCardContent>
            <div className="flex items-start">
              <div className="text-2xl mr-3">ℹ️</div>
              <div>
                <IonText color="light">
                  <h3 className="font-semibold mb-1">About AI Insights</h3>
                  <p className="text-sm opacity-90">
                    AI insights analyze your real financial data to provide summaries and
                    observations. All numbers are calculated from your actual transactions—the
                    AI explains the patterns, it doesn't invent data.
                  </p>
                </IonText>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Generate Button */}
        <div className="flex justify-center py-2">
          <IonButton
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <IonSpinner name="crescent" className="mr-2" style={{ width: '16px', height: '16px' }} />
                Generating...
              </>
            ) : (
              <>🤖 Generate Insight</>
            )}
          </IonButton>
        </div>

        {/* Insights List */}
        {insights && insights.length > 0 ? (
          <div className="space-y-4 mt-4">
            {insights.map((insight) => (
              <IonCard key={insight.id}>
                <IonCardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <IonBadge
                      color={
                        insight.type === 'daily'
                          ? 'success'
                          : insight.type === 'weekly'
                          ? 'primary'
                          : 'secondary'
                      }
                    >
                      {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                    </IonBadge>
                    <IonText color="medium">
                      <span className="text-sm">
                        {formatUTCDateTime(insight.created_at)}
                      </span>
                    </IonText>
                  </div>
                  <IonCardTitle>{insight.title}</IonCardTitle>
                  <IonText color="medium">
                    <p className="text-sm">
                      {formatUTCDate(insight.period_start)} -{' '}
                      {formatUTCDate(insight.period_end)}
                    </p>
                  </IonText>
                </IonCardHeader>

                <IonCardContent>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {insight.summary}
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        ) : (
          <IonCard className="mt-4">
            <IonCardContent className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">
                No Insights Yet
              </h3>
              <IonText color="medium">
                <p className="mb-6">
                  Generate your first AI insight by clicking the button above
                </p>
              </IonText>
              <IonButton
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                🤖 Generate First Insight
              </IonButton>
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonPage>
  );
};
