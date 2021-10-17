import { PanelOptions } from '../dockview/options';
import { tryParseJSON } from '../json';

class TransferObject {
  constructor() {
      //
  }
}

export class PanelTransfer extends TransferObject {
    constructor(
        public readonly viewId: string,
        public readonly groupId: string,
        public readonly panelId: string
    ) {
        super();
    }
}

export class PaneTransfer extends TransferObject {
    constructor(
        public readonly viewId: string,
        public readonly paneId: string
    ) {
        super();
    }
}


export const DATA_KEY = 'splitview/transfer';

export const isPanelTransferEvent = (event: DragEvent) => {
    if (!event.dataTransfer) {
        return false;
    }

    return event.dataTransfer.types.includes(DATA_KEY);
};

export enum DragType {
    DOCKVIEW_TAB = 'dockview_tab',
    EXTERNAL = 'external_group_drag',
}

export interface DragItem {
    itemId: string;
    groupId: string;
}

export interface ExternalDragItem extends PanelOptions {}

export type DataObject = DragItem | ExternalDragItem;

/**
 * Determine whether this data belong to that of an event that was started by
 * dragging a tab component
 */
export const isTabDragEvent = (data: any): data is DragItem => {
    return data.type === DragType.DOCKVIEW_TAB;
};

/**
 * Determine whether this data belong to that of an event that was started by
 * a custom drag-enable component
 */
export const isCustomDragEvent = (data: any): data is ExternalDragItem => {
    return data.type === DragType.EXTERNAL;
};

export const extractData = (event: DragEvent): DataObject | null => {
    if (!event.dataTransfer) {
        return null;
    }

    const data = tryParseJSON(event.dataTransfer.getData(DATA_KEY));

    if (!data) {
        console.warn(`[dragEvent] ${DATA_KEY} data is missing`);
    }

    if (typeof data.type !== 'string') {
        console.warn(`[dragEvent] invalid type ${data.type}`);
    }

    return data;
};

/**
 * A singleton to store transfer data during drag & drop operations that are only valid within the application.
 */
export class LocalSelectionTransfer<T> {
    private static readonly INSTANCE = new LocalSelectionTransfer();

    private data?: T[];
    private proto?: T;

    private constructor() {
        // protect against external instantiation
    }

    static getInstance<T>(): LocalSelectionTransfer<T> {
        return LocalSelectionTransfer.INSTANCE as LocalSelectionTransfer<T>;
    }

    hasData(proto: T): boolean {
        return proto && proto === this.proto;
    }

    clearData(proto: T): void {
        if (this.hasData(proto)) {
            this.proto = undefined;
            this.data = undefined;
        }
    }

    getData(proto: T): T[] | undefined {
        if (this.hasData(proto)) {
            return this.data;
        }

        return undefined;
    }

    setData(data: T[], proto: T): void {
        if (proto) {
            this.data = data;
            this.proto = proto;
        }
    }
}

export function getPanelData(): PanelTransfer | undefined {
    const panelTransfer = LocalSelectionTransfer.getInstance<PanelTransfer>();
    const isPanelEvent = panelTransfer.hasData(PanelTransfer.prototype);

    if (!isPanelEvent) {
        return undefined;
    }

    return panelTransfer.getData(PanelTransfer.prototype)![0];
}

export function getPaneData(): PaneTransfer | undefined {
    const paneTransfer = LocalSelectionTransfer.getInstance<PaneTransfer>();
    const isPanelEvent = paneTransfer.hasData(PaneTransfer.prototype);

    if (!isPanelEvent) {
        return undefined;
    }

    return paneTransfer.getData(PaneTransfer.prototype)![0];
}
