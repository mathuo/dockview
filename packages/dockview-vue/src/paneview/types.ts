import type {
    PaneviewApi,
    PaneviewOptions,
    PaneviewPanelApi,
    Parameters,
} from 'dockview-core';

export interface PaneviewReadyEvent {
    api: PaneviewApi;
}

export interface IPaneviewVuePanelProps<T extends Parameters = Parameters> {
    params: T;
    api: PaneviewPanelApi;
    containerApi: PaneviewApi;
    title: string;
}

export interface IPaneviewVueProps extends PaneviewOptions {
    components: Record<string, string>;
}

export type PaneviewVueEvents = {
    ready: [event: PaneviewReadyEvent];
};