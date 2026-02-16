import type {
    SplitviewApi,
    SplitviewOptions,
    SplitviewPanelApi,
} from 'dockview-core';

export interface SplitviewReadyEvent {
    api: SplitviewApi;
}

export interface ISplitviewVuePanelProps<T extends Record<string, any> = any> {
    params: T;
    api: SplitviewPanelApi;
    containerApi: SplitviewApi;
}

export interface ISplitviewVueProps extends SplitviewOptions {
    components: Record<string, string>;
}

export type SplitviewVueEvents = {
    ready: [event: SplitviewReadyEvent];
};
