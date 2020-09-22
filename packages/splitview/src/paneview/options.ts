import { FrameworkFactory } from '../types';
import { Pane } from './paneview';

export interface PaneviewComponentOptions {
    components?: {
        [componentName: string]: Pane;
    };
    frameworkComponents?: {
        [componentName: string]: any;
    };
    frameworkWrapper?: FrameworkFactory<Pane>;
}
