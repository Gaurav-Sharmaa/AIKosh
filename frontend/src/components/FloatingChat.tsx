import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Matches the backend Answer model — confidence removed
interface Message {
  text: string;
  isUser: boolean;
  isStreaming?: boolean;
}

// Matches the backend Question model
interface HistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

// Dynamic loading messages — randomly picked so it never feels hardcoded
// Grouped by category so it feels contextual
const LOADING_MESSAGES = [
  "Searching AIKosh database...",
  "Looking through datasets and models...",
  "Finding the best matches for you...",
  "Scanning use cases and toolkits...",
  "Checking articles and tutorials...",
  "Pulling relevant resources...",
  "Almost there, retrieving results...",
  "Cross-referencing AIKosh data...",
];

function getRandomLoadingMessage(): string {
  return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
}

const MAX_INPUT_LENGTH = 500;

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hey! I'm your AIKosh assistant. Ask me about datasets, models, use cases, or anything on the platform.", isUser: false }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Conversation history sent to backend so the model has memory
  const conversationHistory = useRef<HistoryEntry[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Rotate loading messages every 3 seconds so it feels alive
  const startLoadingMessages = () => {
    setLoadingMessage(getRandomLoadingMessage());
    loadingIntervalRef.current = setInterval(() => {
      setLoadingMessage(getRandomLoadingMessage());
    }, 3000);
  };

  const stopLoadingMessages = () => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
    setLoadingMessage('');
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    stopLoadingMessages();
    setIsStreaming(false);
    setIsLoading(false);

    setMessages(prev => {
      const newMessages = [...prev];
      const lastIndex = newMessages.length - 1;
      if (lastIndex >= 0 && newMessages[lastIndex].isStreaming) {
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          isStreaming: false,
        };
      }
      return newMessages;
    });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    setIsStreaming(true);

    // Add user message to UI
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);

    // Add placeholder for the assistant response
    setMessages(prev => [...prev, { text: '', isUser: false, isStreaming: true }]);

    // Start rotating loading messages
    startLoadingMessages();

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('http://127.0.0.1:8000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage,
          history: conversationHistory.current,  // send full history for memory
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      const answer: string = data.answer || "Sorry, I couldn't generate a response.";

      // Stop the rotating loading messages now that we have the answer
      stopLoadingMessages();

      // Update the assistant message with the actual answer
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        if (lastIndex >= 0 && newMessages[lastIndex].isStreaming) {
          newMessages[lastIndex] = {
            text: answer,
            isUser: false,
            isStreaming: false,
          };
        }
        return newMessages;
      });

      // Save this turn to conversation history so the next request has memory
      conversationHistory.current = [
        ...conversationHistory.current,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: answer },
      ];

      // Keep history to last 10 turns (20 entries) to avoid hitting token limits
      if (conversationHistory.current.length > 20) {
        conversationHistory.current = conversationHistory.current.slice(-20);
      }

    } catch (error: any) {
      stopLoadingMessages();

      if (error.name !== 'AbortError') {
        console.error('Error fetching chat response:', error);
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          if (lastIndex >= 0 && newMessages[lastIndex].isStreaming) {
            newMessages[lastIndex] = {
              text: "Something went wrong. Please check that all three services are running and try again.",
              isUser: false,
              isStreaming: false,
            };
          }
          return newMessages;
        });
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_INPUT_LENGTH) {
      setInputValue(value);
    }
  };

  // Clear history when the chat is closed and reopened (optional — remove if you want history to persist)
  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const charsLeft = MAX_INPUT_LENGTH - inputValue.length;
  const showCharWarning = charsLeft < 100;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 hover:scale-110 group"
        aria-label="Open AI Chat"
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}

        <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          AI Assistant
        </span>
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-200 animate-slideUp">

          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">AIKosh Assistant</h3>
                <p className="text-xs text-orange-100">
                  {isLoading ? loadingMessage || 'Thinking...' : 'Always here to help'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.isUser
                      ? 'bg-orange-500 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-200'
                  }`}
                >
                  {message.isUser ? (
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  ) : (
                    <div className="text-sm prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
                      {message.text ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                      ) : (
                        // Loading dots while waiting for response
                        <div className="flex flex-col space-y-1">
                          <span className="inline-flex items-center space-x-1">
                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </span>
                          {loadingMessage && (
                            <span className="text-xs text-gray-400 italic">{loadingMessage}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 bg-white rounded-b-2xl border-t border-gray-200">
            <div className="flex items-end space-x-2">
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about AIKosh..."
                  rows={1}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
                  style={{ maxHeight: '100px' }}
                  disabled={isLoading}
                />
                {/* Character counter — only shows when approaching limit */}
                {showCharWarning && (
                  <span className={`absolute bottom-2 right-3 text-xs ${charsLeft < 20 ? 'text-red-400' : 'text-gray-400'}`}>
                    {charsLeft}
                  </span>
                )}
              </div>

              <button
                onClick={isStreaming ? handleStop : handleSend}
                disabled={!isStreaming && (!inputValue.trim() || isLoading)}
                className={`${
                  isStreaming
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed'
                } text-white rounded-xl px-4 py-2 transition-colors flex items-center justify-center`}
              >
                {isStreaming ? (
                  // Stop icon
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : isLoading ? (
                  // Spinner while waiting
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  // Send icon
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}