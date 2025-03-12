import { PaneTransfer } from '../dnd/dataTransfer';
import { Position } from '../dnd/droptarget';
import { CreateComponentOptions } from '../dockview/options';
import { AcceptableEvent, IAcceptableEvent } from '../events';
import { IPanePart, IPaneviewPanel } from './paneviewPanel';

export interface PaneviewOptions {
    disableAutoResizing?: boolean;
    disableDnd?: boolean;
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
        className: undefined,
    };

    return Object.keys(properties) as (keyof PaneviewOptions)[];
})();

export interface PaneviewDndOverlayEvent extends IAcceptableEvent {
    nativeEvent: DragEvent;
    position: Position;
    panel: IPaneviewPanel;
    getData: () => PaneTransfer | undefined;
}

export class PaneviewUnhandledDragOverEvent
    extends AcceptableEvent
    implements PaneviewDndOverlayEvent
{
    constructor(
        readonly nativeEvent: DragEvent,
        readonly position: Position,
        readonly getData: () => PaneTransfer | undefined,
        readonly panel: IPaneviewPanel
    ) {
        super();
    }
}
