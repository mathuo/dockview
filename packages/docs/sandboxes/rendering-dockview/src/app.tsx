import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview-react';
import * as React from 'react';

const RenderVisibleOnlyContext = React.createContext<{
    render: boolean;
    setRender: (value: boolean) => void;
}>({ render: false, setRender: () => undefined });

function RenderWhenVisible(
    component: React.FunctionComponent<IDockviewPanelProps>
) {
    const HigherOrderComponent = (props: IDockviewPanelProps) => {
        const [visible, setVisible] = React.useState<boolean>(
            props.api.isVisible
        );

        const { render } = React.useContext(RenderVisibleOnlyContext);

        React.useEffect(() => {
            const disposable = props.api.onDidVisibilityChange((event) =>
                setVisible(event.isVisible)
            );

            return () => {
                disposable.dispose();
            };
        }, [props.api]);

        if (!visible && render) {
            return null;
        }

        return React.createElement(component, props);
    };
    return HigherOrderComponent;
}

const formatLine = (line: string) => {
    const now = new Date();

    const pad = (x: number) => (x < 10 ? `0${x}` : `${x}`);

    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
        now.getSeconds()
    )}`;

    return `[${time}] ${line}`;
};

const components = {
    default: RenderWhenVisible(
        (props: IDockviewPanelProps<{ title: string }>) => {
            const [lines, setLines] = React.useState<string[]>([
                formatLine('Component created'),
            ]);

            React.useEffect(() => {
                setLines((lines) => [
                    ...lines,
                    formatLine('Running task for 5 seconds'),
                ]);
                const timeout = setTimeout(() => {
                    setLines((lines) => [
                        ...lines,
                        formatLine('Task completed'),
                    ]);
                }, 5000);

                return () => {
                    clearTimeout(timeout);
                };
            }, []);

            return (
                <div style={{ padding: '20px' }}>
                    <div>{props.params.title}</div>
                    {lines.map((line, i) => (
                        <div key={i}>{line}</div>
                    ))}
                </div>
            );
        }
    ),
};

const Checkbox = () => {
    const { render, setRender } = React.useContext(RenderVisibleOnlyContext);

    return (
        <label>
            Render only when visible
            <input
                type="checkbox"
                checked={render}
                onChange={(e) => setRender(e.target.checked)}
            />
        </label>
    );
};

const RenderingDockview = (props: { theme?: string }) => {
    const [render, setRender] = React.useState<boolean>(false);

    const onReady = (event: DockviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            params: {
                title: 'Panel 1',
            },
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            params: {
                title: 'Panel 2',
            },
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            params: {
                title: 'Panel 3',
            },
        });

        event.api.addPanel({
            id: 'panel_4',
            component: 'default',
            params: {
                title: 'Panel 4',
            },
            position: { referencePanel: 'panel_1', direction: 'right' },
        });
    };

    return (
        <RenderVisibleOnlyContext.Provider value={{ render, setRender }}>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                }}
            >
                <Checkbox />
                <div style={{ flexGrow: 1, color: 'white' }}>
                    <DockviewReact
                        components={components}
                        onReady={onReady}
                        className={`${props.theme || 'dockview-theme-abyss'}`}
                    />
                </div>
            </div>
        </RenderVisibleOnlyContext.Provider>
    );
};

export default RenderingDockview;
