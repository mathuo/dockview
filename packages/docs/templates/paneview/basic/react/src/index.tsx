import ReactDOM from 'react-dom/client';
import React from 'react';
import 'dockview/dist/styles/dockview.css';
import App from './app.tsx';

const container = document.getElementById('app')!;
const root = ReactDOM.createRoot(container);
root.render(<App />);