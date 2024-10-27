import React from 'react';
import { ReactPart, ReactPortalStore } from '../react';
import {
    DockviewEmitter,
    DockviewEvent,
    PanelUpdateEvent,
    IContentRenderer,
    GroupPanelPartInitParameters,
    IDockviewPanelProps,
} from 'dockview-core';

export class ReactPanelContentPart implements IContentRenderer {
    private readonly _element: HTMLElement;
    private part?: ReactPart<IDockviewPanelProps>;

    private readonly _onDidFocus = new DockviewEmitter<void>();
    readonly onDidFocus: DockviewEvent<void> = this._onDidFocus.event;

    private readonly _onDidBlur = new DockviewEmitter<void>();
    readonly onDidBlur: DockviewEvent<void> = this._onDidBlur.event;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        public readonly id: string,
        private readonly component: React.FunctionComponent<IDockviewPanelProps>,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        this._element = document.createElement('div');
        this._element.className = 'dockview-react-part';
        this._element.style.height = '100%';
        this._element.style.width = '100%';
    }

    focus(): void {
        // TODO
    }

    public init(parameters: GroupPanelPartInitParameters): void {
        this.part = new ReactPart(
            this.element,
            this.reactPortalStore,
            this.component,
            {
                params: parameters.params,
                api: parameters.api,
                containerApi: parameters.containerApi,
            }
        );
    }

    public update(event: PanelUpdateEvent) {
        this.part?.update({ params: event.params });
    }

    public layout(_width: number, _height: number): void {
        // noop
    }

    public dispose(): void {
        this._onDidFocus.dispose();
        this._onDidBlur.dispose();
        this.part?.dispose();
    }
}
