import { StrictMode } from 'react';
import * as ReactDOMClient from 'react-dom/client';
import './styles.css';
import 'dockview/dist/styles/dockview.css';

import App from './app';

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
