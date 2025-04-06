'use client';

import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { db } from '../../lib/firebase';
import { collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useStore } from '../../lib/zustandStore';

interface Message {
  id: number;
  type: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  sessionDate?: string;
}

interface ChatSession {
  messages: Message[];
  date: string;
}

const suggestedQuestions = [
  { id: 1, text: "Generate my next week's program", icon: '📅' },
  { id: 2, text: 'Should I deload this week?', icon: '🔄' },
  { id: 3, text: 'How to improve my squat form?', icon: '🏋️‍♂️' },
  { id: 4, text: 'Recommend a pre-workout meal', icon: '🍎' },
];

// Placeholder for Deepseek API call
const mockDeepseekResponse = async (message: string): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  return `Here's my response to "${message}". I'm your AI fitness coach powered by Deepseek. I can help you with workout planning, form checks, and nutrition advice.`;
};

export default function AIAssistantPage() {
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
        const chatQuery = query(
          collection(db, 'chatMessages'),
          where('userId', '==', currentUser.id),
          where('sessionDate', '==', currentDate),
          orderBy('timestamp', 'asc')
        );

        const querySnapshot = await getDocs(chatQuery);
        const todaysMessages: Message[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          todaysMessages.push({
            id: data.id,
            type: data.type,
            content: data.content,
            timestamp: data.timestamp,
            sessionDate: data.sessionDate,
          });
        });

        if (todaysMessages.length === 0) {
          // Add welcome message if no messages exist for today
          const welcomeMessage: Message = {
            id: Date.now(),
            type: 'assistant',
            content: "Hello! I'm your AI fitness coach powered by Deepseek. How can I help you today?",
            timestamp: new Date().toISOString(),
            sessionDate: currentDate,
          };
          await addDoc(collection(db, 'chatMessages'), {
            ...welcomeMessage,
            userId: currentUser.id,
          });
          setMessages([welcomeMessage]);
        } else {
          setMessages(todaysMessages);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [currentUser?.id, currentDate]);

  const saveMessage = async (message: Message) => {
    if (!currentUser?.id) return;

    try {
      await addDoc(collection(db, 'chatMessages'), {
        ...message,
        userId: currentUser.id,
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !currentUser?.id) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
      sessionDate: currentDate,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      await saveMessage(userMessage);
      const response = await mockDeepseekResponse(input);
      
      const assistantMessage: Message = {
        id: Date.now(),
        type: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        sessionDate: currentDate,
      };

      await saveMessage(assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in chat interaction:', error);
      const errorMessage: Message = {
        id: Date.now(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        sessionDate: currentDate,
      };
      await saveMessage(errorMessage);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importText.trim() || importLoading) return;

    setImportLoading(true);
    try {
      // Store the imported plan in Firestore
      await addDoc(collection(db, 'chatGPTImports'), {
        userId: currentUser?.id,
        content: importText,
        timestamp: new Date().toISOString(),
        processed: false // Flag for whether AI has processed this yet
      });

      setImportText('');
      setShowImport(false);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'assistant',
          content: 'ChatGPT plan imported successfully! I\'ll analyze it and help you implement it.',
          timestamp: new Date().toISOString(),
          sessionDate: currentDate,
        },
      ]);
    } catch (error) {
      console.error('Error importing plan:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'assistant',
          content: 'Sorry, I encountered an error importing the plan. Please try again.',
          timestamp: new Date().toISOString(),
          sessionDate: currentDate,
        },
      ]);
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Fitness Coach</h1>
          <button
            onClick={() => setShowImport(!showImport)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 
              bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
              rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Import from ChatGPT
          </button>
        </div>

        {/* ChatGPT Import Section */}
        {showImport && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Import ChatGPT Workout Plan
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Paste your ChatGPT conversation or workout plan below. I'll help you implement it in your training schedule.
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 
                focus:ring-2 focus:ring-blue-500"
              placeholder="Paste your ChatGPT conversation here..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowImport(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 
                  bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                  rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importLoading || !importText.trim()}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg
                  ${importLoading || !importText.trim()
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                  } transition-colors`}
              >
                {importLoading ? 'Importing...' : 'Sync Plan'}
              </button>
            </div>
          </div>
        )}

        {/* Suggested Questions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {suggestedQuestions.map((question) => (
            <button
              key={question.id}
              onClick={() => setInput(question.text)}
              className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 
                rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <span className="text-2xl">{question.icon}</span>
              <span className="text-gray-700 dark:text-gray-300">{question.text}</span>
            </button>
          ))}
        </div>

        {/* Chat Interface */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <div className="space-y-4 w-full max-w-md">
                  <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4"></div>
                      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                  </div>
                  <div className="animate-pulse flex space-x-4 justify-end">
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 ml-auto"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.timestamp && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 space-x-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your fitness journey..."
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 
                  focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`px-6 py-2.5 rounded-lg text-white font-medium transition-colors ${
                  !input.trim() || isLoading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
} 