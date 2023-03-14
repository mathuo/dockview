import {
    DockviewApi,
    DockviewReact,
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview';
import * as React from 'react';

const components = {
    default: (props: IDockviewPanelProps<{ title: string }>) => {
        return (
            <div
                style={{
                    height: '100%',
                    padding: '20px',
                    background: 'var(--dv-group-view-background-color)',
                }}
            >
                {props.params.title}
            </div>
        );
    },
};

const counter = (() => {
    let i = 0;

    return {
        next: () => ++i,
    };
})();

function loadDefaultLayout(api: DockviewApi) {
    api.addPanel({
        id: 'panel_1',
        component: 'default',
    });

    api.addPanel({
        id: 'panel_2',
        component: 'default',
    });

    api.addPanel({
        id: 'panel_3',
        component: 'default',
    });
}

export const DockviewPersistance = () => {
    const [api, setApi] = React.useState<DockviewApi>();

    const clearLayout = () => {
        localStorage.removeItem('dockview_persistance_layout');
        if (api) {
            api.clear();
            loadDefaultLayout(api);
        }
    };

    const onReady = (event: DockviewReadyEvent) => {
        const layoutString = localStorage.getItem(
            'dockview_persistance_layout'
        );

        let success = false;

        if (layoutString) {
            try {
                const layout = JSON.parse(layoutString);
                event.api.fromJSON(layout);
                success = true;
            } catch (err) {
                //
            }
        }

        if (!success) {
            loadDefaultLayout(event.api);
        }

        setApi(event.api);
    };

    React.useEffect(() => {
        if (!api) {
            return;
        }

        api.onDidLayoutChange(() => {
            const layout = api.toJSON();

            localStorage.setItem(
                'dockview_persistance_layout',
                JSON.stringify(layout)
            );
        });
    }, [api]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div>
                <button onClick={clearLayout}>Reset Layout</button>
            </div>
            <DockviewReact
                onReady={onReady}
                components={components}
                watermarkComponent={Watermark}
                className="dockview-theme-abyss"
            />
        </div>
    );
};

export default DockviewPersistance;

const Watermark = () => {
    return <div style={{ color: 'white', padding: '8px' }}>watermark</div>;
};
