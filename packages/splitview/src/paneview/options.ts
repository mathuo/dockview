import { FrameworkFactory } from '../types';
import { IPaneBodyPart, IPaneHeaderPart } from './paneview';

export interface PaneviewComponentOptions {
    components?: {
        [componentName: string]: IPaneBodyPart;
    };
    frameworkComponents?: {
        [componentName: string]: any;
    };
    headerComponents?: {
        [componentName: string]: IPaneHeaderPart;
    };
    headerframeworkComponents?: {
        [componentName: string]: any;
    };
    frameworkWrapper?: {
        header: FrameworkFactory<IPaneHeaderPart>;
        body: FrameworkFactory<IPaneBodyPart>;
    };
}
