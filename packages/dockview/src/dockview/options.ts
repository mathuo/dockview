import { DockviewApi } from '../api/component.api';
import { Direction } from '../gridview/baseComponentGridview';
import { IGridView } from '../gridview/gridview';
import { IDockviewPanel } from '../groupview/groupPanel';
import {
    IContentRenderer,
    ITabRenderer,
    WatermarkConstructor,
    IWatermarkRenderer,
} from '../groupview/types';
import { GroupPanel } from '../groupview/groupviewPanel';
import { ISplitviewStyles, Orientation } from '../splitview/core/splitview';
import { FrameworkFactory } from '../types';
import { DockviewDropTargets } from '../groupview/dnd';
import { PanelTransfer } from '../dnd/dataTransfer';
import { IGroupControlRenderer } from '../react/dockview/groupControlsRenderer';

export interface GroupPanelFrameworkComponentFactory {
    content: FrameworkFactory<IContentRenderer>;
    tab: FrameworkFactory<ITabRenderer>;
    watermark: FrameworkFactory<IWatermarkRenderer>;
}

export interface TabContextMenuEvent {
    event: MouseEvent;
    api: DockviewApi;
    panel: IDockviewPanel;
}

export interface DockviewRenderFunctions {
    tabComponents?: {
        [componentName: string]: {
            new (id: string, component: string): ITabRenderer;
        };
    };
    components?: {
        [componentName: string]: {
            new (id: string, component: string): IContentRenderer;
        };
    };
    frameworkTabComponents?: {
        [componentName: string]: any;
    };
    frameworkComponents?: {
        [componentName: string]: any;
    };
}

export interface ViewFactoryData {
    content: string;
    tab?: string;
}

export interface DockviewDndOverlayEvent {
    nativeEvent: DragEvent;
    target: DockviewDropTargets;
    group: GroupPanel;
    getData: () => PanelTransfer | undefined;
}

export interface DockviewComponentOptions extends DockviewRenderFunctions {
    watermarkComponent?: WatermarkConstructor;
    watermarkFrameworkComponent?: any;
    frameworkComponentFactory?: GroupPanelFrameworkComponentFactory;
    tabHeight?: number;
    orientation?: Orientation;
    styles?: ISplitviewStyles;
    defaultTabComponent?: string;
    showDndOverlay?: (event: DockviewDndOverlayEvent) => boolean;
    createGroupControlElement?: (group: GroupPanel) => IGroupControlRenderer;
    singleTabMode?: 'fullwidth' | 'default';
}

export interface PanelOptions {
    component: string;
    tabComponent?: string;
    params?: { [key: string]: any };
    id: string;
    title?: string;
}

type RelativePanel = {
    direction?: Direction;
    referencePanel: string | IDockviewPanel;
};

type RelativeGroup = {
    direction?: Direction;
    referenceGroup: string | GroupPanel;
};

type AbsolutePosition = {
    direction: Omit<Direction, 'within'>;
};

export type AddPanelPositionOptions =
    | RelativePanel
    | RelativeGroup
    | AbsolutePosition;

export function isPanelOptionsWithPanel(
    data: AddPanelPositionOptions
): data is RelativePanel {
    if ((data as RelativePanel).referencePanel) {
        return true;
    }
    return false;
}

export function isPanelOptionsWithGroup(
    data: AddPanelPositionOptions
): data is RelativeGroup {
    if ((data as RelativeGroup).referenceGroup) {
        return true;
    }
    return false;
}

export interface AddPanelOptions
    extends Omit<PanelOptions, 'component' | 'tabComponent'> {
    component: string;
    tabComponent?: string;
    position?: AddPanelPositionOptions;
}

type AddGroupOptionsWithPanel = {
    referencePanel: string | IDockviewPanel;
    direction?: Omit<Direction, 'within'>;
};

type AddGroupOptionsWithGroup = {
    referenceGroup: string | GroupPanel;
    direction?: Omit<Direction, 'within'>;
};

export type AddGroupOptions =
    | AddGroupOptionsWithGroup
    | AddGroupOptionsWithPanel
    | AbsolutePosition;

export function isGroupOptionsWithPanel(
    data: AddGroupOptions
): data is AddGroupOptionsWithPanel {
    if ((data as AddGroupOptionsWithPanel).referencePanel) {
        return true;
    }
    return false;
}

export function isGroupOptionsWithGroup(
    data: AddGroupOptions
): data is AddGroupOptionsWithGroup {
    if ((data as AddGroupOptionsWithGroup).referenceGroup) {
        return true;
    }
    return false;
}

export interface MovementOptions2 {
    group?: IGridView;
}

export interface MovementOptions extends MovementOptions2 {
    includePanel?: boolean;
    group?: GroupPanel;
}
