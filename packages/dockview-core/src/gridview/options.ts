import { GridviewPanel } from './gridviewPanel';
import { ISplitviewStyles, Orientation } from '../splitview/splitview';
import {
    ComponentConstructor,
    FrameworkFactory,
} from '../panel/componentFactory';

export interface GridviewComponentOptions {
    proportionalLayout: boolean;
    orientation: Orientation;
    components?: {
        [componentName: string]: ComponentConstructor<GridviewPanel>;
    };
    frameworkComponents?: {
        [componentName: string]: any;
    };
    frameworkComponentFactory?: FrameworkFactory<GridviewPanel>;
    styles?: ISplitviewStyles;
    parentElement?: HTMLElement;
}
