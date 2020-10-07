import * as React from 'react';
import { PanelUpdateEvent } from '../../panel/types';
import {
    IPaneBodyPart,
    PanePanelComponentInitParameter,
} from '../../paneview/paneview';
import { ReactPortalStore } from '../dockview/dockview';
import { ReactPart } from '../react';
import { IPaneviewPanelProps } from './paneview';

export class PanelBody implements IPaneBodyPart {
    private _element: HTMLElement;
    private part?: ReactPart<IPaneviewPanelProps>;

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

    public init(parameters: PanePanelComponentInitParameter): void {
        this.part = new ReactPart(
            this.element,
            this.reactPortalStore,
            this.component,
            {
                ...parameters.params,
                api: parameters.api,
                title: parameters.title,
                containerApi: parameters.containerApi,
            }
        );
    }

    public toJSON() {
        return {
            id: this.id,
        };
    }

    public update(params: PanelUpdateEvent) {
        this.part?.update(params.params);
    }

    public dispose() {
        this.part?.dispose();
    }
}

export class PanelHeader implements IPaneBodyPart {
    private _element: HTMLElement;
    private part?: ReactPart<IPaneviewPanelProps>;

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

    public init(parameters: PanePanelComponentInitParameter): void {
        this.part = new ReactPart(
            this.element,
            this.reactPortalStore,
            this.component,
            {
                ...parameters.params,
                api: parameters.api,
                title: parameters.title,
                containerApi: parameters.containerApi,
            }
        );
    }

    public toJSON() {
        return {
            id: this.id,
        };
    }

    public update(params: PanelUpdateEvent) {
        this.part?.update(params.params);
    }

    public dispose() {
        this.part?.dispose();
    }
}
