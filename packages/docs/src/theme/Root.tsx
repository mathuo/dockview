import React from 'react';
import { RecoilRoot } from 'recoil';
import NewsletterWidget from '../components/NewsletterWidget';

// Default implementation, that you can customize
export default function Root({ children }) {
    return (
        <React.StrictMode>
            <RecoilRoot>
                {children}
                <NewsletterWidget />
            </RecoilRoot>
        </React.StrictMode>
    );
}
