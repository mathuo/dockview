import { type DockviewOptions, type DockviewReadyEvent } from 'dockview-core';

export interface VueProps {
    watermarkComponent?: string;
    defaultTabComponent?: string;
    rightHeaderActionsComponent?: string;
    leftHeaderActionsComponent?: string;
    prefixHeaderActionsComponent?: string;
}

export type VueEvents = {
    ready: [event: DockviewReadyEvent];
};

export type IDockviewVueProps = DockviewOptions & VueProps;
