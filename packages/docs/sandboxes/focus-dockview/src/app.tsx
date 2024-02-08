import {
    DockviewApi,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview';
import * as React from 'react';

const components = {
    default: (props: IDockviewPanelProps) => {
        React.useEffect(() => {
            const d1 = props.api.onWillFocus((event) => {
                console.log('willFocus');
            });

            const d2 = props.api.onDidActiveChange((event) => {
                console.log(props.api.title, event, 'active');
            });

            const d3 = props.api.onDidActiveGroupChange((event) => {
                console.log(
                    props.api.title,
                    props.api.group.api.isActive,
                    'active-group'
                );
            });

            const d4 = props.api.onDidGroupChange((event) => {
                console.log(
                    props.api.title,
                    props.api.group.id,
                    'group-change'
                );
            });

            return () => {
                d1.dispose();
                d2.dispose();
                d3.dispose();
            };
        }, [props.api]);

        return (
            <div style={{ padding: '20px', color: 'white' }}>
                {props.api.title}
            </div>
        );
    },
};

export const App: React.FC = (props: { theme?: string }) => {
    const [api, setApi] = React.useState<DockviewApi>();

    const onReady = (event: DockviewReadyEvent) => {
        setApi(event.api);

        event.api.addPanel({
            id: 'panel_1',
            title: 'Panel 1',
            component: 'default',
        });

        event.api.addPanel({
            id: 'panel_2',
            title: 'Panel 2',
            component: 'default',
        });

        // event.api.onDidAddPanel((event) => {
        //     console.log('add panel', event);
        // });
        // event.api.onDidActivePanelChange((event) => {
        //     console.log('active panel', event);
        // });
        // event.api.onDidRemovePanel((event) => {
        //     console.log('remove panel', event);
        // });
    };

    return (
        <div
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
            <div>
                <button
                    onClick={() => {
                        api?.getPanel('panel_1')?.focus();
                    }}
                >
                    {'Focus Panel 1'}
                </button>
                <button
                    onClick={() => {
                        api?.getPanel('panel_2')?.focus();
                    }}
                >
                    {'Focus Panel 2'}
                </button>
                <button
                    onClick={() => {
                        api?.getPanel('panel_1')?.api.setActive();
                    }}
                >
                    {'Active Panel 1'}
                </button>
                <button
                    onClick={() => {
                        api?.getPanel('panel_2')?.api.setActive();
                    }}
                >
                    {'Active Panel 2'}
                </button>
            </div>
            <div style={{ flexGrow: 1 }}>
                <DockviewReact
                    components={components}
                    onReady={onReady}
                    className={props.theme || 'dockview-theme-abyss'}
                />
            </div>
        </div>
    );
};

export default App;
