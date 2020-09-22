import * as React from 'react';
import { Pane, IDisposable } from 'splitview';

export class PaneReact extends Pane {
    private params: {};

    constructor(
        private readonly bodyComponent: React.FunctionComponent<{}>,
        private readonly options: {
            isExpanded: boolean;
            headerName: string;
            addPortal: (portal: React.ReactPortal) => IDisposable;
            headerComponent?: React.FunctionComponent<{}>;
        }
    ) {
        super({ isExpanded: options.isExpanded });
        this.layout = this.layout.bind(this);
        this.onDidChange = this.onDidChange.bind(this);

        this.render();
    }

    init(parameters: {}): void {
        this.params = parameters;
    }

    public renderBody(element: HTMLElement) {
        //
    }

    public renderHeader(element: HTMLElement) {
        //
    }

    public layout(size: number, orthogonalSize: number) {
        super.layout(size, orthogonalSize);
    }

    public dispose() {
        //
    }
}
