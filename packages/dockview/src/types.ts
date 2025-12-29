import { Parameters, TabOverflowEvent } from 'dockview-core';

export interface PanelParameters<T extends {} = Parameters> {
    params: T;
}

export interface ITabOverflowProps {
    event: TabOverflowEvent;
}
