import { Position, WillShowOverlayEvent } from '../dnd/droptarget';
import { PanelTransfer } from '../dnd/dataTransfer';
import { DockviewApi } from '../api/component.api';
import { IDockviewPanel } from './dockviewPanel';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { IDockviewEvent } from '../events';

export type DockviewGroupDropLocation =
    | 'tab'
    | 'header_space'
    | 'content'
    | 'edge';

export interface WillShowOverlayLocationEventOptions {
    readonly kind: DockviewGroupDropLocation;
    readonly panel: IDockviewPanel | undefined;
    readonly api: DockviewApi;
    readonly group: DockviewGroupPanel | undefined;
    getData: () => PanelTransfer | undefined;
}

export class WillShowOverlayLocationEvent implements IDockviewEvent {
    get kind(): DockviewGroupDropLocation {
        return this.options.kind;
    }

    get nativeEvent(): DragEvent {
        return this.event.nativeEvent;
    }

    get position(): Position {
        return this.event.position;
    }

    get defaultPrevented(): boolean {
        return this.event.defaultPrevented;
    }

    get panel(): IDockviewPanel | undefined {
        return this.options.panel;
    }

    get api(): DockviewApi {
        return this.options.api;
    }

    get group(): DockviewGroupPanel | undefined {
        return this.options.group;
    }

    preventDefault(): void {
        this.event.preventDefault();
    }

    getData(): PanelTransfer | undefined {
        return this.options.getData();
    }

    constructor(
        private readonly event: WillShowOverlayEvent,
        readonly options: WillShowOverlayLocationEventOptions
    ) {}
}