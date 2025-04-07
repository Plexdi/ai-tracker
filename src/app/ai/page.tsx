'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModernLayout from '@/components/ModernLayout';
import GlassCard from '@/components/GlassCard';
import ModernButton from '@/components/ModernButton';
import { useStore } from '@/lib/zustandStore';
import { saveMessage, getTodayMessages, saveChatGPTImport } from '@/lib/chat-service';
import { getAIResponse } from '@/lib/ai-service';
import { Message } from '@/lib/types';
import { toast } from 'react-hot-toast';

const suggestedQuestions = [
  { id: 1, text: "Generate my next week's program", icon: '📅' },
  { id: 2, text: 'Should I deload this week?', icon: '🔄' },
  { id: 3, text: 'How to improve my squat form?', icon: '🏋️‍♂️' },
  { id: 4, text: 'Recommend a pre-workout meal', icon: '🍎' },
];

export default function AIAssistantPage() {
  const router = useRouter();
  const currentUser = useStore((state) => state.currentUser);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentDate = new Date().toISOString().split('T')[0];

  // Redirect if not authenticated
  useEffect(() => {
    if (!currentUser?.id) {
      router.push('/login');
    }
  }, [currentUser, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load today's chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!currentUser?.id) return;

      try {
        const todaysMessages = await getTodayMessages(currentUser.id, currentDate);

        if (todaysMessages.length === 0) {
          // Add welcome message if no messages exist for today
          const now = Date.now();
          const welcomeMessage: Message = {
            id: now.toString(),
            type: 'assistant',
            content: "Hello! I'm your AI fitness coach powered by Deepseek. How can I help you today?",
            timestamp: new Date(now).toISOString(),
            sessionDate: currentDate,
            createdAt: now
          };
          await saveMessage(welcomeMessage, currentUser.id);
          setMessages([welcomeMessage]);
        } else {
          setMessages(todaysMessages);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        toast.error('Failed to load chat history');
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [currentUser?.id, currentDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !currentUser?.id) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
      sessionDate: currentDate,
      createdAt: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      await saveMessage(userMessage, currentUser.id);
      
      // Get the latest message to access workout context
      const messages = await getTodayMessages(currentUser.id, currentDate);
      const lastAssistantMessage = messages
        .filter(m => m.type === 'assistant')
        .pop();
      
      // Ensure workoutContext has all required fields
      const workoutContext = lastAssistantMessage?.workoutContext && {
        recentWorkouts: lastAssistantMessage.workoutContext.recentWorkouts ?? [],
        currentPRs: lastAssistantMessage.workoutContext.currentPRs ?? {},
        weeklyVolume: lastAssistantMessage.workoutContext.weeklyVolume ?? 0
      };
      
      const aiResponse = await getAIResponse(
        input,
        workoutContext
      );
      
      if (aiResponse.error) {
        throw new Error(aiResponse.error);
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        sessionDate: currentDate,
        createdAt: Date.now()
      };

      await saveMessage(assistantMessage, currentUser.id);
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in chat interaction:', error);
      toast.error('Failed to get AI response');
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        sessionDate: currentDate,
        createdAt: Date.now()
      };
      await saveMessage(errorMessage, currentUser.id);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importText.trim() || importLoading || !currentUser?.id) return;

    setImportLoading(true);
    try {
      await saveChatGPTImport(importText, currentUser.id);
      setImportText('');
      setShowImport(false);
      
      const successMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: "ChatGPT plan imported successfully! I'll analyze it and help you implement it.",
        timestamp: new Date().toISOString(),
        sessionDate: currentDate,
        createdAt: Date.now()
      };
      
      await saveMessage(successMessage, currentUser.id);
      setMessages(prev => [...prev, successMessage]);
      toast.success('Plan imported successfully');
    } catch (error) {
      console.error('Error importing plan:', error);
      toast.error('Failed to import plan');
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error importing the plan. Please try again.',
        timestamp: new Date().toISOString(),
        sessionDate: currentDate,
        createdAt: Date.now()
      };
      
      await saveMessage(errorMessage, currentUser.id);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setImportLoading(false);
    }
  };

  // Early return if not authenticated
  if (!currentUser?.id) {
    return null;
  }

  return (
    <ModernLayout title="AI Fitness Coach" description="Get personalized workout advice and plans">
      <div className="space-y-6">
        {/* Header with import button */}
        <div className="flex items-center justify-end">
          {process.env.NEXT_PUBLIC_ENABLE_CHATGPT_IMPORT && (
            <ModernButton
              variant="secondary"
              size="sm"
              onClick={() => setShowImport(!showImport)}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              }
            >
              Import from ChatGPT
            </ModernButton>
          )}
        </div>

        {/* ChatGPT Import Section */}
        {showImport && (
          <GlassCard title="Import ChatGPT Workout Plan" colSpan="md:col-span-12">
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Paste your ChatGPT conversation or workout plan below. I'll help you implement it in your training schedule.
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 text-white p-3 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Paste your ChatGPT conversation here..."
              />
              <div className="flex justify-end space-x-3">
                <ModernButton
                  variant="outline"
                  onClick={() => setShowImport(false)}
                >
                  Cancel
                </ModernButton>
                <ModernButton
                  variant="primary"
                  onClick={handleImport}
                  isLoading={importLoading}
                  disabled={importLoading || !importText.trim()}
                >
                  Import
                </ModernButton>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Chat Container */}
        <GlassCard colSpan="md:col-span-12">
          <div className="h-[500px] flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              {isLoadingHistory ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-400">No messages yet. Start a conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'bg-slate-800/80 text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70 text-right">
                        {new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            {messages.length > 0 && messages.length < 3 && (
              <div className="px-2 py-3 border-t border-slate-800">
                <p className="text-sm text-slate-400 mb-2">Suggested questions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => setInput(q.text)}
                      className="text-sm bg-slate-800 hover:bg-slate-700 transition-colors text-white px-3 py-1.5 rounded-lg flex items-center"
                    >
                      <span className="mr-2">{q.icon}</span>
                      {q.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-slate-800 p-4">
              <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  placeholder="Type your message..."
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800/80 text-white p-2.5 
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <ModernButton
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  disabled={!input.trim() || isLoading}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  }
                >
                  Send
                </ModernButton>
              </form>
            </div>
          </div>
        </GlassCard>

        {/* Info Card */}
        <GlassCard title="About Your AI Coach" colSpan="md:col-span-12">
          <p className="text-slate-300">
            Your AI fitness coach is powered by Deepseek, a state-of-the-art language model. It can help you with workout planning, nutrition advice, 
            form checks, and more. The more specific your questions, the better the guidance you'll receive.
          </p>
          <div className="mt-4 bg-slate-800/60 rounded-lg p-4 text-sm">
            <p className="text-slate-400 mb-2">Try asking about:</p>
            <ul className="list-disc pl-5 text-slate-300 space-y-1">
              <li>Creating a personalized workout program</li>
              <li>Advice on improving specific lifts</li>
              <li>Nutrition recommendations based on your goals</li>
              <li>Recovery strategies and mobility work</li>
              <li>How to adapt your training when life gets busy</li>
            </ul>
          </div>
        </GlassCard>
      </div>
    </ModernLayout>
  );
} 