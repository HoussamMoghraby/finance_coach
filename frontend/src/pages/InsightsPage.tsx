/**
 * AI Insights page
 */
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export const InsightsPage = () => {
  const { data: insights, isLoading, error } = useQuery({
    queryKey: ['insights'],
    queryFn: async () => {
      const response = await api.get('/insights');
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading AI insights...</div>;
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
          <p className="text-gray-600 mt-1">AI-powered financial analysis and recommendations</p>
        </div>
        <button className="btn btn-primary">
          Generate New Insights
        </button>
      </div>

      <div className="space-y-4">
        {insights?.map((insight: any) => (
          <div key={insight.id} className="card">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${
                insight.type === 'recommendation' ? 'bg-blue-100' :
                insight.type === 'warning' ? 'bg-yellow-100' :
                insight.type === 'success' ? 'bg-green-100' :
                'bg-gray-100'
              }`}>
                <span className="text-2xl">
                  {insight.type === 'recommendation' ? '💡' :
                   insight.type === 'warning' ? '⚠️' :
                   insight.type === 'success' ? '✅' :
                   '📊'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold">{insight.title}</h3>
                  <span className="text-xs text-gray-500">
                    {new Date(insight.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600 mt-2">{insight.content}</p>
                {insight.category && (
                  <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {insight.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {(!insights || insights.length === 0) && (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No insights yet</h3>
          <p className="text-gray-600 mb-6">
            Generate AI-powered insights to get personalized recommendations and financial analysis
          </p>
          <button className="btn btn-primary">
            Generate First Insight
          </button>
        </div>
      )}
    </div>
  );
};
