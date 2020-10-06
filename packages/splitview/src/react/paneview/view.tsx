import * as React from 'react';
import { PanelApi } from '../../api/panelApi';
import { PanelUpdateEvent } from '../../panel/types';
import { IPaneBodyPart, PanePanelInitParameter } from '../../paneview/paneview';
import { ReactPortalStore } from '../dockview/dockview';
import { ReactPart } from '../react';
import { IPaneviewPanelProps } from './paneview';

export class PanelBody implements IPaneBodyPart {
    private _element: HTMLElement;
    private part: ReactPart<IPaneviewPanelProps>;

    get element() {
        return this._element;
    }

    constructor(
        public readonly id: string,
        private readonly component: React.FunctionComponent<
            IPaneviewPanelProps
        >,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        this._element = document.createElement('div');
    }

    public init(parameters: PanePanelInitParameter & { api: PanelApi }): void {
        this.part = new ReactPart(
            this.element,
            parameters.api,
            this.reactPortalStore,
            this.component,
            { ...parameters.params, title: parameters.title }
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

    public dispose() {
        this.part?.dispose();
    }
}

export class PanelHeader implements IPaneBodyPart {
    private _element: HTMLElement;
    private part: ReactPart<IPaneviewPanelProps>;

    get element() {
        return this._element;
    }

    constructor(
        public readonly id: string,
        private readonly component: React.FunctionComponent<
            IPaneviewPanelProps
        >,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        this._element = document.createElement('div');
    }

    public init(parameters: PanePanelInitParameter & { api: PanelApi }): void {
        this.part = new ReactPart(
            this.element,
            parameters.api,
            this.reactPortalStore,
            this.component,
            { ...parameters.params, title: parameters.title }
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

    public dispose() {
        this.part?.dispose();
    }
}
