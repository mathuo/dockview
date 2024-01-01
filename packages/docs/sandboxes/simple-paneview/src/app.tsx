import {
    PaneviewReact,
    PaneviewReadyEvent,
    IPaneviewPanelProps,
} from 'dockview';
import * as React from 'react';

const components = {
    default: (props: IPaneviewPanelProps<{ title: string }>) => {
        return (
            <div
                style={{
                    padding: '10px',
                    height: '100%',
                    backgroundColor: 'rgb(60,60,60)',
                }}
            >
                {props.params.title}
            </div>
        );
    },
};

const MyHeaderComponent = (props: IPaneviewPanelProps<{ title: string }>) => {
    const [expanded, setExpanded] = React.useState<boolean>(
        props.api.isExpanded
    );

    React.useEffect(() => {
        const disposable = props.api.onDidExpansionChange((event) => {
            setExpanded(event.isExpanded);
        });

        return () => {
            disposable.dispose();
        };
    }, []);

    const onClick = () => {
        props.api.setExpanded(!expanded);
    };

    return (
        <div
            style={{
                padding: '10px',
                height: '100%',
                backgroundColor: 'rgb(60,60,60)',
            }}
        >
            <a
                onClick={onClick}
                className={expanded ? 'expanded' : 'collapsed'}
            />
            <span>{props.params.title}</span>
        </div>
    );
};

const headerComponents = {
    myHeaderComponent: MyHeaderComponent,
};

export const App: React.FC = (props: { isRtl?: boolean; theme?: string; }) => {
    const onReady = (event: PaneviewReadyEvent) => {
        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            params: {
                title: 'Panel 1',
            },
            title: 'Panel 1',
        });

        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            params: {
                title: 'Panel 2',
            },
            title: 'Panel 2',
        });

        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            params: {
                title: 'Panel 3',
            },
            title: 'Panel 3',
        });
    };

    return (
        <PaneviewReact
            components={components}
            headerComponents={headerComponents}
            onReady={onReady}
            isRtl={props.isRtl}
            className={props.theme || 'dockview-theme-abyss'}
        />
    );
};

export default App;
