import React from 'react';
import ReactDOM from 'react-dom';

import { DockviewReact } from 'dockview';
import 'dockview/dist/styles/dockview.css';
import './main.css';

const App = () => {
    return (
        <div style={{ height: '100px' }} className="dv-loaded">
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

ReactDOM.render(<App />, document.getElementById('app')!);
