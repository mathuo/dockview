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
    location?: DockviewGroupLocation;
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

export interface TabGroupChipRendererParams {
    tabGroup: ITabGroup;
    api: DockviewApi;
    /**
     * The tab group's resolved accent colour as a CSS expression (e.g.
     * `"var(--dv-tab-group-color-blue)"` or `"#ff8800"`), or `undefined`
     * if no colour is set. Custom renderers may honour or ignore this.
     */
    accent: string | undefined;
    /**
     * Arbitrary parameters supplied when the tab group was created or
     * updated via `setComponentParams`. Pass-through; not interpreted by
     * core. Use this to drive a fully custom chip renderer without
     * abusing the `color` field.
     */
    componentParams: Record<string, unknown> | undefined;
}

export interface ITabGroupChipRenderer {
    readonly element: HTMLElement;
    init(params: TabGroupChipRendererParams): void;
    update?(params: TabGroupChipRendererParams): void;
    dispose(): void;
}
