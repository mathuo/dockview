import {
    DockviewApi,
    DockviewMutableDisposable,
    DockviewReact,
    DockviewReadyEvent,
    GridConstraintChangeEvent,
    IDockviewPanelProps,
} from 'dockview';
import * as React from 'react';

const components = {
    default: (props: IDockviewPanelProps<{ title: string }>) => {
        const [contraints, setContraints] =
            React.useState<GridConstraintChangeEvent | null>(null);

        React.useEffect(() => {
            props.api.group.api.setConstraints({
                maximumHeight: 200,
                maximumWidth: 200,
            });
        }, []);

        React.useEffect(() => {
            const disposable1 = new DockviewMutableDisposable();

            const disposable = props.api.onDidGroupChange(() => {
                disposable1.value = props.api.group.api.onDidConstraintsChange(
                    (event) => {
                        setContraints(event);
                    }
                );
            });

            setContraints({
                maximumHeight: props.api.group.maximumHeight,
                minimumHeight: props.api.group.minimumHeight,
                maximumWidth: props.api.group.maximumWidth,
                minimumWidth: props.api.group.minimumWidth,
            });

            return () => {
                disposable1.dispose();
                disposable.dispose();
            };
        }, []);

        return (
            <div
                style={{
                    height: '100%',
                    padding: '20px',
                    background: 'var(--dv-group-view-background-color)',
                    color: 'white',
                }}
            >
                <span> {props.params.title}</span>
                {contraints && (
                    <div>
                        <div>{`minHeight=${contraints.minimumHeight}`}</div>
                        <div>{`maxHeight=${contraints.maximumHeight}`}</div>
                        <div>{`minWidth=${contraints.minimumWidth}`}</div>
                        <div>{`maxWidth=${contraints.maximumWidth}`}</div>
                    </div>
                )}
            </div>
        );
    },
};

const App = () => {
    const [api, setApi] = React.useState<DockviewApi>();

    const onReady = (event: DockviewReadyEvent) => {
        const panel = event.api.addPanel({
            id: 'panel_1',
            component: 'default',
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
        });
    };

    return (
        <DockviewReact
            onReady={onReady}
            components={components}
            className="dockview-theme-abyss "
        />
    );
};

export default App;
