import * as React from 'react';
import {
    IContentRenderer,
    GroupPanelContentPartInitParameters,
} from '../../groupview/types';
import { ReactPart, ReactPortalStore } from '../react';
import { IDockviewPanelProps } from '../dockview/dockview';
import { PanelUpdateEvent } from '../../panel/types';
import { DockviewPanelApi } from '../../api/groupPanelApi';
import { DockviewApi } from '../../api/component.api';
import { GroupPanel } from '../../groupview/groupviewPanel';
import { Emitter, Event } from '../../events';
import { WrappedTab } from '../../dockview/components/tab/defaultTab';

export interface IGroupPanelActionbarProps {
    api: DockviewPanelApi;
    containerApi: DockviewApi;
}

export interface ReactContentPartContext {
    api: DockviewPanelApi;
    containerApi: DockviewApi;
    actionsPortalElement: HTMLElement;
    tabPortalElement: WrappedTab;
}

export class ReactPanelContentPart implements IContentRenderer {
    private _element: HTMLElement;
    private part?: ReactPart<IDockviewPanelProps>;
    //
    private _actionsElement: HTMLElement;
    private actionsPart?: ReactPart<any>;
    private _group: GroupPanel | undefined;

    private readonly _onDidFocus = new Emitter<void>();
    readonly onDidFocus: Event<void> = this._onDidFocus.event;

    private readonly _onDidBlur = new Emitter<void>();
    readonly onDidBlur: Event<void> = this._onDidBlur.event;

    get element(): HTMLElement {
        return this._element;
    }

    get actions(): HTMLElement {
        return this._actionsElement;
    }

    constructor(
        public readonly id: string,
        private readonly component: React.FunctionComponent<IDockviewPanelProps>,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        this._element = document.createElement('div');
        this._element.className = 'dockview-react-part';

        this._actionsElement = document.createElement('div');
        this._actionsElement.className = 'dockview-react-part';
    }

    focus() {
        // TODO
    }

    public init(parameters: GroupPanelContentPartInitParameters): void {
        const context: ReactContentPartContext = {
            api: parameters.api,
            containerApi: parameters.containerApi,
            actionsPortalElement: this._actionsElement,
            tabPortalElement: parameters.tab,
        };

        this.part = new ReactPart(
            this.element,
            this.reactPortalStore,
            this.component,
            {
                params: parameters.params,
                api: parameters.api,
                containerApi: parameters.containerApi,
            },
            context
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

    public close(): Promise<boolean> {
        return Promise.resolve(true);
    }

    public dispose() {
        this._onDidFocus.dispose();
        this._onDidBlur.dispose();
        this.part?.dispose();
        this.actionsPart?.dispose();
    }
}
