import {
    type DockviewDidDropEvent,
    type DockviewOptions,
    type DockviewReadyEvent,
    type DockviewWillDropEvent,
} from 'dockview-core';

export interface VueProps {
    watermarkComponent?: string;
    defaultTabComponent?: string;
    rightHeaderActionsComponent?: string;
    leftHeaderActionsComponent?: string;
    prefixHeaderActionsComponent?: string;
    tabGroupChipComponent?: string;
    groupDragGhostComponent?: string;
}

export type VueEvents = {
    ready: [event: DockviewReadyEvent];
    didDrop: [event: DockviewDidDropEvent];
    willDrop: [event: DockviewWillDropEvent];
};

export type IDockviewVueProps = DockviewOptions & VueProps;
