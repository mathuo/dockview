import {
    ComponentConstructor,
    FrameworkFactory,
} from '../panel/componentFactory';
import { PaneviewDndOverlayEvent } from './paneviewComponent';
import { IPaneBodyPart, IPaneHeaderPart, PaneviewPanel } from './paneviewPanel';

export interface PaneviewComponentOptions {
    disableAutoResizing?: boolean;
    components?: {
        [componentName: string]: ComponentConstructor<PaneviewPanel>;
    };
    frameworkComponents?: {
        [componentName: string]: any;
    };
    headerComponents?: {
        [componentName: string]: ComponentConstructor<PaneviewPanel>;
    };
    headerframeworkComponents?: {
        [componentName: string]: any;
    };
    frameworkWrapper?: {
        header: FrameworkFactory<IPaneHeaderPart>;
        body: FrameworkFactory<IPaneBodyPart>;
    };
    disableDnd?: boolean;
    showDndOverlay?: (event: PaneviewDndOverlayEvent) => boolean;
    className?: string;
}
