import { IDisposable } from '../lifecycle';
import { IDockviewComponent } from '../dockview/dockviewComponent';
import { DockviewPanelApi } from '../api/groupPanelApi';
import { PanelInitParameters, IPanel } from '../panel/types';
import { DockviewApi } from '../api/component.api';
import { GroupviewPanel } from './groupviewPanel';
import { Event } from '../events';
import { WrappedTab } from '../dockview/components/tab/defaultTab';

export interface HeaderPartInitParameters {
    title: string;
    suppressClosable?: boolean;
}

export interface GroupPanelPartInitParameters
    extends PanelInitParameters,
        HeaderPartInitParameters {
    api: DockviewPanelApi;
    containerApi: DockviewApi;
}

export interface GroupPanelContentPartInitParameters
    extends GroupPanelPartInitParameters {
    tab: WrappedTab;
}

export interface IWatermarkRenderer extends IPanel {
    readonly element: HTMLElement;
    init: (params: GroupPanelPartInitParameters) => void;
    updateParentGroup(group: GroupviewPanel, visible: boolean): void;
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
    init(parameters: GroupPanelContentPartInitParameters): void;
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
    new (): IWatermarkRenderer;
}
