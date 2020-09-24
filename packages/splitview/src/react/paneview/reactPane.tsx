import * as React from 'react';
import { IPanePanelApi, PanePanelApi } from '../../api/panePanelApi';
import { Pane } from '../../paneview/paneview';
import { ReactLayout } from '../dockview/dockview';
import { ReactPart } from '../react';

export class PaneReact extends Pane {
    private params: {};
    private api: PanePanelApi;

    private contentPart: ReactPart;
    private headerPart: ReactPart;

    constructor(
        private id: string,
        private componentId: string,
        private readonly bodyComponent: React.FunctionComponent<{}>,
        private readonly parent: ReactLayout,
        private readonly options: {
            isExpanded?: boolean;
            headerName?: string;
            headerComponent?: React.FunctionComponent<{}>;
        }
    ) {
        super({
            isExpanded: true,
            // options.isExpanded
        });

        this.api = new PanePanelApi();

        this.addDisposables(
            this.onDidChangeExpansionState((isExpanded) => {
                this.api._onDidExpansionChange.fire({ isExpanded });
            })
        );

        this.render();
    }

    init(parameters: {}): void {
        this.params = parameters;
        this.contentPart = new ReactPart(
            this.body,
            this.api,
            this.parent.addPortal,
            this.bodyComponent,
            this.params
        );
        // this.headerPart = new ReactPart(
        //     this.header,
        //     this.api,
        //     this.parent.addPortal,
        //     this.bodyComponent,
        //     this.params
        // );
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
        super.dispose();
        this.headerPart.dispose();
        this.contentPart.dispose();
        this.api.dispose();
    }
}
