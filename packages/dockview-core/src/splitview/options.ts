import { PanelInitParameters } from '../panel/types';
import { SplitViewOptions, LayoutPriority } from './splitview';
import { SplitviewPanel } from './splitviewPanel';
import { SplitviewComponent } from './splitviewComponent';
import {
    ComponentConstructor,
    FrameworkFactory,
} from '../panel/componentFactory';

export interface PanelViewInitParameters extends PanelInitParameters {
    minimumSize?: number;
    maximumSize?: number;
    snap?: boolean;
    priority?: LayoutPriority;
    accessor: SplitviewComponent;
}

export interface SplitviewComponentOptions extends SplitViewOptions {
    disableAutoResizing?: boolean;
    components?: {
        [componentName: string]: ComponentConstructor<SplitviewPanel>;
    };
    frameworkComponents?: {
        [componentName: string]: any;
    };
    frameworkWrapper?: FrameworkFactory<SplitviewPanel>;
    className?: string;
}
