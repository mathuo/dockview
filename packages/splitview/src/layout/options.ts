import { IGridView } from '../gridview/gridview';
import { IGroupview } from '../groupview/groupview';
import {
    PanelContentPart,
    PanelContentPartConstructor,
    PanelHeaderPart,
    PanelHeaderPartConstructor,
    WatermarkConstructor,
} from '../groupview/panel/parts';
import { IGroupPanel } from '../groupview/panel/types';
import { Orientation } from '../splitview/splitview';
import { FrameworkFactory } from '../types';
import { IComponentGridview } from './componentGridview';
import { Api } from './layout';

export interface GroupPanelFrameworkComponentFactory {
    content: FrameworkFactory<PanelContentPart>;
    tab: FrameworkFactory<PanelHeaderPart>;
}

export interface TabContextMenuEvent {
    event: MouseEvent;
    api: Api;
    panel: IGroupPanel;
}

export interface GridComponentOptions {
    orientation: Orientation;
    components?: {
        [componentName: string]: IComponentGridview;
    };
    frameworkComponents?: {
        [componentName: string]: any;
    };
    frameworkComponentFactory: any;
    tabHeight?: number;
}

export interface LayoutOptions {
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
        direction?: 'left' | 'right' | 'above' | 'below' | 'within';
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
