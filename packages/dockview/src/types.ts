import * as React from 'react';
import { Parameters } from 'dockview-core';

export interface PanelCollection<T extends object> {
    [name: string]: React.FunctionComponent<T>;
}

export interface PanelParameters<T extends {} = Parameters> {
    params: T;
}
