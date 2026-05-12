import React from 'react';
import { RecoilRoot } from 'recoil';
import NewsletterWidget from '../components/NewsletterWidget';

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
