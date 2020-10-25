import { IDisposable } from '../lifecycle';
import { IGroupview } from './groupview';
import { IComponentDockview } from '../dockview';
import { IGroupPanelApi } from '../api/groupPanelApi';
import { PanelInitParameters, IPanel } from '../panel/types';
import { DockviewApi } from '../api/component.api';

export interface HeaderPartInitParameters {
    title: string;
    suppressClosable?: boolean;
}

export interface GroupPanelPartInitParameters
    extends PanelInitParameters,
        HeaderPartInitParameters {
    api: IGroupPanelApi;
    containerApi: DockviewApi;
}

export interface PanelHeaderPart extends IPanel {
    element: HTMLElement;
    init(parameters: GroupPanelPartInitParameters): void;
    setVisible(isPanelVisible: boolean, group: IGroupview): void;
}

export interface PanelContentPart extends IPanel {
    element: HTMLElement;
    actions?: HTMLElement;
    setVisible(isPanelVisible: boolean, group: IGroupview): void;
    init(parameters: GroupPanelPartInitParameters): void;
    close?(): Promise<boolean>;
}

// watermark component

export interface WatermarkPartInitParameters {
    accessor: IComponentDockview;
}

export interface WatermarkPart extends IDisposable {
    init: (params: GroupPanelPartInitParameters) => void;
    setVisible(visible: boolean, group: IGroupview): void;
    element: HTMLElement;
}

// constructors

export interface PanelHeaderPartConstructor {
    new (): PanelHeaderPart;
}
export interface PanelContentPartConstructor {
    new (): PanelContentPart;
}

export interface WatermarkConstructor {
    new (): WatermarkPart;
}
