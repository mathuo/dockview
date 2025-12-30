import React from 'react';
import { Parameters, TabOverflowEvent } from 'dockview-core';

export interface PanelParameters<T extends {} = Parameters> {
    params: T;
}

export interface ITabOverflowProps {
    event: TabOverflowEvent;
}

export interface ITabOverflowTriggerProps {
    event: TabOverflowEvent;
}

export interface IReactTabOverflowConfig {
    content?: React.FunctionComponent<ITabOverflowProps>;
    trigger?: React.FunctionComponent<ITabOverflowTriggerProps>;
}
