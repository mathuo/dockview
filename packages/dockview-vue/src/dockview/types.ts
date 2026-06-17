import {
    type DockviewDidDropEvent,
    type DockviewOptions,
    type DockviewReadyEvent,
    type DockviewWillDropEvent,
} from 'dockview';
import type { VueComponent } from '../utils';

export interface VueProps {
    components?: Record<string, VueComponent>;
    tabComponents?: Record<string, VueComponent>;
    watermarkComponent?: string | VueComponent;
    defaultTabComponent?: string | VueComponent;
    rightHeaderActionsComponent?: string | VueComponent;
    leftHeaderActionsComponent?: string | VueComponent;
    prefixHeaderActionsComponent?: string | VueComponent;
    tabGroupChipComponent?: string | VueComponent;
    groupDragGhostComponent?: string | VueComponent;
}

export type VueEvents = {
    ready: [event: DockviewReadyEvent];
    didDrop: [event: DockviewDidDropEvent];
    willDrop: [event: DockviewWillDropEvent];
};

export type IDockviewVueProps = DockviewOptions & VueProps;
