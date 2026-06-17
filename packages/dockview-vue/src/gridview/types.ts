import type {
    GridviewApi,
    GridviewOptions,
    GridviewPanelApi,
} from 'dockview';
import type { VueComponent } from '../utils';

export interface GridviewReadyEvent {
    api: GridviewApi;
}

export interface IGridviewVuePanelProps<T extends Record<string, any> = any> {
    params: T;
    api: GridviewPanelApi;
    containerApi: GridviewApi;
}

export interface IGridviewVueProps extends GridviewOptions {
    components?: Record<string, VueComponent>;
}

export type GridviewVueEvents = {
    ready: [event: GridviewReadyEvent];
};
