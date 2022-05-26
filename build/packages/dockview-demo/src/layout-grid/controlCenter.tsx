import * as React from 'react';
import { DockviewApi, GridviewApi, SplitviewApi } from 'dockview';
import { useLayoutRegistry } from './registry';
import './controlCenter.scss';

export const ControlCenter = () => {
    const registry = useLayoutRegistry();

    const onAdd = () => {
        const api = registry.get<DockviewApi>('dockview');
        const _id = Date.now();
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
            panel.api.setActive();
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
        api.closeAllGroups();

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
            settingsPanel.api.setActive();
            return;
        }

        api.addPanel({
            id: 'settings',
            component: 'settings',
            title: 'Settings',
        });
    };

    return (
        <div className="control-center">
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
        </div>
    );
};
