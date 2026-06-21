import type {
    PaneviewApi,
    PaneviewDidDropEvent,
    PaneviewOptions,
    PaneviewPanelApi,
} from 'dockview';
import type { VueComponent } from '../utils';

export interface PaneviewReadyEvent {
    api: PaneviewApi;
}

export interface IPaneviewVuePanelProps<T extends Record<string, any> = any> {
    params: T;
    api: PaneviewPanelApi;
    containerApi: PaneviewApi;
    title: string;
}

export interface IPaneviewVueProps extends PaneviewOptions {
    components?: Record<string, VueComponent>;
}

export type PaneviewVueEvents = {
    ready: [event: PaneviewReadyEvent];
    didDrop: [event: PaneviewDidDropEvent];
};
