import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
    <div className="page-container not-found-page">
        <div className="content-box">
            <h1>404</h1>
            <p>Page Not Found</p>
            <Link to="/" className="btn btn-primary">Go to Home</Link>
        </div>
    </div>
);

export default NotFoundPage;