import * as React from 'react';

export interface PanelCollection<T extends object> {
    [name: string]: React.FunctionComponent<T>;
}

export interface PanelParameters<T extends {} = Record<string, any>> {
    params: T;
}
