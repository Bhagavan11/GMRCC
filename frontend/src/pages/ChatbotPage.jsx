import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authUser';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const ChatbotPage = () => {
  // const { user, logout } = useAuthStore();
  const user = true; // Simulating user authentication

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const navigate = useNavigate();

  const API_BASE_URL = 'http://localhost:5000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // ✅ Helper to clean markdown and decode HTML entities
  const cleanMarkdown = (text) => {
    // Replace triple asterisks with bold
    let cleaned = text.replace(/\*\*\*/g, '**');
    
    // Decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = cleaned;
    return textarea.value;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '' || isSending) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    // Show temporary bot typing bubble
    const typingMsg = { text: 'typing...', sender: 'bot', typing: true };
    setMessages((prev) => [...prev, typingMsg]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setMessages((prev) => {
        // remove typing bubble before adding bot response
        const updated = prev.filter((msg) => !msg.typing);
        return [...updated, { text: cleanMarkdown(data.response), sender: 'bot' }];
      });
    } catch (error) {
      console.error('Failed to get bot response:', error);
      setMessages((prev) => {
        const updated = prev.filter((msg) => !msg.typing);
        return [...updated, { text: 'Sorry, I am unable to respond at the moment.', sender: 'bot' }];
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="chat-page">
      <header className="chat-header">
        <h1>GMRCC</h1>
        <div className="user-info">
          {/* <span>{user?.username || 'Guest'}</span>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button> */}
        </div>
      </header>

      <main className="chat-main">
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              {msg.typing ? (
                <div className="typing-bubble">
                  <span></span><span></span><span></span>
                </div>
              ) : (
                <ReactMarkdown
                  components={{
                    a: ({ node, ...props }) => (
                      <a
                        {...props}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#007bff',
                          textDecoration: 'underline',
                          fontWeight: 500,
                          cursor: 'pointer',
                          pointerEvents: 'auto'
                        }}
                      />
                    ),
                  }}
                  skipHtml={false}
                >
                  {msg.text}
                </ReactMarkdown>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="chat-footer">
        <form onSubmit={sendMessage}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isSending}
          />
          <button type="submit" className="btn btn-primary" disabled={isSending}>
            Send
          </button>
        </form>
      </footer>

      {/* Styles for typing bubble & link highlight */}
      <style>{`
        .message.user {
          text-align: right;
          margin: 5px 0;
        }
        .message.bot {
          text-align: left;
          margin: 5px 0;
        }
        .message.bot a {
          color: #007bff;
          text-decoration: underline;
          font-weight: 500;
          cursor: pointer;
          pointer-events: auto;
        }
        .message.bot a:hover {
          color: #0056b3;
          text-decoration: underline;
        }
        .typing-bubble {
          display: flex;
          gap: 4px;
          padding: 6px;
        }
        .typing-bubble span {
          width: 6px;
          height: 6px;
          background: #888;
          border-radius: 50%;
          animation: bounce 1.4s infinite;
        }
        .typing-bubble span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-bubble span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ChatbotPage;
