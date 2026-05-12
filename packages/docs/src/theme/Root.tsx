import React from 'react';
import NewsletterWidget from '../components/NewsletterWidget';

export default function Root({ children }) {
    return (
        <React.StrictMode>
            {children}
            <NewsletterWidget />
        </React.StrictMode>
    );
}
