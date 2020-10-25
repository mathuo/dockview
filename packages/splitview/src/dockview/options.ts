import { DockviewApi } from '../api/component.api';
import { Direction } from '../gridview/baseComponentGridview';
import { IGridView } from '../gridview/gridview';
import { IGroupview } from '../groupview/groupview';
import { IGroupPanel } from '../groupview/groupviewPanel';
import {
    PanelContentPart,
    PanelContentPartConstructor,
    PanelHeaderPart,
    PanelHeaderPartConstructor,
    WatermarkConstructor,
    WatermarkPart,
} from '../groupview/types';
import { ISplitviewStyles, Orientation } from '../splitview/core/splitview';
import { FrameworkFactory } from '../types';

export interface GroupPanelFrameworkComponentFactory {
    content: FrameworkFactory<PanelContentPart>;
    tab: FrameworkFactory<PanelHeaderPart>;
    watermark: FrameworkFactory<WatermarkPart>;
}

export interface TabContextMenuEvent {
    event: MouseEvent;
    api: DockviewApi;
    panel: IGroupPanel;
}

export interface DockviewOptions {
    tabComponents?: {
        [componentName: string]: PanelHeaderPartConstructor;
    };
    components?: {
        [componentName: string]: PanelContentPartConstructor;
    };
    frameworkTabComponents?: {
        [componentName: string]: any;
    };
    frameworkComponents?: {
        [componentName: string]: any;
    };
    watermarkComponent?: WatermarkConstructor;
    watermarkFrameworkComponent?: any;
    frameworkComponentFactory: GroupPanelFrameworkComponentFactory;
    tabHeight?: number;
    debug?: boolean;
    enableExternalDragEvents?: boolean;
    orientation?: Orientation;
    styles?: ISplitviewStyles;
}

export interface PanelOptions {
    componentName: string;
    tabComponentName?: string;
    params?: { [key: string]: any };
    id: string;
    title?: string;
    suppressClosable?: boolean;
}

export interface AddPanelOptions
    extends Omit<PanelOptions, 'componentName' | 'tabComponentName'> {
    componentName: string | PanelContentPartConstructor;
    tabComponentName?: string | PanelHeaderPartConstructor;
    position?: {
        direction?: Direction;
        referencePanel: string;
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
    group?: IGroupview;
}
