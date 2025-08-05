import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle, XCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api/auth';

const VerifyEmailPage = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('Verifying your email address...');

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const token = queryParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link. Missing token.');
            return;
        }

        const verify = async () => {
            try {
                const url=`${API_BASE_URL}/verify-email?token=${token}`
               
             
                console.log("Verifying email with token:", url);
                const res = await fetch(`${API_BASE_URL}/verify-email?token=${token}`);
                console.log("Response status:", res);
                const data = await res.json();
                if (res.ok && data.success) {
                    setStatus('success');
                    setMessage(data.message + ' You can now log in.');
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Failed to verify email. The token may be invalid or expired.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('Failed to connect to the server. Please try again later.');
            }
        };

        verify();
    }, []);

    const getIcon = () => {
        switch (status) {
            case 'verifying':
                return <Mail size={64} className="animate-pulse text-blue-500" />;
            case 'success':
                return <CheckCircle size={64} className="text-green-500" />;
            case 'error':
                return <XCircle size={64} className="text-red-500" />;
            default:
                return null;
        }
    };

    return (
        <div className="page-container auth-page">
            <div className="content-box">
                <div className="mb-6 flex justify-center">{getIcon()}</div>
                <h2>Email Verification</h2>
                <p className="text-lg text-gray-600 mb-8">{message}</p>
                {status !== 'verifying' && (
                    <Link to="/login" className="btn btn-primary">Go to Login</Link>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;