import ReactDOM from 'react-dom/client';
import React from 'react';
import 'dockview/dist/styles/dockview.css';

import App from './app.tsx';

const rootElement = document.getElementById('app');

if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);

    root.render(<App />);
}
