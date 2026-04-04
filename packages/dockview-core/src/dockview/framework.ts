import { DockviewApi } from '../api/component.api';
import { DockviewGroupPanelApi } from '../api/dockviewGroupPanelApi';
import { DockviewPanelApi } from '../api/dockviewPanelApi';
import { PanelParameters } from '../framwork';
import { DockviewGroupPanel, IDockviewGroupPanel } from './dockviewGroupPanel';
import { DockviewGroupLocation } from './dockviewGroupPanelModel';
import { IDockviewPanel } from './dockviewPanel';
import { DockviewHeaderPosition } from './options';
import { ITabGroup } from './tabGroup';

export interface IGroupPanelBaseProps<
    T extends { [index: string]: any } = any,
> extends PanelParameters<T> {
    api: DockviewPanelApi;
    containerApi: DockviewApi;
}

export type TabLocation = 'header' | 'headerOverflow';

export type IDockviewPanelHeaderProps<
    T extends { [index: string]: any } = any,
> = IGroupPanelBaseProps<T> & { tabLocation: TabLocation };

export type IDockviewPanelProps<T extends { [index: string]: any } = any> =
    IGroupPanelBaseProps<T>;

export interface IDockviewHeaderActionsProps {
    api: DockviewGroupPanelApi;
    containerApi: DockviewApi;
    panels: IDockviewPanel[];
    activePanel: IDockviewPanel | undefined;
    isGroupActive: boolean;
    group: DockviewGroupPanel;
    headerPosition: DockviewHeaderPosition;
    location: DockviewGroupLocation;
}

export interface IGroupHeaderProps {
    api: DockviewGroupPanelApi;
    containerApi: DockviewApi;
    group: IDockviewGroupPanel;
}

export interface IWatermarkPanelProps {
    containerApi: DockviewApi;
    group?: IDockviewGroupPanel;
}

export interface DockviewReadyEvent {
    api: DockviewApi;
}

export interface ITabGroupChipRenderer {
    readonly element: HTMLElement;
    init(params: { tabGroup: ITabGroup; api: DockviewApi }): void;
    update?(params: { tabGroup: ITabGroup }): void;
    dispose(): void;
}
