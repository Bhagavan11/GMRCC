import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authUser.js';
import AnimatedLoader from './components/loader.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import ChatbotPage from './pages/ChatbotPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
import { Toaster } from 'react-hot-toast';
import './index.css'
function App() {
    const { user, isCheckingAuth, authCheck } = useAuthStore();

    useEffect(() => {
        authCheck();
    }, [authCheck]);

    if (isCheckingAuth) {
        return <AnimatedLoader />;
    }

    return (
        <>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={!user ? <LoginPage /> : <ChatbotPage />} />
                <Route path="/signup" element={!user ? <SignUpPage /> : <ChatbotPage />} />
                <Route path="/chatbot" element={user ? <ChatbotPage /> : <LoginPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <Toaster />
        </>
    );
}

export default App;