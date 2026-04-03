/**
 * Insights page - AI-generated financial summaries
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    return <div className="text-center py-12">Loading insights...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        Error loading insights
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
          <p className="text-gray-600 mt-2">
            AI-generated financial summaries and analysis
          </p>
        </div>

        <div className="flex gap-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="daily">Daily Summary</option>
            <option value="weekly">Weekly Summary</option>
            <option value="monthly">Monthly Summary</option>
          </select>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn btn-primary"
          >
            {isGenerating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating...
              </>
            ) : (
              <>🤖 Generate Insight</>
            )}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-blue-600 text-xl mr-3">ℹ️</div>
          <div>
            <h3 className="font-semibold text-blue-900">About AI Insights</h3>
            <p className="text-sm text-blue-700 mt-1">
              AI insights analyze your real financial data to provide summaries and
              observations. All numbers are calculated from your actual transactions—the
              AI explains the patterns, it doesn't invent data.
            </p>
          </div>
        </div>
      </div>

      {/* Insights List */}
      {insights && insights.length > 0 ? (
        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.id} className="card hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        insight.type === 'daily'
                          ? 'bg-green-100 text-green-700'
                          : insight.type === 'weekly'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatUTCDateTime(insight.created_at)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{insight.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatUTCDate(insight.period_start)} -{' '}
                    {formatUTCDate(insight.period_end)}
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="prose max-w-none">
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {insight.summary}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Insights Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Generate your first AI insight by clicking the button above
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn btn-primary"
          >
            🤖 Generate First Insight
          </button>
        </div>
      )}
    </div>
  );
};
