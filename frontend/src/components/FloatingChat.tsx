import {useEffect, useRef, useState} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    text: string;
    isUser: boolean;
    isStreaming?: boolean;
}

interface HistoryEntry {
    role: 'user' | 'assistant';
    content: string;
}

// ── Loading messages — same list as original ──
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
        {
            text: "Namaste! I'm your AIKosh assistant. Ask me about datasets, models, use cases, or anything on the platform.",
            isUser: false
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    const conversationHistory = useRef<HistoryEntry[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);

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
            const updated = [...prev];
            const last = updated.length - 1;
            if (last >= 0 && updated[last].isStreaming) {
                updated[last] = {...updated[last], isStreaming: false};
            }
            return updated;
        });
    };

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setIsLoading(true);
        setIsStreaming(true);

        setMessages(prev => [...prev, {text: userMessage, isUser: true}]);
        setMessages(prev => [...prev, {text: '', isUser: false, isStreaming: true}]);

        startLoadingMessages();
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch('http://127.0.0.1:8000/ask', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    question: userMessage,
                    history: conversationHistory.current,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error((errorData as { detail?: string }).detail || `Server error: ${response.status}`);
            }

            const data = await response.json() as { answer?: string };
            const answer: string = data.answer ?? "Sorry, I couldn't generate a response.";

            stopLoadingMessages();

            setMessages(prev => {
                const updated = [...prev];
                const last = updated.length - 1;
                if (last >= 0 && updated[last].isStreaming) {
                    updated[last] = {text: answer, isUser: false, isStreaming: false};
                }
                return updated;
            });

            conversationHistory.current = [
                ...conversationHistory.current,
                {role: 'user', content: userMessage},
                {role: 'assistant', content: answer},
            ];

            if (conversationHistory.current.length > 20) {
                conversationHistory.current = conversationHistory.current.slice(-20);
            }

        } catch (error: unknown) {
            stopLoadingMessages();
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error('Error fetching chat response:', error);
                setMessages(prev => {
                    const updated = [...prev];
                    const last = updated.length - 1;
                    if (last >= 0 && updated[last].isStreaming) {
                        updated[last] = {
                            text: "Something went wrong. Please check that all three services are running and try again.",
                            isUser: false,
                            isStreaming: false,
                        };
                    }
                    return updated;
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
        if (e.target.value.length <= MAX_INPUT_LENGTH) {
            setInputValue(e.target.value);
        }
    };

    const handleToggle = () => setIsOpen(prev => !prev);

    const charsLeft = MAX_INPUT_LENGTH - inputValue.length;
    const showCharWarning = charsLeft < 100;

    return (
        <>
            {/* ── Floating trigger button ── */}
            <button
                onClick={handleToggle}
                title="AIKosh AI Sahayak"
                style={{
                    position: 'fixed', bottom: '24px', right: '24px',
                    width: '56px', height: '56px',
                    background: '#003366',
                    border: '2px solid rgba(255,153,51,0.6)',
                    borderRadius: '50%',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000,
                    transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
                }}
                aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
            >
                {isOpen ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"
                         strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"
                         strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                )}

                {/* Saffron indicator dot */}
                {!isOpen && (
                    <span style={{
                        position: 'absolute', top: '-2px', right: '-2px',
                        width: '12px', height: '12px',
                        background: '#FF9933',
                        borderRadius: '50%',
                        border: '2px solid #fff',
                    }}/>
                )}
            </button>

            {/* ── Chat panel ── */}
            {isOpen && (
                <div style={{
                    position: 'fixed', bottom: '92px', right: '24px',
                    width: '380px', height: '520px',
                    background: '#fff',
                    border: '1px solid #dde1e7',
                    borderRadius: '4px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                    display: 'flex', flexDirection: 'column',
                    zIndex: 1000,
                    animation: 'chatSlideUp 0.2s ease-out',
                    overflow: 'hidden',
                    fontFamily: "'Noto Sans', 'Segoe UI', sans-serif",
                }}>

                    {/* Tricolour top accent */}
                    <div style={{
                        height: '4px',
                        background: 'linear-gradient(90deg, #FF9933 33%, #ffffff 33%, #ffffff 66%, #138808 66%)',
                        flexShrink: 0
                    }}/>

                    {/* Header */}
                    <div style={{
                        background: '#003366',
                        color: '#fff',
                        padding: '12px 16px',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        flexShrink: 0,
                    }}>
                        {/* Chakra icon */}
                        <div style={{
                            width: '36px', height: '36px',
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)"
                                 strokeWidth="1.5">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                                <circle cx="12" cy="12" r="3" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5"
                                        fill="none"/>
                                {Array.from({length: 8}).map((_, i) => {
                                    const a = (i * 45 * Math.PI) / 180;
                                    return <line key={i} x1={12 + 4 * Math.cos(a)} y1={12 + 4 * Math.sin(a)}
                                                 x2={12 + 8 * Math.cos(a)} y2={12 + 8 * Math.sin(a)}
                                                 stroke="rgba(255,255,255,0.7)" strokeWidth="1"/>;
                                })}
                            </svg>
                        </div>

                        <div style={{flex: 1, minWidth: 0}}>
                            <div style={{fontSize: '14px', fontWeight: 700, color: '#fff'}}>AIKosh Sahayak</div>
                            <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.65)', marginTop: '1px'}}>
                                {isLoading ? (loadingMessage || 'Thinking...') : 'AI सहायक — National AI Assistant'}
                            </div>
                        </div>

                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: 'rgba(255,255,255,0.7)',
                                flexShrink: 0
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                 strokeWidth="2.5" strokeLinecap="round">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    {/* Messages area */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '16px',
                        background: '#f8f9fa',
                        display: 'flex', flexDirection: 'column', gap: '12px',
                    }}>
                        {messages.map((message, index) => (
                            <div key={index}
                                 style={{display: 'flex', justifyContent: message.isUser ? 'flex-end' : 'flex-start'}}>
                                {/* Avatar for assistant */}
                                {!message.isUser && (
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        background: '#003366',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0, marginRight: '8px', marginTop: '2px',
                                        fontSize: '10px', color: '#FF9933', fontWeight: 700,
                                    }}>
                                        AI
                                    </div>
                                )}

                                <div style={{
                                    maxWidth: '78%',
                                    padding: '10px 14px',
                                    borderRadius: message.isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                                    background: message.isUser ? '#003366' : '#fff',
                                    color: message.isUser ? '#fff' : '#1a2e4a',
                                    border: message.isUser ? 'none' : '1px solid #dde1e7',
                                    fontSize: '13px',
                                    lineHeight: '1.6',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                }}>
                                    {message.isUser ? (
                                        <p style={{margin: 0, whiteSpace: 'pre-wrap'}}>{message.text}</p>
                                    ) : (
                                        <div style={{margin: 0}}>
                                            {message.text ? (
                                                <div className="chat-markdown">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                                                    <div style={{display: 'flex', gap: '4px', alignItems: 'center'}}>
                                                        {[0, 150, 300].map(delay => (
                                                            <span key={delay} style={{
                                                                width: '7px', height: '7px', borderRadius: '50%',
                                                                background: '#FF9933',
                                                                animation: `chatBounce 1.2s ease-in-out ${delay}ms infinite`,
                                                                display: 'inline-block',
                                                            }}/>
                                                        ))}
                                                    </div>
                                                    {loadingMessage && (
                                                        <span style={{
                                                            fontSize: '11px',
                                                            color: '#9ca3af',
                                                            fontStyle: 'italic'
                                                        }}>
                              {loadingMessage}
                            </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef}/>
                    </div>

                    {/* Input area */}
                    <div style={{
                        padding: '12px 14px',
                        background: '#fff',
                        borderTop: '1px solid #e9ecef',
                        flexShrink: 0,
                    }}>
                        <div style={{display: 'flex', gap: '8px', alignItems: 'flex-end'}}>
                            <div style={{flex: 1, position: 'relative'}}>
                <textarea
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about datasets, models, use cases..."
                    rows={1}
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        padding: '9px 12px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        resize: 'none',
                        outline: 'none',
                        maxHeight: '100px',
                        overflowY: 'auto',
                        boxSizing: 'border-box',
                        color: '#1a2e4a',
                        background: isLoading ? '#f8f9fa' : '#fff',
                        transition: 'border-color 0.15s',
                    }}
                    onFocus={e => {
                        (e.target as HTMLTextAreaElement).style.borderColor = '#003366';
                    }}
                    onBlur={e => {
                        (e.target as HTMLTextAreaElement).style.borderColor = '#ced4da';
                    }}
                />
                                {showCharWarning && (
                                    <span style={{
                                        position: 'absolute', bottom: '8px', right: '8px',
                                        fontSize: '11px',
                                        color: charsLeft < 20 ? '#dc2626' : '#9ca3af',
                                    }}>
                    {charsLeft}
                  </span>
                                )}
                            </div>

                            <button
                                onClick={isStreaming ? handleStop : handleSend}
                                disabled={!isStreaming && (!inputValue.trim() || isLoading)}
                                style={{
                                    width: '38px', height: '38px',
                                    background: isStreaming ? '#dc2626' : '#003366',
                                    border: 'none', borderRadius: '4px',
                                    cursor: (!isStreaming && (!inputValue.trim() || isLoading)) ? 'not-allowed' : 'pointer',
                                    opacity: (!isStreaming && (!inputValue.trim() || isLoading)) ? 0.5 : 1,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'background 0.15s, opacity 0.15s',
                                }}
                            >
                                {isStreaming ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                                        <rect x="6" y="6" width="12" height="12" rx="1"/>
                                    </svg>
                                ) : isLoading ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff"
                                         strokeWidth="2.5" style={{animation: 'spin 0.8s linear infinite'}}>
                                        <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff"
                                         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"/>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                    </svg>
                                )}
                            </button>
                        </div>

                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginTop: '6px',
                        }}>
                            <p style={{margin: 0, fontSize: '10px', color: '#9ca3af'}}>
                                Enter to send &middot; Shift+Enter for new line
                            </p>
                            <p style={{margin: 0, fontSize: '10px', color: '#9ca3af'}}>
                                Powered by Sarvam AI
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatBounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .chat-markdown p { margin: 0 0 6px; }
        .chat-markdown p:last-child { margin-bottom: 0; }
        .chat-markdown ul, .chat-markdown ol { margin: 4px 0 6px; padding-left: 18px; }
        .chat-markdown li { margin-bottom: 3px; }
        .chat-markdown strong { font-weight: 600; color: #003366; }
        .chat-markdown h1, .chat-markdown h2, .chat-markdown h3 {
          font-size: 14px; font-weight: 600; color: #003366; margin: 8px 0 4px;
        }
        .chat-markdown code {
          font-size: 12px; background: #f1f5f9; padding: 1px 5px;
          border-radius: 3px; font-family: monospace;
        }
      `}</style>
        </>
    );
}