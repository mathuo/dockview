import * as React from 'react';
import { PanelInitParameters } from '../../panel/types';
import { PanePanelApi } from '../../api/panePanelApi';
import { Pane } from '../../paneview/paneview';
import { ReactLayout } from '../dockview/dockview';
import { ReactPart } from '../react';

export interface PanePanelInitParameter extends PanelInitParameters {
    minimumBodySize?: number;
    maximumBodySize?: number;
    isExpanded?: boolean;
}

export class PaneReact extends Pane {
    private params: PanelInitParameters;
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
            minimumBodySize?: number;
            maximumBodySize?: number;
        }
    ) {
        super(options);

        this.api = new PanePanelApi(this);

        this.addDisposables(
            this.onDidChangeExpansionState((isExpanded) => {
                this.api._onDidExpansionChange.fire({ isExpanded });
            })
        );

        this.render();
    }

    init(parameters: PanePanelInitParameter): void {
        if (typeof parameters.minimumBodySize === 'number') {
            this.minimumBodySize = parameters.minimumBodySize;
        }
        if (typeof parameters.maximumBodySize === 'number') {
            this.maximumBodySize = parameters.maximumBodySize;
        }
        if (typeof parameters.isExpanded === 'boolean') {
            this.setExpanded(parameters.isExpanded);
        }

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
