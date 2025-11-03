import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authUser';

const HomePage = () => {
    const { user, logout } = useAuthStore();
    
    const handleLogout = () => {
        logout();
    }

    return (
        <div className="page-container home-page">
            <div className="content-box home-box">
                <h1>Welcome to Campus Connect</h1>
                <p>Your AI assistant for all college inquiries.</p>
                <div className="button-group">
                    {!user ? (
                        <>
                            <Link to="/login" className="btn btn-primary">Login</Link>
                            <Link to="/signup" className="btn btn-secondary">Signup</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/chatbot" className="btn btn-primary">Go to Chatbot</Link>
                            <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;
