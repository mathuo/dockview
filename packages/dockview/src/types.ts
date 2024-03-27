import { Parameters } from 'dockview-core';

export interface PanelParameters<T extends {} = Parameters> {
    params: T;
}
