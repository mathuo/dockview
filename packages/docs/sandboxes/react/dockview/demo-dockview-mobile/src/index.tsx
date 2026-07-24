import * as React from 'react';
import { StrictMode } from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { LicenseManager } from 'dockview-enterprise';
import './styles.css';
import 'dockview/dist/styles/dockview.css';

import App from './app';

// dockview.dev docs license key. Replace with your own key in production.
LicenseManager.setLicenseKey(
    '[KeyId:DOCKVIEW-DOCS]_[Company:Dockview]_[Plan:team]_[AppName:Dockview_Docs]_[Email:enterprise@dockview.dev]_[ValidFrom:01_Jan_2025]_[ValidUntil:01_Jan_2099]__aaa294ecec1eed47'
);

const rootElement = document.getElementById('root');

if (rootElement) {
    const root = ReactDOMClient.createRoot(rootElement);

    root.render(
        <StrictMode>
            <div className="app">
                <App />
            </div>
        </StrictMode>
    );
}
