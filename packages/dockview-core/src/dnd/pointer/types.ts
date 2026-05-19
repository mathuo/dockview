import { Position } from '../droptarget';

export interface PointerDragEvent {
    readonly clientX: number;
    readonly clientY: number;
    readonly pointerEvent: PointerEvent;
}

export interface PointerDroptargetEvent {
    readonly position: Position;
    readonly nativeEvent: PointerEvent;
}

export interface IPointerDropTargetHandle {
    readonly element: HTMLElement;
    handleDragOver(event: PointerDragEvent): void;
    handleDragLeave(): void;
    handleDrop(event: PointerDragEvent): void;
}
