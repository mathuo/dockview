import * as React from 'react';
import { DockviewApi, GridviewApi } from 'splitview';
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
                componentName: 'test_component',
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
        const id = nextGuid();
        api.addPanelFromComponent({
            componentName: 'test_component',
            id: `control_center_panel_${id}`,
            title: `Item ${id}`,
        });
    };

    const onAddEmpty = () => {
        const api = registry.get<DockviewApi>('dockview');
        api.addEmptyGroup();
    };

    const nextPanel = () => {
        const api = registry.get<DockviewApi>('dockview');
        api.moveToNext({ includePanel: true });
    };
    const nextGroup = () => {
        const api = registry.get<DockviewApi>('dockview');
        api.moveToNext();
    };
    const previousPanel = () => {
        const api = registry.get<DockviewApi>('dockview');
        api.moveToPrevious({ includePanel: true });
    };
    const previousGroup = () => {
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
            api.deserialize(jsonData);
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

    return (
        <div className="control-center">
            <div className="control-center-row">
                <button onClick={onAdd}>Add</button>
            </div>
            <div className="control-center-row">
                <button onClick={onAddEmpty}>Add empty</button>
            </div>
            <div className="control-center-row">
                <button onClick={nextPanel}>Next panel</button>
            </div>
            <div className="control-center-row">
                <button onClick={nextGroup}>Next Group</button>
            </div>
            <div className="control-center-row">
                <button onClick={previousPanel}>Previous Panel</button>
            </div>
            <div className="control-center-row">
                <button onClick={previousGroup}>Previous Group</button>
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
