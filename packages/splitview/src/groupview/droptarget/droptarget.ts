import { Emitter, Event } from '../../events';
import { DataTransferSingleton } from './dataTransfer';

export enum Position {
    Top = 'Top',
    Left = 'Left',
    Bottom = 'Bottom',
    Right = 'Right',
    Center = 'Center',
}

export interface DroptargetEvent {
    position: Position;
    event: DragEvent;
}

const HAS_PROCESSED_KEY = '__drop_target_processed__';

export const hasProcessed = (event: DragEvent) =>
    !!(event as any)[HAS_PROCESSED_KEY];

// tagging events as processed is better than calling .stopPropagation() which is the root of all evil
const setEventAsProcessed = (event: DragEvent) => {
    (event as any)[HAS_PROCESSED_KEY] = true;
};

const toggleClassName = (
    element: HTMLElement,
    className: string,
    addOrRemove: boolean
) => {
    if (addOrRemove && !element.classList.contains(className)) {
        element.classList.add(className);
    } else if (!addOrRemove && element.classList.contains(className)) {
        element.classList.remove(className);
    }
};

export class Droptarget {
    private target: HTMLElement | undefined;
    private overlay: HTMLElement | undefined;
    private state: Position | undefined;

    private readonly _onDidChange = new Emitter<DroptargetEvent>();
    readonly onDidChange: Event<DroptargetEvent> = this._onDidChange.event;

    constructor(
        private element: HTMLElement,
        private options: {
            isDisabled: () => boolean;
            isDirectional: boolean;
            id: string;
            enableExternalDragEvents?: boolean;
        }
    ) {
        this.element.addEventListener('dragenter', this.onDragEnter);
    }

    public dispose() {
        this._onDidChange.dispose();
        this.removeDropTarget();
        this.element.removeEventListener('dragenter', this.onDragEnter);
    }

    private onDragEnter = (event: DragEvent) => {
        if (
            !this.options.enableExternalDragEvents &&
            !DataTransferSingleton.has(this.options.id)
        ) {
            console.debug('[droptarget] invalid event');
            return;
        }

        if (this.options.isDisabled()) {
            return;
        }

        event.preventDefault();
        if (!this.target) {
            console.debug('[droptarget] created');
            this.target = document.createElement('div');
            this.target.className = 'drop-target-dropzone';
            this.overlay = document.createElement('div');
            this.overlay.className = 'drop-target-selection';
            //
            this.target.addEventListener('dragover', this.onDragOver);
            this.target.addEventListener('dragleave', this.onDragLeave);
            this.target.addEventListener('drop', this.onDrop);
            this.target.appendChild(this.overlay);

            this.element.classList.add('drop-target');
            this.element.append(this.target);
        }
    };

    private onDrop = (event: DragEvent) => {
        if (
            !this.options.enableExternalDragEvents &&
            !DataTransferSingleton.has(this.options.id)
        ) {
            console.debug('[dragtarget] invalid');
            return;
        }

        console.debug('[dragtarget] drop');
        this.removeDropTarget();

        if (!hasProcessed(event)) {
            this._onDidChange.fire({ position: this.state, event });
        } else {
            console.debug('[dragtarget] already processed');
        }
        this.state = undefined;

        setEventAsProcessed(event);
    };

    private onDragOver = (event: DragEvent) => {
        event.preventDefault();

        if (!this.options.isDirectional) {
            return;
        }

        const width = this.target?.clientWidth;
        const height = this.target?.clientHeight;
        const x = event.offsetX;
        const y = event.offsetY;
        const xp = (100 * x) / width;
        const yp = (100 * y) / height;

        const isRight = xp > 80;
        const isLeft = xp < 20;
        const isTop = !isRight && !isLeft && yp < 20;
        const isBottom = !isRight && !isLeft && yp > 80;

        toggleClassName(this.overlay, 'right', isRight);
        toggleClassName(this.overlay, 'left', isLeft);
        toggleClassName(this.overlay, 'top', isTop);
        toggleClassName(this.overlay, 'bottom', isBottom);

        if (isRight) {
            this.state = Position.Right;
        } else if (isLeft) {
            this.state = Position.Left;
        } else if (isTop) {
            this.state = Position.Top;
        } else if (isBottom) {
            this.state = Position.Bottom;
        } else {
            this.state = Position.Center;
        }
    };

    private onDragLeave = (event: DragEvent) => {
        console.debug('[droptarget] leave');
        this.removeDropTarget();
    };

    private removeDropTarget() {
        if (this.target) {
            this.target.removeEventListener('dragover', this.onDragOver);
            this.target.removeEventListener('dragleave', this.onDragLeave);
            this.target.removeEventListener('drop', this.onDrop);
            this.element.removeChild(this.target);
            this.target = undefined;
            this.element.classList.remove('drop-target');
        }
    }
}
