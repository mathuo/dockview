import { IDisposable } from './lifecycle';

/**
 * Mimic the basic functionality of a UI-event to provide familar paradigms
 * such as preventDefault()
 */
export class UIEvent {
    private _defaultPrevented: boolean;

    get defaultPrevented() {
        return this._defaultPrevented;
    }

    constructor() {
        this._defaultPrevented = false;
    }

    preventDefault() {
        this._defaultPrevented = true;
    }
}

export interface Event<T> {
    (listener: (e: T) => any): IDisposable;
}

export interface EmitterOptions {
    emitLastValue?: boolean;
}

export namespace Event {
    export const any = <T>(...children: Event<T>[]): Event<T> => {
        return (listener: (e: T) => void) => {
            const disposables = children.map((child) => child(listener));

            return {
                dispose: () => {
                    disposables.forEach((d) => {
                        d.dispose();
                    });
                },
            };
        };
    };
}

// dumb event emitter with better typings than nodes event emitter
// https://github.com/microsoft/vscode/blob/master/src/vs/base/common/event.ts
export class Emitter<T> implements IDisposable {
    private _event?: Event<T>;

    private _last?: T;
    private _listeners: Array<(e: T) => any> = [];
    private _disposed: boolean = false;

    constructor(private readonly options?: EmitterOptions) {}

    get event() {
        if (!this._event) {
            this._event = (listener: (e: T) => void): IDisposable => {
                if (this.options?.emitLastValue && this._last !== undefined) {
                    listener(this._last);
                }

                this._listeners.push(listener);

                return {
                    dispose: () => {
                        const index = this._listeners.indexOf(listener);
                        if (index > -1) {
                            this._listeners.splice(index, 1);
                        }
                    },
                };
            };
        }
        return this._event;
    }

    public fire(e: T) {
        this._last = e;
        this._listeners.forEach((listener) => {
            listener(e);
        });
    }

    public dispose() {
        this._listeners = [];
        this._disposed = true;
    }
}

export type EventHandler = HTMLElement | HTMLDocument | Window;

export const addDisposableListener = <K extends keyof HTMLElementEventMap>(
    element: EventHandler,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
): IDisposable => {
    element.addEventListener(type, listener, options);

    return {
        dispose: () => {
            element.removeEventListener(type, listener);
        },
    };
};
