import { IPanel, PanelInitParameters } from '../panel/types';
import { IView, SplitViewOptions, LayoutPriority } from './splitview';
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

export interface ISerializableView extends IView, IPanel {
    init: (params: PanelViewInitParameters) => void;
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
    parentElement?: HTMLElement;
}
