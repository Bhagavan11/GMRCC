import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authUser';
import { useNavigate } from 'react-router-dom';

const ChatbotPage = () => {
    const { user, logout } = useAuthStore();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
const API_BASE_URL = 'http://localhost:5000';
    useEffect(() => {
        // Here you would add the logic to fetch chat history from Firestore if using Firebase
        // or from your backend API if storing in MongoDB.
        // For now, this is a placeholder.
    }, [user]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (input.trim() === '' || isSending) return;

        const userMessage = { text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsSending(true);

        // This is where we will call your backend API
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
            const botResponse = { text: data.response, sender: 'bot' };
            setMessages(prev => [...prev, botResponse]);
        } catch (error) {
            console.error("Failed to get bot response:", error);
            const errorMessage = { text: "Sorry, I am unable to respond at the moment.", sender: 'bot' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsSending(false);
        }
    };


    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="chat-page">
            <header className="chat-header">
                <h1>GMRCC</h1>
                <div className="user-info">
                    <span>{user?.username  || 'Guest'}</span>
                    <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
                </div>
            </header>
            <main className="chat-main">
                <div className="chat-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.sender}`}>
                            {msg.text}
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
                    <button type="submit" className="btn btn-primary" disabled={isSending}>Send</button>
                </form>
            </footer>
        </div>
    );
};

export default ChatbotPage;
