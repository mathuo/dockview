import {
    PopoutWindowService,
    PopoutWindowModule,
    PopoutGroupEntry,
    IPopoutWindowHost,
} from '../../dockview/popoutWindowService';
import { PopoutWindow } from '../../popoutWindow';
import { DockviewGroupPanel } from '../../dockview/dockviewGroupPanel';
import { Gridview } from '../../gridview/gridview';
import { OverlayRenderContainer } from '../../overlay/overlayRenderContainer';

/**
 * The PopoutWindowService is a bookkeeping/coordination service. It never
 * creates a real popout window itself (that is `PopoutWindow`'s job), so every
 * collaborator here can be a lightweight fake. jsdom cannot emulate the real
 * cross-realm popout window (geometry, ResizeObserver in another realm), but
 * the service's own logic is deterministic and fully testable with fakes.
 */

function makeHost(isDisposed = false): IPopoutWindowHost & {
    isDisposed: boolean;
} {
    return { isDisposed };
}

/**
 * Build a gridview element whose clientWidth/clientHeight can be controlled,
 * because jsdom always reports 0 for layout metrics.
 */
function makeGridElement(width = 0, height = 0): HTMLElement {
    const element = document.createElement('div');
    Object.defineProperty(element, 'clientWidth', {
        configurable: true,
        get: () => width,
    });
    Object.defineProperty(element, 'clientHeight', {
        configurable: true,
        get: () => height,
    });
    return element;
}

interface FakeEntryOptions {
    popoutGroup?: any;
    referenceGroup?: string;
    gridElement?: HTMLElement;
    serializeResult?: any;
    dimensions?: any;
    locationType?: 'popout' | 'grid';
    popoutUrl?: string;
}

function makeEntry(options: FakeEntryOptions = {}): PopoutGroupEntry & {
    disposable: { dispose: jest.Mock };
} {
    const gridElement = options.gridElement ?? makeGridElement();

    const popoutGroup =
        options.popoutGroup ??
        ({
            element: document.createElement('div'),
            api: {
                location: {
                    type: options.locationType ?? 'popout',
                    popoutUrl: options.popoutUrl,
                },
            },
        } as unknown as DockviewGroupPanel);

    const gridview = {
        element: gridElement,
        serialize: jest.fn(
            () =>
                options.serializeResult ?? {
                    root: {
                        type: 'branch',
                        data: [{ type: 'leaf', data: { id: 'leaf-data' } }],
                    },
                    width: 100,
                    height: 100,
                    orientation: 'HORIZONTAL',
                }
        ),
        layout: jest.fn(),
    } as unknown as Gridview;

    const overlayRenderContainer = {
        updateAllPositions: jest.fn(),
    } as unknown as OverlayRenderContainer;

    const window_ = {
        dimensions: jest.fn(
            () => options.dimensions ?? { left: 1, top: 2, width: 3, height: 4 }
        ),
    } as unknown as PopoutWindow;

    const disposable = { dispose: jest.fn() };

    return {
        window: window_,
        popoutGroup,
        referenceGroup: options.referenceGroup,
        gridview,
        overlayRenderContainer,
        dropTargetContainer: {} as any,
        getWindow: () => ({}) as Window,
        popoutUrl: options.popoutUrl,
        popupService: {} as any,
        setAnchorGroup: jest.fn(),
        disposable,
    } as unknown as PopoutGroupEntry & {
        disposable: { dispose: jest.Mock };
    };
}

describe('PopoutWindowService', () => {
    describe('add / entries', () => {
        test('add appends entries and entries exposes them in order', () => {
            const service = new PopoutWindowService(makeHost());
            const a = makeEntry();
            const b = makeEntry();

            expect(service.entries).toEqual([]);

            service.add(a);
            service.add(b);

            expect(service.entries).toEqual([a, b]);
        });
    });

    describe('remove', () => {
        test('fires onDidRemove on a genuine removal when host is not disposed', () => {
            const service = new PopoutWindowService(makeHost(false));
            const entry = makeEntry();
            service.add(entry);

            const listener = jest.fn();
            service.onDidRemove(listener);

            service.remove(entry);

            expect(service.entries).toEqual([]);
            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith(entry);
        });

        test('does not fire onDidRemove when the entry was not present', () => {
            const service = new PopoutWindowService(makeHost(false));
            const listener = jest.fn();
            service.onDidRemove(listener);

            service.remove(makeEntry());

            expect(listener).not.toHaveBeenCalled();
        });

        test('does not fire onDidRemove while the host is disposed', () => {
            const host = makeHost(false);
            const service = new PopoutWindowService(host);
            const entry = makeEntry();
            service.add(entry);

            const listener = jest.fn();
            service.onDidRemove(listener);

            host.isDisposed = true;
            service.remove(entry);

            // The entry is still removed from bookkeeping...
            expect(service.entries).toEqual([]);
            // ...but no event is emitted during teardown.
            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('findByGroup', () => {
        test('matches the anchor popoutGroup by identity', () => {
            const service = new PopoutWindowService(makeHost());
            const entry = makeEntry();
            service.add(entry);

            expect(service.findByGroup(entry.popoutGroup)).toBe(entry);
        });

        test('matches a non-anchor group by DOM containment in the gridview', () => {
            const service = new PopoutWindowService(makeHost());
            const gridElement = makeGridElement();
            const child = document.createElement('div');
            gridElement.appendChild(child);

            const entry = makeEntry({ gridElement });
            service.add(entry);

            const member = { element: child } as unknown as DockviewGroupPanel;
            expect(service.findByGroup(member)).toBe(entry);
        });

        test('returns undefined when no entry owns the group', () => {
            const service = new PopoutWindowService(makeHost());
            service.add(makeEntry());

            const stranger = {
                element: document.createElement('div'),
            } as unknown as DockviewGroupPanel;

            expect(service.findByGroup(stranger)).toBeUndefined();
        });
    });

    describe('findReferenceGroupId', () => {
        test('returns the referenceGroup of the matching anchor group', () => {
            const service = new PopoutWindowService(makeHost());
            const entry = makeEntry({ referenceGroup: 'ref-1' });
            service.add(entry);

            expect(service.findReferenceGroupId(entry.popoutGroup)).toBe(
                'ref-1'
            );
        });

        test('returns undefined when the anchor group has no reference group', () => {
            const service = new PopoutWindowService(makeHost());
            const entry = makeEntry();
            service.add(entry);

            expect(
                service.findReferenceGroupId(entry.popoutGroup)
            ).toBeUndefined();
        });

        test('returns undefined for a group that is not an anchor', () => {
            const service = new PopoutWindowService(makeHost());
            service.add(makeEntry({ referenceGroup: 'ref-1' }));

            const stranger = {
                element: document.createElement('div'),
            } as unknown as DockviewGroupPanel;

            expect(service.findReferenceGroupId(stranger)).toBeUndefined();
        });
    });

    describe('serialize', () => {
        test('emits the legacy single-group `data` shape for a single leaf', () => {
            const service = new PopoutWindowService(makeHost());
            const entry = makeEntry({
                referenceGroup: 'ref-1',
                locationType: 'popout',
                popoutUrl: '/popout.html',
                dimensions: { left: 10, top: 20, width: 30, height: 40 },
                serializeResult: {
                    root: {
                        type: 'branch',
                        data: [
                            { type: 'leaf', data: { id: 'the-leaf-state' } },
                        ],
                    },
                },
            });
            service.add(entry);

            const result = service.serialize();

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                gridReferenceGroup: 'ref-1',
                position: { left: 10, top: 20, width: 30, height: 40 },
                url: '/popout.html',
                data: { id: 'the-leaf-state' },
            });
            expect((result[0] as any).grid).toBeUndefined();
        });

        test('emits the nested `grid` shape when the window hosts multiple groups', () => {
            const service = new PopoutWindowService(makeHost());
            const grid = {
                root: {
                    type: 'branch',
                    data: [
                        { type: 'leaf', data: { id: 'a' } },
                        { type: 'leaf', data: { id: 'b' } },
                    ],
                },
            };
            const entry = makeEntry({ serializeResult: grid });
            service.add(entry);

            const result = service.serialize();

            expect((result[0] as any).grid).toBe(grid);
            expect((result[0] as any).data).toBeUndefined();
        });

        test('emits the nested `grid` shape when the single child is not a leaf', () => {
            const service = new PopoutWindowService(makeHost());
            const grid = {
                root: {
                    type: 'branch',
                    data: [{ type: 'branch', data: [] }],
                },
            };
            const entry = makeEntry({ serializeResult: grid });
            service.add(entry);

            const result = service.serialize();

            expect((result[0] as any).grid).toBe(grid);
            expect((result[0] as any).data).toBeUndefined();
        });

        test('leaves url undefined when the anchor is not in a popout location', () => {
            const service = new PopoutWindowService(makeHost());
            const entry = makeEntry({
                locationType: 'grid',
                popoutUrl: '/should-be-ignored.html',
            });
            service.add(entry);

            const result = service.serialize();

            expect(result[0].url).toBeUndefined();
        });
    });

    describe('observeGridviewSize', () => {
        function makeResizeObserverFactory() {
            const instances: Array<{
                callback: ResizeObserverCallback;
                observe: jest.Mock;
                disconnect: jest.Mock;
            }> = [];

            class FakeResizeObserver {
                observe = jest.fn();
                disconnect = jest.fn();
                unobserve = jest.fn();
                constructor(public callback: ResizeObserverCallback) {
                    instances.push(this as any);
                }
            }

            return { FakeResizeObserver, instances };
        }

        function makePopoutWindow(
            win: Partial<Window> | undefined
        ): PopoutWindow {
            return { window: win } as unknown as PopoutWindow;
        }

        test('returns undefined when the popout realm has no ResizeObserver', () => {
            const service = new PopoutWindowService(makeHost());
            const entry = makeEntry();

            const result = service.observeGridviewSize(
                makePopoutWindow({ ResizeObserver: undefined } as any),
                entry.gridview,
                entry.overlayRenderContainer
            );

            expect(result).toBeUndefined();
        });

        test('returns undefined when the popout window itself is undefined', () => {
            const service = new PopoutWindowService(makeHost());
            const entry = makeEntry();

            const result = service.observeGridviewSize(
                makePopoutWindow(undefined),
                entry.gridview,
                entry.overlayRenderContainer
            );

            expect(result).toBeUndefined();
        });

        test('observes the gridview element and dispose disconnects the observer', () => {
            const service = new PopoutWindowService(makeHost());
            const { FakeResizeObserver, instances } =
                makeResizeObserverFactory();
            const entry = makeEntry({ gridElement: makeGridElement(100, 200) });

            const result = service.observeGridviewSize(
                makePopoutWindow({
                    ResizeObserver: FakeResizeObserver as any,
                }),
                entry.gridview,
                entry.overlayRenderContainer
            );

            expect(instances).toHaveLength(1);
            expect(instances[0].observe).toHaveBeenCalledWith(
                entry.gridview.element
            );

            result!.dispose();
            expect(instances[0].disconnect).toHaveBeenCalledTimes(1);
        });

        test('lays out the gridview and updates positions on a resize with a positive size', () => {
            const service = new PopoutWindowService(makeHost());
            const { FakeResizeObserver, instances } =
                makeResizeObserverFactory();
            const gridElement = makeGridElement(100, 200);
            const entry = makeEntry({ gridElement });

            // No requestAnimationFrame -> relayout runs synchronously.
            service.observeGridviewSize(
                makePopoutWindow({
                    ResizeObserver: FakeResizeObserver as any,
                    closed: false,
                } as any),
                entry.gridview,
                entry.overlayRenderContainer
            );

            instances[0].callback([], instances[0] as any);

            expect(entry.gridview.layout).toHaveBeenCalledWith(100, 200);
            expect(
                entry.overlayRenderContainer.updateAllPositions
            ).toHaveBeenCalledTimes(1);
        });

        test('does not call layout for a zero-sized box but still updates positions', () => {
            const service = new PopoutWindowService(makeHost());
            const { FakeResizeObserver, instances } =
                makeResizeObserverFactory();
            const entry = makeEntry({ gridElement: makeGridElement(0, 0) });

            service.observeGridviewSize(
                makePopoutWindow({
                    ResizeObserver: FakeResizeObserver as any,
                    closed: false,
                } as any),
                entry.gridview,
                entry.overlayRenderContainer
            );

            instances[0].callback([], instances[0] as any);

            expect(entry.gridview.layout).not.toHaveBeenCalled();
            expect(
                entry.overlayRenderContainer.updateAllPositions
            ).toHaveBeenCalledTimes(1);
        });

        test('deduplicates consecutive resizes of the same measured size', () => {
            const service = new PopoutWindowService(makeHost());
            const { FakeResizeObserver, instances } =
                makeResizeObserverFactory();
            const entry = makeEntry({ gridElement: makeGridElement(100, 200) });

            service.observeGridviewSize(
                makePopoutWindow({
                    ResizeObserver: FakeResizeObserver as any,
                    closed: false,
                } as any),
                entry.gridview,
                entry.overlayRenderContainer
            );

            instances[0].callback([], instances[0] as any);
            instances[0].callback([], instances[0] as any);

            expect(entry.gridview.layout).toHaveBeenCalledTimes(1);
            expect(
                entry.overlayRenderContainer.updateAllPositions
            ).toHaveBeenCalledTimes(1);
        });

        test('skips relayout when the host component has been disposed', () => {
            const host = makeHost(false);
            const service = new PopoutWindowService(host);
            const { FakeResizeObserver, instances } =
                makeResizeObserverFactory();
            const entry = makeEntry({ gridElement: makeGridElement(100, 200) });

            service.observeGridviewSize(
                makePopoutWindow({
                    ResizeObserver: FakeResizeObserver as any,
                    closed: false,
                } as any),
                entry.gridview,
                entry.overlayRenderContainer
            );

            host.isDisposed = true;
            instances[0].callback([], instances[0] as any);

            expect(entry.gridview.layout).not.toHaveBeenCalled();
            expect(
                entry.overlayRenderContainer.updateAllPositions
            ).not.toHaveBeenCalled();
        });

        test('skips relayout when the popout window has been closed', () => {
            const service = new PopoutWindowService(makeHost());
            const { FakeResizeObserver, instances } =
                makeResizeObserverFactory();
            const entry = makeEntry({ gridElement: makeGridElement(100, 200) });

            service.observeGridviewSize(
                makePopoutWindow({
                    ResizeObserver: FakeResizeObserver as any,
                    closed: true,
                } as any),
                entry.gridview,
                entry.overlayRenderContainer
            );

            instances[0].callback([], instances[0] as any);

            expect(entry.gridview.layout).not.toHaveBeenCalled();
            expect(
                entry.overlayRenderContainer.updateAllPositions
            ).not.toHaveBeenCalled();
        });

        test('defers relayout through the popout realm requestAnimationFrame when available', () => {
            const service = new PopoutWindowService(makeHost());
            const { FakeResizeObserver, instances } =
                makeResizeObserverFactory();
            const entry = makeEntry({ gridElement: makeGridElement(100, 200) });

            let deferred: FrameRequestCallback | undefined;
            const raf = jest.fn((cb: FrameRequestCallback) => {
                deferred = cb;
                return 1;
            });

            service.observeGridviewSize(
                makePopoutWindow({
                    ResizeObserver: FakeResizeObserver as any,
                    requestAnimationFrame: raf as any,
                    closed: false,
                } as any),
                entry.gridview,
                entry.overlayRenderContainer
            );

            instances[0].callback([], instances[0] as any);

            // Nothing runs until the frame callback is invoked.
            expect(raf).toHaveBeenCalledTimes(1);
            expect(entry.gridview.layout).not.toHaveBeenCalled();

            deferred!(0);
            expect(entry.gridview.layout).toHaveBeenCalledWith(100, 200);
        });
    });

    describe('scheduleRestoration', () => {
        beforeEach(() => jest.useFakeTimers());
        afterEach(() => {
            jest.runOnlyPendingTimers();
            jest.useRealTimers();
        });

        test('runs the work and resolves after the delay elapses', async () => {
            const service = new PopoutWindowService(makeHost(false));
            const work = jest.fn();
            const onCancel = jest.fn();

            const promise = service.scheduleRestoration(50, work, onCancel);

            expect(work).not.toHaveBeenCalled();
            jest.advanceTimersByTime(50);
            await promise;

            expect(work).toHaveBeenCalledTimes(1);
            expect(onCancel).not.toHaveBeenCalled();
        });

        test('does not run the work when the host was disposed before the timer fired', async () => {
            const host = makeHost(false);
            const service = new PopoutWindowService(host);
            const work = jest.fn();

            const promise = service.scheduleRestoration(50, work);

            host.isDisposed = true;
            jest.advanceTimersByTime(50);
            await promise;

            expect(work).not.toHaveBeenCalled();
        });

        test('cancelPendingRestorations cancels the timer, runs onCancel and resolves without work', async () => {
            const service = new PopoutWindowService(makeHost(false));
            const work = jest.fn();
            const onCancel = jest.fn();

            const promise = service.scheduleRestoration(50, work, onCancel);

            service.cancelPendingRestorations();
            await promise;

            expect(onCancel).toHaveBeenCalledTimes(1);
            expect(work).not.toHaveBeenCalled();

            // The timer was cleared: advancing does not run work afterwards.
            jest.advanceTimersByTime(100);
            expect(work).not.toHaveBeenCalled();
        });

        test('cancelPendingRestorations with no onCancel resolves cleanly', async () => {
            const service = new PopoutWindowService(makeHost(false));
            const work = jest.fn();

            const promise = service.scheduleRestoration(50, work);
            service.cancelPendingRestorations();
            await promise;

            expect(work).not.toHaveBeenCalled();
        });
    });

    describe('finishRestoration / restorationPromise', () => {
        test('defaults to an already-resolved promise', async () => {
            const service = new PopoutWindowService(makeHost());
            await expect(service.restorationPromise).resolves.toBeUndefined();
        });

        test('restorationPromise resolves once all supplied promises resolve', async () => {
            const service = new PopoutWindowService(makeHost());

            let resolveA: () => void = () => undefined;
            let resolveB: () => void = () => undefined;
            const a = new Promise<void>((r) => (resolveA = r));
            const b = new Promise<void>((r) => (resolveB = r));

            service.finishRestoration([a, b]);

            let settled = false;
            const tracked = service.restorationPromise.then(() => {
                settled = true;
            });

            resolveA();
            await Promise.resolve();
            expect(settled).toBe(false);

            resolveB();
            await tracked;
            expect(settled).toBe(true);
        });
    });

    describe('disposeAll', () => {
        test('disposes each entry disposable', () => {
            const service = new PopoutWindowService(makeHost());
            const a = makeEntry();
            const b = makeEntry();
            service.add(a);
            service.add(b);

            service.disposeAll();

            expect(a.disposable.dispose).toHaveBeenCalledTimes(1);
            expect(b.disposable.dispose).toHaveBeenCalledTimes(1);
        });

        test('is safe when an entry disposal mutates the entries list', () => {
            const service = new PopoutWindowService(makeHost());
            const a = makeEntry();
            const b = makeEntry();
            service.add(a);
            service.add(b);

            // Disposing `a` removes it from the service mid-iteration; the
            // implementation iterates a copy so `b` is still disposed.
            (a.disposable.dispose as jest.Mock).mockImplementation(() =>
                service.remove(a)
            );

            service.disposeAll();

            expect(a.disposable.dispose).toHaveBeenCalledTimes(1);
            expect(b.disposable.dispose).toHaveBeenCalledTimes(1);
        });
    });

    describe('dispose', () => {
        test('cancels pending restorations, disposes entries and the emitter', async () => {
            jest.useFakeTimers();
            try {
                const service = new PopoutWindowService(makeHost(false));
                const entry = makeEntry();
                service.add(entry);

                const onCancel = jest.fn();
                const pending = service.scheduleRestoration(
                    1000,
                    jest.fn(),
                    onCancel
                );

                service.dispose();
                await pending;

                expect(onCancel).toHaveBeenCalledTimes(1);
                expect(entry.disposable.dispose).toHaveBeenCalledTimes(1);
            } finally {
                jest.useRealTimers();
            }
        });
    });

    describe('PopoutWindowModule', () => {
        test('describes the popoutWindowService and creates instances', () => {
            expect(PopoutWindowModule.moduleName).toBe('PopoutWindow');

            const create = (PopoutWindowModule.services as any)[
                'popoutWindowService'
            ];
            expect(typeof create).toBe('function');

            const instance = create(makeHost());
            expect(instance).toBeInstanceOf(PopoutWindowService);
        });
    });
});
