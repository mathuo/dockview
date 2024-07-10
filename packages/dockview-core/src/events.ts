import { IDisposable } from './lifecycle';

export interface Event<T> {
    (listener: (e: T) => any): IDisposable;
}

export interface EmitterOptions {
    readonly replay?: boolean;
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

export interface IDockviewEvent {
    readonly defaultPrevented: boolean;
    preventDefault(): void;
}

export class DockviewEvent implements IDockviewEvent {
    private _defaultPrevented = false;

    get defaultPrevented(): boolean {
        return this._defaultPrevented;
    }

    preventDefault(): void {
        this._defaultPrevented = true;
    }
}

class LeakageMonitor {
    readonly events = new Map<Event<any>, Stacktrace>();

    get size(): number {
        return this.events.size;
    }

    add<T>(event: Event<T>, stacktrace: Stacktrace): void {
        this.events.set(event, stacktrace);
    }

    delete<T>(event: Event<T>): void {
        this.events.delete(event);
    }

    clear(): void {
        this.events.clear();
    }
}

class Stacktrace {
    static create(): Stacktrace {
        return new Stacktrace(new Error().stack ?? '');
    }

    private constructor(readonly value: string) {}

    print(): void {
        console.warn('dockview: stacktrace', this.value);
    }
}

class Listener<T> {
    constructor(
        readonly callback: (t: T) => void,
        readonly stacktrace: Stacktrace | undefined
    ) {}
}

// relatively simple event emitter taken from https://github.com/microsoft/vscode/blob/master/src/vs/base/common/event.ts
export class Emitter<T> implements IDisposable {
    private _event?: Event<T>;

    private _last?: T;
    private _listeners: Listener<any>[] = [];
    private _disposed = false;

    static ENABLE_TRACKING = false;
    static readonly MEMORY_LEAK_WATCHER = new LeakageMonitor();

    static setLeakageMonitorEnabled(isEnabled: boolean): void {
        if (isEnabled !== Emitter.ENABLE_TRACKING) {
            Emitter.MEMORY_LEAK_WATCHER.clear();
        }
        Emitter.ENABLE_TRACKING = isEnabled;
    }

    get value(): T | undefined {
        return this._last;
    }

    constructor(private readonly options?: EmitterOptions) {}

    get event(): Event<T> {
        if (!this._event) {
            this._event = (callback: (e: T) => void): IDisposable => {
                if (this.options?.replay && this._last !== undefined) {
                    callback(this._last);
                }

                const listener = new Listener(
                    callback,
                    Emitter.ENABLE_TRACKING ? Stacktrace.create() : undefined
                );
                this._listeners.push(listener);

                return {
                    dispose: () => {
                        const index = this._listeners.indexOf(listener);
                        if (index > -1) {
                            this._listeners.splice(index, 1);
                        } else if (Emitter.ENABLE_TRACKING) {
                            // console.warn(
                            //     `dockview: listener already disposed`,
                            //     Stacktrace.create().print()
                            // );
                        }
                    },
                };
            };

            if (Emitter.ENABLE_TRACKING) {
                Emitter.MEMORY_LEAK_WATCHER.add(
                    this._event,
                    Stacktrace.create()
                );
            }
        }
        return this._event;
    }

    public fire(e: T): void {
        this._last = e;
        for (const listener of this._listeners) {
            listener.callback(e);
        }
    }

    public dispose(): void {
        if (!this._disposed) {
            this._disposed = true;

            if (this._listeners.length > 0) {
                if (Emitter.ENABLE_TRACKING) {
                    queueMicrotask(() => {
                        // don't check until stack of execution is completed to allow for out-of-order disposals within the same execution block
                        for (const listener of this._listeners) {
                            console.warn(
                                'dockview: stacktrace',
                                listener.stacktrace?.print()
                            );
                        }
                    });
                }

                this._listeners = [];
            }

            if (Emitter.ENABLE_TRACKING && this._event) {
                Emitter.MEMORY_LEAK_WATCHER.delete(this._event);
            }
        }
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
            element.removeEventListener(type, listener, options);
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
            element.removeEventListener(type, listener, options);
        },
    };
}

/**
 *
 * Event Emitter that fires events from a Microtask callback, only one event will fire per event-loop cycle.
 *
 * It's kind of like using an `asapScheduler` in RxJs with additional logic to only fire once per event-loop cycle.
 * This implementation exists to avoid external dependencies.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/queueMicrotask
 * @see https://rxjs.dev/api/index/const/asapScheduler
 */
export class AsapEvent implements IDisposable {
    private readonly _onFired = new Emitter<void>();
    private _currentFireCount = 0;
    private _queued = false;

    readonly onEvent: Event<void> = (e) => {
        /**
         * when the event is first subscribed to take note of the current fire count
         */
        const fireCountAtTimeOfEventSubscription = this._currentFireCount;

        return this._onFired.event(() => {
            /**
             * if the current fire count is greater than the fire count at event subscription
             * then the event has been fired since we subscribed and it's ok to "on_next" the event.
             *
             * if the count is not greater then what we are recieving is an event from the microtask
             * queue that was triggered before we actually subscribed and therfore we should ignore it.
             */
            if (this._currentFireCount > fireCountAtTimeOfEventSubscription) {
                e();
            }
        });
    };

    fire(): void {
        this._currentFireCount++;

        if (this._queued) {
            return;
        }

        this._queued = true;

        queueMicrotask(() => {
            this._queued = false;
            this._onFired.fire();
        });
    }

    dispose(): void {
        this._onFired.dispose();
    }
}
