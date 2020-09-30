import * as React from 'react';
import {
    PanelContentPart,
    ClosePanelResult,
    GroupPanelPartInitParameters,
} from '../../groupview/panel/parts';
import { ReactPart } from '../react';
import { IGroupPanelProps, ReactPortalStore } from '../dockview/dockview';
import { PanelUpdateEvent } from '../../panel/types';

export class ReactPanelContentPart implements PanelContentPart {
    private _element: HTMLElement;
    private part: ReactPart<IGroupPanelProps>;

    get element() {
        return this._element;
    }

    constructor(
        public readonly id: string,
        private readonly component: React.FunctionComponent<IGroupPanelProps>,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        this._element = document.createElement('div');
    }

    public init(parameters: GroupPanelPartInitParameters): void {
        this.part = new ReactPart(
            this.element,
            parameters.api,
            this.reactPortalStore,
            this.component,
            parameters.params
        );
    }

    public toJSON() {
        return {
            id: this.id,
        };
    }

    public update(params: PanelUpdateEvent) {
        this.part.update(params.params);
    }

    public setVisible(isPanelVisible: boolean, isGroupVisible: boolean): void {
        // noop - retrieval from api
    }

    public layout(width: number, height: number): void {}

    public close(): Promise<ClosePanelResult> {
        return Promise.resolve(ClosePanelResult.CLOSE);
    }

    public dispose() {
        this.part?.dispose();
    }
}
