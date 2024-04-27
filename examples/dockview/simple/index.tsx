import { createRoot } from 'react-dom/client';
import React from 'react';

import { DockviewReact } from 'dockview';

import 'dockview/dist/styles/dockview.css';

const App = () => {
    return (
        <div className="dv-loaded">
            <DockviewReact
                onReady={(event) => {
                    event.api.addPanel({
                        id: 'panel_1',
                        component: 'default',
                        title: 'Panel 1',
                    });
                }}
                className="dockview-theme-abyss"
                components={{
                    default: (props) => {
                        return <div>{props.api.title}</div>;
                    },
                }}
            />
        </div>
    );
};

createRoot(document.getElementById('app')).render(<App />);
