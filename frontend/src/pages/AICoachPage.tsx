/**
 * AI Coach page - Chat with AI about your finances
 */
import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
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
      <IonHeader>
        <IonToolbar>
          <IonTitle>Wentaro AI</IonTitle>
          <IonSegment
            value={mode}
            onIonChange={(e) => setMode(e.detail.value as CoachMode)}
            slot="end"
            className="mr-4"
          >
            <IonSegmentButton value="chat">
              <IonLabel>💬 Chat</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="budget">
              <IonLabel>🎯 Budget Coach</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">

        <IonText color="medium">
          <p className="mb-4">
            Ask questions about your finances or get personalized budget coaching
          </p>
        </IonText>

        {/* Info Banner */}
        <IonCard color="warning">
          <IonCardContent>
            <div className="flex items-start">
              <div className="text-2xl mr-3">⚠️</div>
              <div>
                <IonText color="light">
                  <p className="font-semibold mb-1">Helpful AI Assistant</p>
                  <p className="text-sm opacity-90">
                    This AI coach analyzes your actual financial data. It does not provide
                    investment, tax, or legal advice. All insights are educational and based
                    on your transaction history.
                  </p>
                </IonText>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Messages Area */}
        <IonCard className="mt-4" style={{ minHeight: '400px', maxHeight: '60vh', overflow: 'auto' }}>
          <IonCardContent>
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

                <div className="w-full space-y-2">
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
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <IonCard
                      color={message.role === 'user' ? 'primary' : undefined}
                      className="max-w-[80%] m-0"
                    >
                      <IonCardContent>
                        <div className="flex items-start gap-2">
                          <span className="text-lg">
                            {message.role === 'user' ? '👤' : '🤖'}
                          </span>
                          <div className="flex-1">
                            <IonText color={message.role === 'user' ? 'light' : undefined}>
                              <p className="whitespace-pre-wrap leading-relaxed">
                                {message.content}
                              </p>
                            </IonText>
                            <IonText color={message.role === 'user' ? 'light' : 'medium'}>
                              <p className="text-xs mt-2 opacity-70">
                                {message.timestamp.toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </IonText>
                          </div>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <IonCard className="max-w-[80%] m-0">
                      <IonCardContent>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🤖</span>
                          <IonSpinner name="dots" />
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="mt-4">
          <IonCard>
            <IonCardContent>
              <div className="flex gap-3 items-center">
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
                  className="flex-1"
                />
                <IonButton
                  type="submit"
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? 'Thinking...' : 'Send'}
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </form>
      </IonContent>
    </IonPage>
  );
};
