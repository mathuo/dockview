import { ISerializableView } from '../splitview/options';
import { FrameworkFactory } from '../types';

export interface PaneviewComponentOptions {
    components?: {
        [componentName: string]: ISerializableView;
    };
    frameworkComponents?: {
        [componentName: string]: any;
    };
    frameworkWrapper?: FrameworkFactory<ISerializableView>;
}
