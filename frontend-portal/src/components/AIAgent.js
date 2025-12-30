import React, { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend, FiMinimize2, FiZap } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../utils/api';
import './AIAgent.css';

// Sparkle icon component
const SparkleIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="sparkle-icon"
  >
    <path
      d="M9 0L10.5 6L16.5 4.5L11 9L16.5 13.5L10.5 12L9 18L7.5 12L1.5 13.5L7 9L1.5 4.5L7.5 6L9 0Z"
      fill="currentColor"
    />
    <circle cx="4" cy="4" r="1" fill="currentColor" opacity="0.8" />
    <circle cx="14" cy="14" r="1" fill="currentColor" opacity="0.8" />
    <circle cx="14" cy="4" r="0.75" fill="currentColor" opacity="0.6" />
    <circle cx="4" cy="14" r="0.75" fill="currentColor" opacity="0.6" />
  </svg>
);

const AIAgent = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: i18n.language === 'ar' 
        ? 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟'
        : 'Hello! I\'m your AI assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    try {
      // Call AI API
      const response = await api.post('/ai/chat', {
        message: messageText,
        language: i18n.language || 'en',
        conversationHistory: messages.slice(-5) // Send last 5 messages for context
      });

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: response.data.response,
        timestamp: new Date(),
        searchResults: response.data.searchResults || []
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorMessage = i18n.language === 'ar'
        ? 'عذراً، حدث خطأ أثناء معالجة رسالتك. يرجى المحاولة مرة أخرى.'
        : 'Sorry, an error occurred while processing your message. Please try again.';
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: errorMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      toast.error(errorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChat = () => {
    if (isOpen && !isMinimized) {
      setIsMinimized(true);
    } else if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`ai-agent-container ${isRTL ? 'rtl' : 'ltr'}`}>
      {isOpen && (
        <div className={`ai-agent-chat ${isMinimized ? 'minimized' : ''} ${isRTL ? 'rtl' : 'ltr'}`}>
          <div className="ai-agent-header">
            <div className="ai-agent-header-info">
              <div className="ai-agent-avatar">
                <FiMessageCircle />
              </div>
              <div className="ai-agent-header-text">
                <h3>{i18n.language === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}</h3>
                <span className="ai-agent-status">
                  {i18n.language === 'ar' ? 'متصل' : 'Online'}
                </span>
              </div>
            </div>
            <div className="ai-agent-header-actions">
              <button
                className="ai-agent-btn-icon"
                onClick={toggleChat}
                aria-label={isMinimized ? 'Maximize' : 'Minimize'}
              >
                <FiMinimize2 />
              </button>
              <button
                className="ai-agent-btn-icon"
                onClick={closeChat}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="ai-agent-messages">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`ai-agent-message ${message.type === 'user' ? 'user' : 'bot'}`}
                  >
                    <div className="ai-agent-message-content">
                      <p>{message.text}</p>
                      <span className="ai-agent-message-time">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="ai-agent-message bot">
                    <div className="ai-agent-message-content">
                      <div className="ai-agent-typing">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="ai-agent-input-form" onSubmit={handleSendMessage}>
                <input
                  ref={inputRef}
                  type="text"
                  className="ai-agent-input"
                  placeholder={i18n.language === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                <button
                  type="submit"
                  className="ai-agent-send-btn"
                  disabled={!inputValue.trim() || isTyping}
                >
                  <FiSend />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        className="ai-agent-toggle"
        onClick={toggleChat}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <FiX className="ai-agent-toggle-close" />
        ) : (
          <>
            <SparkleIcon />
            <span className="ai-agent-toggle-text">
              {i18n.language === 'ar' ? 'اسأل iDream AI' : 'Ask iDream AI'}
            </span>
          </>
        )}
      </button>
    </div>
  );
};

export default AIAgent;

