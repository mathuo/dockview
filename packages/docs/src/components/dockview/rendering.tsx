import {
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
    PanelApi,
} from 'dockview';
import * as React from 'react';

import { atom, useRecoilState, useRecoilValue } from 'recoil';

const renderVisibleComponentsOnlyAtom = atom<boolean>({
    key: 'renderVisibleComponentsOnlyAtom',
    default: false,
});

function RenderWhenVisible<
    T extends { api: Pick<PanelApi, 'isVisible' | 'onDidVisibilityChange'> }
>(component: React.FunctionComponent<T>) {
    const HigherOrderComponent = (props: T) => {
        const [visible, setVisible] = React.useState<boolean>(
            props.api.isVisible
        );

        const render = useRecoilValue(renderVisibleComponentsOnlyAtom);

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

export const RenderingDockview = (props: { renderVisibleOnly: boolean }) => {
    const [render, setRender] = useRecoilState(renderVisibleComponentsOnlyAtom);

    React.useEffect(
        () => setRender(props.renderVisibleOnly),
        [props.renderVisibleOnly]
    );

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
        <DockviewReact
            components={components}
            onReady={onReady}
            className="dockview-theme-abyss"
        />
    );
};

export const Checkbox = () => {
    const [render, setRender] = useRecoilState(renderVisibleComponentsOnlyAtom);

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
