import {
    DockviewApi,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview';
import './app.scss';
import * as React from 'react';

const components = {
    default: (props: IDockviewPanelProps<{ title: string }>) => {
        const [active, setActive] = React.useState<boolean>(props.api.isActive);
        const ref = React.useRef<HTMLInputElement>(null);

        React.useEffect(() => {
            const disposable = props.api.onDidActiveChange((event) => {
                setActive(props.api.isActive);
            });

            return () => {
                disposable.dispose();
            };
        }, [props.api]);

        React.useEffect(() => {
            if (!active) {
                return;
            }

            requestAnimationFrame(() => {
                ref.current?.focus();
            });
        }, [active]);

        return (
            <div
                className="keyboard-example-panel"
                style={{ padding: '20px', color: 'white' }}
            >
                <div style={{ padding: '10px 0px' }}>
                    <span>{props.api.title}</span>
                </div>
                <div className="keyboard-example-description">
                    {'Use '}
                    <span className="keyboard-example-shortcut">
                        {'Ctrl+ArrowLeft'}
                    </span>
                    {' and '}
                    <span className="keyboard-example-shortcut ">
                        {'Ctrl+ArrowRight'}
                    </span>
                    {' to nativgate between tabs.'}
                </div>

                <div style={{ padding: '10px 0px' }}>
                    <div>
                        {
                            'This input box should take focus when the panel is active to demonsrate managed focus'
                        }
                        <input ref={ref} type="text" />
                    </div>
                </div>

                <div>
                    <span>{'isPanelActive: '}</span>
                    <span>{active ? 'true' : 'false'}</span>
                </div>
            </div>
        );
    },
};

const DockviewDemo = (props: { theme?: string }) => {
    const [api, setApi] = React.useState<DockviewApi>();

    const onReady = (event: DockviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            title: 'Panel 1',
        });
        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            title: 'Panel 2',
        });
        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            title: 'Panel 3',
        });
        event.api.addPanel({
            id: 'panel_4',
            component: 'default',
            title: 'Panel 4',
            position: { referencePanel: 'panel_3', direction: 'right' },
        });
        event.api.addPanel({
            id: 'panel_5',
            component: 'default',
            title: 'Panel 5',
            position: { referencePanel: 'panel_4', direction: 'within' },
        });

        event.api.getPanel('panel_1')!.api.setActive();

        setApi(event.api);
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
        if (!api) {
            return;
        }

        if (event.ctrlKey && event.code === 'ArrowLeft') {
            // move backwards
            api.moveToPrevious({ includePanel: true });
        }

        if (event.ctrlKey && event.code === 'ArrowRight') {
            // move backwards
            api.moveToNext({ includePanel: true });
        }
    };

    return (
        <div style={{ height: '100%' }} onKeyDown={onKeyDown}>
            <DockviewReact
                components={components}
                onReady={onReady}
                className={props.theme || 'dockview-theme-abyss'}
            />
        </div>
    );
};

export default DockviewDemo;
