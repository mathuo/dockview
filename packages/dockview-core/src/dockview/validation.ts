import { SerializedGridObject } from '../gridview/gridview';
import { GroupPanelViewState } from './dockviewGroupPanelModel';
import { GroupviewPanelState } from './types';
import { Orientation } from '../splitview/splitview';
import { SerializedDockview } from './dockviewComponent';

function validateGroupViewPanelState(value: GroupviewPanelState): void {
    if (typeof value.id !== 'string') {
        throw new Error('invalid layout');
    }

    if (typeof value.title !== 'string') {
        throw new Error('invalid layout');
    }

    if (value.params !== undefined && typeof value.params !== 'object') {
        throw new Error('invalid layout');
    }
}

function validateGroupPanelViewState(value: GroupPanelViewState): void {
    if (typeof value.id !== 'string') {
        throw new Error('invalid layout');
    }
    if (value.locked !== undefined && typeof value.locked !== 'boolean') {
        throw new Error('invalid layout');
    }
    if (value.hideHeader !== undefined && typeof value.locked !== 'boolean') {
        throw new Error('invalid layout');
    }
    if (
        value.activeView !== undefined &&
        typeof value.activeView !== 'string'
    ) {
        throw new Error('invalid layout');
    }

    if (!Array.isArray(value.views)) {
        throw new Error('invalid layout');
    }

    for (const child of value.views) {
        if (typeof child !== 'string') {
            if (!Array.isArray(value.views)) {
                throw new Error('invalid layout');
            }
        }
    }
}

function validateSerializedGridObject(
    value: SerializedGridObject<GroupPanelViewState>
): void {
    if (value.size !== undefined && typeof value.size !== 'number') {
        throw new Error('invalid layout');
    }

    if (value.visible !== undefined && typeof value.size !== 'boolean') {
        throw new Error('invalid layout');
    }

    if (value.type !== 'branch' && value.type !== 'leaf') {
        throw new Error('invalid layout');
    }

    if (Array.isArray(value.data)) {
        for (const child of value.data) {
            validateSerializedGridObject(child);
        }
    } else {
        validateGroupPanelViewState(value.data);
    }
}

export function validateSerializedDockview(data: SerializedDockview): void {
    if (typeof data !== 'object') {
        throw new Error('invalid layout');
    }

    const { grid, panels, options, activeGroup } = data;

    if (typeof grid !== 'object') {
        throw new Error('invalid layout');
    }

    if (typeof grid.height !== 'number') {
        throw new Error('invalid layout');
    }

    if (typeof grid.width !== 'number') {
        throw new Error('invalid layout');
    }

    if (
        grid.orientation !== Orientation.HORIZONTAL &&
        grid.orientation !== Orientation.VERTICAL
    ) {
        throw new Error('invalid layout');
    }

    validateSerializedGridObject(grid.root);

    if (
        data.activeGroup !== undefined &&
        typeof data.activeGroup !== 'string'
    ) {
        throw new Error('invalid layout');
    }

    if (typeof data.panels !== 'object') {
        throw new Error('invalid layout');
    }

    for (const value of Object.values(data.panels)) {
        validateGroupViewPanelState(value);
    }
}
