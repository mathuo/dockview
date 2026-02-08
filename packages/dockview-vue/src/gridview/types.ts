import type {
    GridviewApi,
    GridviewOptions,
    GridviewPanelApi,
    Parameters,
} from 'dockview-core';

export interface GridviewReadyEvent {
    api: GridviewApi;
}

export interface IGridviewVuePanelProps<T extends Parameters = Parameters> {
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