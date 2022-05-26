import { FrameworkFactory } from '../types';
import { IPaneBodyPart, IPaneHeaderPart, PaneviewPanel } from './paneviewPanel';

export interface PaneviewComponentOptions {
    components?: {
        [componentName: string]: {
            new (id: string, componentName: string): PaneviewPanel;
        };
    };
    frameworkComponents?: {
        [componentName: string]: any;
    };
    headerComponents?: {
        [componentName: string]: {
            new (id: string, componentName: string): PaneviewPanel;
        };
    };
    headerframeworkComponents?: {
        [componentName: string]: any;
    };
    frameworkWrapper?: {
        header: FrameworkFactory<IPaneHeaderPart>;
        body: FrameworkFactory<IPaneBodyPart>;
    };
    disableDnd?: boolean;
}
