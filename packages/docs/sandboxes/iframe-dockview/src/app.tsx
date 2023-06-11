import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview';
import * as React from 'react';
import { HoistedDockviewPanel } from './hoistedDockviewPanel';

const components = {
    iframeComponent: HoistedDockviewPanel(
        (props: IDockviewPanelProps<{ color: string }>) => {
            return (
                <iframe
                    style={{
                        border: 'none',
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'auto',
                    }}
                    src="https://dockview.dev"
                />
            );
        }
    ),
    basicComponent: () => {
        return (
            <div style={{ padding: '20px', color: 'white' }}>
                {'This panel is just a usual component '}
            </div>
        );
    },
};

export const App: React.FC = () => {
    const onReady = (event: DockviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'iframeComponent',
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'iframeComponent',
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'basicComponent',
        });
    };

    return (
        <DockviewReact
            components={components}
            onReady={onReady}
            className="dockview-theme-abyss"
        />
    );
};

export default App;
