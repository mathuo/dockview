import { Parameters } from 'dockview';

export interface PanelParameters<T extends {} = Parameters> {
    params: T;
}
