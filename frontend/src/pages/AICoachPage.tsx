/**
 * AI Coach page - Chat with AI about your finances
 */
import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { insightsAPI } from '@/services/insights';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type CoachMode = 'chat' | 'budget';

export const AICoachPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<CoachMode>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: (question: string) => insightsAPI.askQuestion(question),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.answer,
          timestamp: new Date(),
        },
      ]);
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to get response from AI');
    },
  });

  // Budget coaching mutation
  const coachingMutation = useMutation({
    mutationFn: (question: string) => insightsAPI.getBudgetCoaching(question),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.answer,
          timestamp: new Date(),
        },
      ]);
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to get coaching response');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Get AI response
    if (mode === 'chat') {
      chatMutation.mutate(input);
    } else {
      coachingMutation.mutate(input);
    }
  };

  const isLoading = chatMutation.isPending || coachingMutation.isPending;

  const suggestedQuestions = mode === 'chat' ? [
    "What were my top expenses last month?",
    "How much did I spend on dining out?",
    "What's my savings rate this month?",
    "Show me my spending trends",
  ] : [
    "How can I improve my budget?",
    "Where should I cut spending?",
    "Am I on track with my budget goals?",
    "Tips for saving more money",
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Finance Coach</h1>
          <p className="text-gray-600 mt-1">
            Ask questions about your finances or get personalized budget coaching
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMode('chat')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              mode === 'chat'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setMode('budget')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              mode === 'budget'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🎯 Budget Coach
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-yellow-600 text-xl mr-3">⚠️</div>
          <div className="text-sm">
            <p className="font-semibold text-yellow-900">Helpful AI Assistant</p>
            <p className="text-yellow-700 mt-1">
              This AI coach analyzes your actual financial data. It does not provide
              investment, tax, or legal advice. All insights are educational and based
              on your transaction history.
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 card overflow-y-auto space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="text-6xl mb-4">
              {mode === 'chat' ? '💬' : '🎯'}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {mode === 'chat' ? 'Start a Conversation' : 'Get Budget Coaching'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
              {mode === 'chat'
                ? 'Ask me anything about your finances, spending patterns, or financial data'
                : 'Get personalized advice on managing your budget and improving your financial health'}
            </p>

            <div className="w-full max-w-lg space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-3">Try asking:</p>
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">
                      {message.role === 'user' ? '👤' : '🤖'}
                    </span>
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                      <p
                        className={`text-xs mt-2 ${
                          message.role === 'user'
                            ? 'text-primary-200'
                            : 'text-gray-500'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="card">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'chat'
                ? 'Ask about your finances...'
                : 'Ask for budget advice...'
            }
            className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="btn btn-primary px-6"
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};
