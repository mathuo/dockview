import { IDisposable } from '../lifecycle';
import { IDockviewComponent } from '../dockview/dockviewComponent';
import { IDockviewPanelApi } from '../api/groupPanelApi';
import { PanelInitParameters, IPanel } from '../panel/types';
import { DockviewApi } from '../api/component.api';
import { GroupviewPanel } from './v2/groupviewPanel';
import { Event } from '../events';

export interface HeaderPartInitParameters {
    title: string;
    suppressClosable?: boolean;
}

export interface GroupPanelPartInitParameters
    extends PanelInitParameters,
        HeaderPartInitParameters {
    api: IDockviewPanelApi;
    containerApi: DockviewApi;
}

export interface WatermarkPart extends IDisposable {
    readonly id: string;
    init: (params: GroupPanelPartInitParameters) => void;
    updateParentGroup(group: GroupviewPanel, visible: boolean): void;
    element: HTMLElement;
}

export interface ITabRenderer extends IPanel {
    readonly element: HTMLElement;
    init(parameters: GroupPanelPartInitParameters): void;
    updateParentGroup(group: GroupviewPanel, isPanelVisible: boolean): void;
}

export interface IActionsRenderer extends IDisposable {
    readonly element: HTMLElement;
}

export interface IContentRenderer extends IPanel {
    readonly element: HTMLElement;
    readonly actions?: HTMLElement;
    readonly onDidFocus?: Event<void>;
    readonly onDidBlur?: Event<void>;
    updateParentGroup(group: GroupviewPanel, isPanelVisible: boolean): void;
    init(parameters: GroupPanelPartInitParameters): void;
    close?(): Promise<boolean>;
}

// watermark component

export interface WatermarkPartInitParameters {
    accessor: IDockviewComponent;
}

// constructors

export interface PanelHeaderPartConstructor {
    new (): ITabRenderer;
}
export interface PanelContentPartConstructor {
    new (): IContentRenderer;
}

export interface WatermarkConstructor {
    new (): WatermarkPart;
}
