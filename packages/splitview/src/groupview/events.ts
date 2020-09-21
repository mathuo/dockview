import { DroptargetEvent } from './droptarget/droptarget';
import { IGroupPanel } from './panel/types';

export interface TabDropEvent {
    event: DroptargetEvent;
    index?: number;
}

export enum MouseEventKind {
    CLICK = 'CLICK',
    CONTEXT_MENU = 'CONTEXT_MENU',
}

export interface LayoutMouseEvent {
    kind: MouseEventKind;
    event: MouseEvent;
    panel?: IGroupPanel;
    tab?: boolean;
}
