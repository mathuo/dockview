import { IDisposable } from './lifecycle';

export interface Event<T> {
    (listener: (e: T) => any): IDisposable;
}

export interface EmitterOptions {
    replay?: boolean;
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
    private _disposed = false;

    constructor(private readonly options?: EmitterOptions) {}

    get event() {
        if (!this._event) {
            this._event = (listener: (e: T) => void): IDisposable => {
                if (this.options?.replay && this._last !== undefined) {
                    listener(this._last);
                }

                const firstListener = this._listeners.length === 0;

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

export function addDisposableWindowListener<K extends keyof WindowEventMap>(
    element: Window,
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
): IDisposable {
    element.addEventListener(type, listener, options);

    return {
        dispose: () => {
            element.removeEventListener(type, listener);
        },
    };
}

export function addDisposableListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
): IDisposable {
    element.addEventListener(type, listener, options);

    return {
        dispose: () => {
            element.removeEventListener(type, listener);
        },
    };
}

export class TickDelayedEvent implements IDisposable {
    private timer: any;

    private readonly _onFired = new Emitter<void>();
    readonly onEvent = this._onFired.event;

    fire(): void {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            this._onFired.fire();
            clearTimeout(this.timer);
        });
    }

    dispose(): void {
        this._onFired.dispose();
    }
}
