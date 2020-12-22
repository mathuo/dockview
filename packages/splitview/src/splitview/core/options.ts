import { IPanel, PanelInitParameters } from '../../panel/types';
import {
    IView,
    SplitViewOptions,
    LayoutPriority,
    Orientation,
} from './splitview';
import { Constructor, FrameworkFactory } from '../../types';
import { SplitviewPanel } from '../splitviewPanel';
import { SplitviewApi } from '../../api/component.api';

export interface PanelViewInitParameters extends PanelInitParameters {
    minimumSize?: number;
    maximumSize?: number;
    snap?: boolean;
    priority?: LayoutPriority;
    containerApi: SplitviewApi;
}

export interface ISerializableView extends IView, IPanel {
    init: (params: PanelViewInitParameters) => void;
}

export interface SplitPanelOptions extends SplitViewOptions {
    components?: {
        [componentName: string]: {
            new (id: string, componentName: string): SplitviewPanel;
        };
    };
    frameworkComponents?: {
        [componentName: string]: any;
    };
    frameworkWrapper?: FrameworkFactory<SplitviewPanel>;
}
