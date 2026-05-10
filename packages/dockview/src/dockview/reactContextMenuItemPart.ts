import React from 'react';
import { ReactPart, ReactPortalStore } from '../react';
import {
    IContextMenuItemRenderer,
    IContextMenuItemComponentProps,
} from 'dockview-core';

export class ReactContextMenuItemPart implements IContextMenuItemRenderer {
    private readonly _element: HTMLElement;
    private part?: ReactPart<IContextMenuItemComponentProps>;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        public readonly id: string,
        private readonly component: React.FunctionComponent<IContextMenuItemComponentProps>,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        this._element = document.createElement('div');
        this._element.className = 'dv-react-part';
        this._element.style.height = '100%';
        this._element.style.width = '100%';
    }

    public init(props: IContextMenuItemComponentProps): void {
        this.part = new ReactPart(
            this._element,
            this.reactPortalStore,
            this.component,
            props
        );
    }

    public dispose(): void {
        this.part?.dispose();
    }
}
