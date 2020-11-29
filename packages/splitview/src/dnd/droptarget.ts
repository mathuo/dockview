import { toggleClass } from '../dom';
import { Emitter, Event } from '../events';
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

export class Droptarget {
    private target: HTMLElement | undefined;
    private overlay: HTMLElement | undefined;
    private _state: Position | undefined;

    private readonly _onDidChange = new Emitter<DroptargetEvent>();
    readonly onDidChange: Event<DroptargetEvent> = this._onDidChange.event;

    get state() {
        return this._state;
    }

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

        if (event.defaultPrevented) {
            console.debug('[dragtarget] defaultPrevented');
        } else {
            this._onDidChange.fire({ position: this._state, event });
        }

        this._state = undefined;
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

        toggleClass(this.overlay, 'right', isRight);
        toggleClass(this.overlay, 'left', isLeft);
        toggleClass(this.overlay, 'top', isTop);
        toggleClass(this.overlay, 'bottom', isBottom);

        if (isRight) {
            this._state = Position.Right;
        } else if (isLeft) {
            this._state = Position.Left;
        } else if (isTop) {
            this._state = Position.Top;
        } else if (isBottom) {
            this._state = Position.Bottom;
        } else {
            this._state = Position.Center;
        }
    };

    private onDragLeave = (event: DragEvent) => {
        console.debug('[droptarget] leave');
        this.removeDropTarget();
    };

    private removeDropTarget() {
        if (this.target) {
            this._state = undefined;
            this.target.removeEventListener('dragover', this.onDragOver);
            this.target.removeEventListener('dragleave', this.onDragLeave);
            this.target.removeEventListener('drop', this.onDrop);
            this.element.removeChild(this.target);
            this.target = undefined;
            this.element.classList.remove('drop-target');
        }
    }
}
