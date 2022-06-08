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
}

export interface PanelOptions {
    component: string;
    tabComponent?: string;
    params?: { [key: string]: any };
    id: string;
    title?: string;
    suppressClosable?: boolean;
}

export interface AddPanelOptions
    extends Omit<PanelOptions, 'component' | 'tabComponent'> {
    component: string;
    tabComponent?: string;
    position?: {
        direction?: Direction;
        referencePanel?: string;
    };
}

export interface AddGroupOptions {
    direction?: 'left' | 'right' | 'above' | 'below';
    referencePanel: string;
}

export interface MovementOptions2 {
    group?: IGridView;
}

export interface MovementOptions extends MovementOptions2 {
    includePanel?: boolean;
    group?: GroupPanel;
}
