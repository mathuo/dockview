import { CreateComponentOptions } from '../dockview/options';
import { PaneviewDndOverlayEvent } from './paneviewComponent';
import { IPanePart } from './paneviewPanel';

export interface PaneviewOptions {
    disableAutoResizing?: boolean;
    disableDnd?: boolean;
    showDndOverlay?: (event: PaneviewDndOverlayEvent) => boolean;
    className?: string;
}

export interface PaneviewFrameworkOptions {
    createComponent: (options: CreateComponentOptions) => IPanePart;
    createHeaderComponent?: (
        options: CreateComponentOptions
    ) => IPanePart | undefined;
}

export type PaneviewComponentOptions = PaneviewOptions &
    PaneviewFrameworkOptions;

export const PROPERTY_KEYS_PANEVIEW: (keyof PaneviewOptions)[] = (() => {
    /**
     * by readong the keys from an empty value object TypeScript will error
     * when we add or remove new properties to `DockviewOptions`
     */
    const properties: Record<keyof PaneviewOptions, undefined> = {
        disableAutoResizing: undefined,
        disableDnd: undefined,
        showDndOverlay: undefined,
        className: undefined,
    };

    return Object.keys(properties) as (keyof PaneviewOptions)[];
})();
