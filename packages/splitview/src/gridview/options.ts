import { GridviewPanel } from './gridviewPanel';
import { Orientation } from '../splitview/core/splitview';
import { FrameworkFactory } from '../types';

export interface GridComponentOptions {
    orientation: Orientation;
    components?: {
        [componentName: string]: GridviewPanel;
    };
    frameworkComponents?: {
        [componentName: string]: any;
    };
    frameworkComponentFactory: FrameworkFactory<GridviewPanel>;
    tabHeight?: number;
}
