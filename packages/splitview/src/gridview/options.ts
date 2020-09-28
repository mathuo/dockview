import { GridPanelView } from './gridPanelView';
import { Orientation } from '../splitview/core/splitview';
import { FrameworkFactory } from '../types';

export interface GridComponentOptions {
    orientation: Orientation;
    components?: {
        [componentName: string]: GridPanelView;
    };
    frameworkComponents?: {
        [componentName: string]: any;
    };
    frameworkComponentFactory: FrameworkFactory<GridPanelView>;
    tabHeight?: number;
}
