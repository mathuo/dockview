import { type DockviewOptions, type DockviewReadyEvent } from 'dockview-core';

export interface IVueTabOverflowConfig {
    content?: string;
    trigger?: string;
}

export interface VueProps {
    watermarkComponent?: string;
    defaultTabComponent?: string;
    rightHeaderActionsComponent?: string;
    leftHeaderActionsComponent?: string;
    prefixHeaderActionsComponent?: string;
    tabOverflowComponent?: string | IVueTabOverflowConfig;
}

export type VueEvents = {
    ready: [event: DockviewReadyEvent];
};

export type IDockviewVueProps = DockviewOptions & VueProps;
