import type {
    GridviewApi,
    GridviewOptions,
    GridviewPanelApi,
} from 'dockview-core';

export interface GridviewReadyEvent {
    api: GridviewApi;
}

export interface IGridviewVuePanelProps<T extends Record<string, any> = any> {
    params: T;
    api: GridviewPanelApi;
    containerApi: GridviewApi;
}

export interface IGridviewVueProps extends GridviewOptions {
    components: Record<string, string>;
}

export type GridviewVueEvents = {
    ready: [event: GridviewReadyEvent];
};