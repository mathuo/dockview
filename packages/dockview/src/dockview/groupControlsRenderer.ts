import * as React from 'react';
import { ReactPart, ReactPortalStore } from '../react';
import {
    IDockviewPanel,
    CompositeDisposable,
    MutableDisposable,
    DockviewApi,
    GroupPanel,
    GroupviewPanelApi,
    PanelUpdateEvent,
} from 'dockview-core';

export interface IDockviewGroupControlProps {
    api: GroupviewPanelApi;
    containerApi: DockviewApi;
    panels: IDockviewPanel[];
    activePanel: IDockviewPanel | undefined;
    isGroupActive: boolean;
}

export class ReactGroupControlsRendererPart {
    private mutableDisposable = new MutableDisposable();
    private _element: HTMLElement;
    private _part?: ReactPart<IDockviewGroupControlProps>;

    get element(): HTMLElement {
        return this._element;
    }

    get part(): ReactPart<IDockviewGroupControlProps> | undefined {
        return this._part;
    }

    get group(): GroupPanel {
        return this._group;
    }

    constructor(
        private readonly component: React.FunctionComponent<IDockviewGroupControlProps>,
        private readonly reactPortalStore: ReactPortalStore,
        private readonly _group: GroupPanel
    ) {
        this._element = document.createElement('div');
        this._element.className = 'dockview-react-part';
    }

    focus() {
        // TODO
    }

    public init(parameters: {
        containerApi: DockviewApi;
        api: GroupviewPanelApi;
    }): void {
        this.mutableDisposable.value = new CompositeDisposable(
            this._group.model.onDidAddPanel(() => {
                this.updatePanels();
            }),
            this._group.model.onDidRemovePanel(() => {
                this.updatePanels();
            }),
            this._group.model.onDidActivePanelChange(() => {
                this.updateActivePanel();
            }),
            parameters.api.onDidActiveChange(() => {
                this.updateGroupActive();
            })
        );

        this._part = new ReactPart(
            this.element,
            this.reactPortalStore,
            this.component,
            {
                api: parameters.api,
                containerApi: parameters.containerApi,
                panels: this._group.model.panels,
                activePanel: this._group.model.activePanel,
                isGroupActive: this._group.api.isActive,
            }
        );
    }

    public update(event: PanelUpdateEvent) {
        this._part?.update(event.params);
    }

    public dispose() {
        this.mutableDisposable.dispose();
        this._part?.dispose();
    }

    private updatePanels() {
        this.update({ params: { panels: this._group.model.panels } });
    }

    private updateActivePanel() {
        this.update({
            params: {
                activePanel: this._group.model.activePanel,
            },
        });
    }

    private updateGroupActive() {
        this.update({
            params: {
                isGroupActive: this._group.api.isActive,
            },
        });
    }
}
