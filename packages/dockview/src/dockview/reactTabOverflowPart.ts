import React from 'react';
import {
    ITabOverflowRenderer,
    ITabOverflowTriggerRenderer,
    TabOverflowEvent,
    DockviewGroupPanel,
} from 'dockview-core';
import { ReactPart, ReactPortalStore } from '../react';
import { ITabOverflowProps, ITabOverflowTriggerProps } from '../types';

export class ReactTabOverflowPart implements ITabOverflowRenderer {
    private _element: HTMLElement;
    private part?: ReactPart<ITabOverflowProps>;

    constructor(
        private readonly component: React.FunctionComponent<ITabOverflowProps>,
        private readonly reactPortalStore: ReactPortalStore,
        private readonly group: DockviewGroupPanel
    ) {
        this._element = document.createElement('div');
        this._element.style.height = '100%';
        this._element.className = 'dv-react-tab-overflow-part';
    }

    get element(): HTMLElement {
        return this._element;
    }

    update(event: TabOverflowEvent): void {
        if (!this.part) {
            // Initialize the React part with initial event data
            this.part = new ReactPart(
                this.element,
                this.reactPortalStore,
                this.component,
                { event }
            );
        } else {
            // Update the existing React part with new event data
            this.part.update({ event });
        }
    }

    dispose(): void {
        this.part?.dispose();
    }
}

export class ReactTabOverflowTriggerPart implements ITabOverflowTriggerRenderer {
    private _element: HTMLElement;
    private part?: ReactPart<ITabOverflowTriggerProps>;

    constructor(
        private readonly component: React.FunctionComponent<ITabOverflowTriggerProps>,
        private readonly reactPortalStore: ReactPortalStore,
        private readonly group: DockviewGroupPanel
    ) {
        this._element = document.createElement('div');
        this._element.style.height = '100%';
        this._element.className = 'dv-react-tab-overflow-trigger-part';
    }

    get element(): HTMLElement {
        return this._element;
    }

    update(event: TabOverflowEvent): void {
        if (!this.part) {
            // Initialize the React part with initial event data
            this.part = new ReactPart(
                this.element,
                this.reactPortalStore,
                this.component,
                { event }
            );
        } else {
            // Update the existing React part with new event data
            this.part.update({ event });
        }
    }

    dispose(): void {
        this.part?.dispose();
    }
}