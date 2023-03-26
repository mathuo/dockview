import { GridviewPanel } from './gridviewPanel';
import { ISplitviewStyles, Orientation } from '../splitview/splitview';
import { FrameworkFactory } from '../panel/componentFactory';

export interface GridviewComponentOptions {
    proportionalLayout: boolean;
    orientation: Orientation;
    components?: {
        [componentName: string]: {
            new (id: string, componentName: string): GridviewPanel;
        };
    };
    frameworkComponents?: {
        [componentName: string]: any;
    };
    frameworkComponentFactory?: FrameworkFactory<GridviewPanel>;
    tabHeight?: number;
    styles?: ISplitviewStyles;
    parentElement?: HTMLElement;
}
