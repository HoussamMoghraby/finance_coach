/**
 * AI Coach page - Chat with AI about your finances
 */
import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  IonPage,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  IonIcon,
} from '@ionic/react';
import { sparklesOutline, sendOutline } from 'ionicons/icons';
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
    <IonPage>
      <IonContent className="ion-no-padding" style={{ '--padding-bottom': '0px' }}>
        {/* Messages Area - Full Screen */}
        <div className="h-full flex flex-col" style={{ paddingBottom: 'calc(180px + env(safe-area-inset-bottom))' }}>
          <div className="flex-1 overflow-auto px-4 pt-4 pb-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-24 h-24 flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-5xl">
                    {mode === 'chat' ? '💬' : '🎯'}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {mode === 'chat' ? 'Start a Conversation' : 'Get Budget Coaching'}
                </h3>
                <IonText color="medium">
                  <p className="mb-6">
                    {mode === 'chat'
                      ? 'Ask me anything about your finances, spending patterns, or financial data'
                      : 'Get personalized advice on managing your budget and improving your financial health'}
                  </p>
                </IonText>

                <div className="w-full max-w-md space-y-2">
                  <IonText color="medium">
                    <p className="text-sm font-medium mb-3">Try asking:</p>
                  </IonText>
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(question)}
                      className="w-full text-left px-4 py-3 rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all"
                    >
                      <span className="text-sm text-gray-700">{question}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                          : 'bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">
                          {message.role === 'user' ? '👤' : '🤖'}
                        </span>
                        <div className="flex-1">
                          <p className="whitespace-pre-wrap leading-relaxed text-sm">
                            {message.content}
                          </p>
                          <p className={`text-xs mt-2 opacity-70 ${
                            message.role === 'user' ? 'text-white' : 'text-gray-500'
                          }`}>
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
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🤖</span>
                        <IonSpinner name="dots" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer - Input Area and Mode Switcher */}
        <div
          className="fixed bottom-0 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-white via-white to-transparent"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
            paddingTop: '20px',
            zIndex: 1000
          }}
        >
          <div className="space-y-3" style={{ maxWidth: '600px', margin: '0 auto' }}>
            {/* Mode Switcher */}
            <IonSegment
              value={mode}
              onIonChange={(e) => setMode(e.detail.value as CoachMode)}
              className="bg-white rounded-full shadow-sm"
            >
              <IonSegmentButton value="chat">
                <IonLabel className="text-xs">💬 Chat</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="budget">
                <IonLabel className="text-xs">🎯 Budget Coach</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {/* Input Form */}
            <form onSubmit={handleSubmit}>
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full px-4 py-3 shadow-lg"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <IonIcon icon={sparklesOutline} className="text-white text-xl" />
                <div className="flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      mode === 'chat'
                        ? 'Ask about your finances...'
                        : 'Ask for budget advice...'
                    }
                    disabled={isLoading}
                    className="w-full bg-transparent text-white placeholder-white placeholder-opacity-70 outline-none text-sm font-medium"
                    style={{ border: 'none' }}
                  />
                </div>
                {input.trim() && (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-white bg-opacity-20 rounded-full p-2 hover:bg-opacity-30 transition-all"
                  >
                    <IonIcon icon={sendOutline} className="text-white text-lg" />
                  </button>
                )}
                {/* <div className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                  <IonText color="light">
                    <p className="text-xs font-semibold">✨ AI</p>
                  </IonText>
                </div> */}
              </div>
            </form>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};
