import * as React from 'react';
import { DockviewApi, GridviewApi, SplitviewApi } from 'dockview';
import { useLayoutRegistry } from './registry';
import './controlCenter.scss';

const nextGuid = (() => {
    let counter = 0;
    return () => counter++;
})();

export const ControlCenter = () => {
    const registry = useLayoutRegistry();

    const dragRef = React.useRef<HTMLDivElement>();

    React.useEffect(() => {
        const api = registry.get<DockviewApi>('dockview');
        const target = api.createDragTarget(
            { element: dragRef.current, content: 'drag me' },
            () => ({
                id: 'yellow',
                component: 'test_component',
            })
        );

        return () => {
            target.dispose();
        };
    }, []);

    const onDragStart = (event: React.DragEvent) => {
        event.dataTransfer.setData('text/plain', 'Panel2');
    };

    const onAdd = () => {
        const api = registry.get<DockviewApi>('dockview');
        const _id = nextGuid();
        const id = `${_id}`;

        api.addPanel({
            component: 'test_component',
            id,
            title: `Item ${id}`,
        });
    };

    const onAddTheSamePanel = () => {
        const api = registry.get<DockviewApi>('dockview');
        const id = `duplicate_panel`;

        const panel = api.getPanel(id);
        if (panel) {
            api.setActivePanel(panel);
            return;
        }
        api.addPanel({
            component: 'test_component',
            id,
            title: `Item ${id}`,
        });
    };

    const onAddEmpty = () => {
        const api = registry.get<DockviewApi>('dockview');
        api.addEmptyGroup();
    };

    const nextPanel = (ev: React.MouseEvent<HTMLButtonElement>) => {
        ev.preventDefault();
        const api = registry.get<DockviewApi>('dockview');
        api.moveToNext({ includePanel: true });
    };
    const nextGroup = (ev: React.MouseEvent<HTMLButtonElement>) => {
        ev.preventDefault();
        const api = registry.get<DockviewApi>('dockview');
        api.moveToNext();
    };
    const previousPanel = (ev: React.MouseEvent<HTMLButtonElement>) => {
        ev.preventDefault();
        const api = registry.get<DockviewApi>('dockview');
        api.moveToPrevious({ includePanel: true });
    };
    const previousGroup = (ev: React.MouseEvent<HTMLButtonElement>) => {
        ev.preventDefault();
        const api = registry.get<DockviewApi>('dockview');
        api.moveToNext();
    };

    const onConfig = () => {
        const api = registry.get<DockviewApi>('dockview');
        const data = api.toJSON();
        const stringData = JSON.stringify(data, null, 4);
        console.log(stringData);
        localStorage.setItem('layout', stringData);
    };

    const onLoad = async () => {
        const api = registry.get<DockviewApi>('dockview');
        const didClose = await api.closeAllGroups();
        if (!didClose) {
            return;
        }
        const data = localStorage.getItem('layout');
        if (data) {
            const jsonData = JSON.parse(data);
            api.fromJSON(jsonData);
        }
    };

    const onClear = () => {
        const api = registry.get<DockviewApi>('dockview');
        api.closeAllGroups();
    };

    const saveApplicationLayout = () => {
        const api = registry.get<GridviewApi>('dockview');
        console.log(JSON.stringify(api.toJSON(), null, 4));
    };

    const onAddSettings = () => {
        const api = registry.get<DockviewApi>('dockview');

        const settingsPanel = api.getPanel('settings');
        if (settingsPanel) {
            api.setActivePanel(settingsPanel);
            return;
        }

        api.addPanel({
            id: 'settings',
            component: 'settings',
            title: 'Settings',
        });
    };

    const onFocusSplitview = () => {
        const api = registry.get<SplitviewApi>('splitview');

        const panel = api.getPanel('1');

        api.setActive(panel);
    };

    const onFocusPanel = () => {
        const api = registry.get<DockviewApi>('dockview');
        const panel = api.getPanel('split_panel');
        api.setActivePanel(panel);
    };

    return (
        <div className="control-center">
            <div className="control-center-row">
                <button onMouseDown={onFocusSplitview}>Split view focus</button>
            </div>
            <div className="control-center-row">
                <button onMouseDown={onFocusPanel}>
                    Split view panel focus
                </button>
            </div>
            <div className="control-center-row">
                <button onMouseDown={onAdd}>Add new</button>
            </div>
            <div className="control-center-row">
                <button onMouseDown={onAddTheSamePanel}>Add identical</button>
            </div>
            <div className="control-center-row">
                <button onMouseDown={onAddSettings}>Settings</button>
            </div>
            <div className="control-center-row">
                <button onMouseDown={onAddEmpty}>Add empty</button>
            </div>
            <div className="control-center-row">
                <button onMouseDown={nextPanel}>Next panel</button>
            </div>
            <div className="control-center-row">
                <button onMouseDown={nextGroup}>Next Group</button>
            </div>
            <div className="control-center-row">
                <button onMouseDown={previousPanel}>Previous Panel</button>
            </div>
            <div className="control-center-row">
                <button onMouseDown={previousGroup}>Previous Group</button>
            </div>
            <div className="control-center-row">
                <button onClick={onConfig}>Save</button>
            </div>
            <div className="control-center-row">
                <button onClick={onLoad}>Load</button>
            </div>
            <div className="control-center-row">
                <button onClick={onClear}>Clear</button>
            </div>
            <div className="control-center-row">
                <button onClick={saveApplicationLayout}>
                    Save application layout
                </button>
            </div>
            <div
                draggable={true}
                style={{
                    backgroundColor: 'dodgerblue',
                    width: '150px',
                    padding: '2px 14px',
                    margin: '2px 0px',
                }}
                ref={dragRef}
            >
                Drag me
            </div>
            <div
                onDragStart={onDragStart}
                draggable={true}
                style={{
                    backgroundColor: 'orange',
                    width: '150px',
                    padding: '2px 14px',
                    margin: '2px 0px',
                }}
            >
                Drag me too
            </div>
        </div>
    );
};
