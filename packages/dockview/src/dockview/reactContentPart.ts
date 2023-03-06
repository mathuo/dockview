import * as React from 'react';
import { ReactPart, ReactPortalStore } from '../react';
import { IDockviewPanelProps } from '../dockview/dockview';
import {
    DockviewEmitter,
    Event,
    GroupPanel,
    PanelUpdateEvent,
    IContentRenderer,
    GroupPanelContentPartInitParameters,
} from 'dockview-core';

export class ReactPanelContentPart implements IContentRenderer {
    private _element: HTMLElement;
    private part?: ReactPart<IDockviewPanelProps>;
    //
    private _group: GroupPanel | undefined;

    private readonly _onDidFocus = new DockviewEmitter<void>();
    readonly onDidFocus: Event<void> = this._onDidFocus.event;

    private readonly _onDidBlur = new DockviewEmitter<void>();
    readonly onDidBlur: Event<void> = this._onDidBlur.event;

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
    }

    focus() {
        // TODO
    }

    public init(parameters: GroupPanelContentPartInitParameters): void {
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

    public toJSON() {
        return {
            id: this.id,
        };
    }

    public update(event: PanelUpdateEvent) {
        this.part?.update(event.params);
    }

    public updateParentGroup(
        group: GroupPanel,
        _isPanelVisible: boolean
    ): void {
        this._group = group;
    }

    public layout(_width: number, _height: number): void {
        // noop
    }

    public dispose() {
        this._onDidFocus.dispose();
        this._onDidBlur.dispose();
        this.part?.dispose();
    }
}
