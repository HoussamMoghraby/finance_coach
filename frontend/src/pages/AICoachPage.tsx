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
} from '@ionic/react';
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
                <div className="text-6xl mb-4">
                  {mode === 'chat' ? '💬' : '🎯'}
                </div>
                <h3 className="text-xl font-semibold mb-2">
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
                    <IonButton
                      key={index}
                      onClick={() => setInput(question)}
                      expand="block"
                      fill="outline"
                      className="text-left"
                    >
                      <IonLabel className="ion-text-wrap text-sm">{question}</IonLabel>
                    </IonButton>
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
                          ? 'bg-blue-500 text-white'
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
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom)',
            zIndex: 1000
          }}
        >
          <div className="px-4 py-3">
            {/* Mode Switcher */}
            <IonSegment
              value={mode}
              onIonChange={(e) => setMode(e.detail.value as CoachMode)}
              className="mb-3"
            >
              <IonSegmentButton value="chat">
                <IonLabel>💬 Chat</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="budget">
                <IonLabel>🎯 Budget Coach</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
              <div className="flex-1 bg-gray-100 rounded-full px-4 py-2">
                <IonInput
                  type="text"
                  value={input}
                  onIonInput={(e) => setInput((e.target as HTMLIonInputElement).value as string)}
                  placeholder={
                    mode === 'chat'
                      ? 'Ask about your finances...'
                      : 'Ask for budget advice...'
                  }
                  disabled={isLoading}
                  className="text-sm"
                  style={{ '--padding-start': '0', '--padding-end': '0' }}
                />
              </div>
              <IonButton
                type="submit"
                disabled={isLoading || !input.trim()}
                shape="round"
                size="default"
              >
                {isLoading ? 'Thinking...' : 'Send'}
              </IonButton>
            </form>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};
