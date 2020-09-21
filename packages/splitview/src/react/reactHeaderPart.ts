import * as React from 'react';
import { PanelHeaderPart, PartInitParameters } from '../groupview/panel/parts';
import { ReactPart, IPanelProps } from './react';
import { ReactLayout } from './layout';

export class ReactPanelHeaderPart implements PanelHeaderPart {
    private _element: HTMLElement;
    private part: ReactPart;

    get element() {
        return this._element;
    }

    constructor(
        public readonly id: string,
        private readonly component: React.FunctionComponent<IPanelProps>,
        private readonly parent: ReactLayout
    ) {
        this._element = document.createElement('div');
    }

    public init(parameters: PartInitParameters): void {
        this.part = new ReactPart(
            this.element,
            parameters.api,
            this.parent.addPortal,
            this.component,
            parameters.params
        );
    }

    public toJSON() {
        return {
            id: this.id,
        };
    }

    public layout(height: string) {
        // noop - retrieval from api
    }

    public setVisible(isPanelVisible: boolean, isGroupVisible: boolean): void {
        // noop - retrieval from api
    }

    public dispose() {
        this.part?.dispose();
    }
}
