import { createEvent, fireEvent } from '@testing-library/dom';
import type {
    DockviewIDisposable,
    IContentRenderer,
    SerializedDockview,
} from 'dockview-core';
import {
    DockviewApi,
    DockviewComponent,
    LocalSelectionTransfer,
    PanelTransfer,
} from 'dockview-core';
import type {
    DragPayload,
    MoveEvent,
    MultiWindow,
    MultiWindowTransport,
} from '../multiWindow';
import {
    HUB_DRAG_TYPE,
    installMultiWindow,
    MemoryOrchestrator,
} from '../multiWindow';
import { DragHub } from '../multiWindow/dragHub';
import { HistorySequencer } from '../multiWindow/historySequencer';
import { WorkspaceRegistry } from '../multiWindow/workspaceState';

class TestPanel implements IContentRenderer {
    element = document.createElement('div');
    init(): void {
        // noop
    }
    layout(): void {
        // noop
    }
    dispose(): void {
        // noop
    }
}

const panelPayload = (id: string): DragPayload => ({
    kind: 'panel',
    panel: { id, contentComponent: 'default' },
});

const layoutWith = (...ids: string[]): SerializedDockview =>
    ({
        panels: Object.fromEntries(
            ids.map((id) => [id, { id, contentComponent: 'default' }])
        ),
    }) as unknown as SerializedDockview;

/**
 * Fire a drag event carrying a pointer position. jsdom builds drag events
 * as plain `Event`s, which drop `clientX`/`clientY` from the init, so they
 * are defined on the event itself.
 */
function fireDrag(
    type: 'dragEnter' | 'dragOver' | 'drop',
    element: Element,
    dataTransfer: DataTransfer,
    at: { clientX: number; clientY: number }
): void {
    const event = createEvent[type](element, { dataTransfer });
    Object.defineProperty(event, 'clientX', { value: at.clientX });
    Object.defineProperty(event, 'clientY', { value: at.clientY });
    fireEvent(element, event);
}

/** Let every promise continuation and queued microtask run. */
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * jsdom has no `DataTransfer`; this carries what the HTML5 backend and the
 * interceptor touch. One instance is shared across the events of a drag,
 * as the browser shares one `DataTransfer` for a drag session.
 */
function fakeDataTransfer(): DataTransfer {
    const data = new Map<string, string>();
    const transfer = {
        items: [] as unknown[],
        files: [] as unknown[],
        dropEffect: 'none',
        effectAllowed: 'all',
        setData: (type: string, value: string) => {
            data.set(type, value);
        },
        getData: (type: string) => data.get(type) ?? '',
        clearData: () => data.clear(),
        get types() {
            return Array.from(data.keys());
        },
        setDragImage: () => undefined,
    };
    return transfer as unknown as DataTransfer;
}

describe('multi-window: DragHub', () => {
    test('a claim returns the payload and names the source to release', () => {
        const hub = new DragHub();
        hub.start('s1', { from: 'main', payload: panelPayload('p') });

        const claim = hub.claim('s1', 'dock-2');

        expect(claim.payload).toEqual(panelPayload('p'));
        expect(claim.release).toEqual({
            from: 'main',
            session: 's1',
            to: 'dock-2',
        });
    });

    test('the first claim wins and a peek leaves the drag in flight', () => {
        const hub = new DragHub();
        hub.start('s1', { from: 'main', payload: panelPayload('p') });

        expect(hub.peek('s1')).toEqual(panelPayload('p'));
        hub.claim('s1', 'dock-2');

        expect(() => hub.claim('s1', 'dock-3')).toThrow(
            'drag session s1 is not in flight'
        );
        expect(() => hub.peek('nope')).toThrow(
            'drag session nope is not in flight'
        );
    });

    test('an ended drag is discarded, or parked for a torn-off window', () => {
        const hub = new DragHub();
        hub.start('s1', { from: 'main', payload: panelPayload('p') });
        hub.start('s2', { from: 'main', payload: panelPayload('q') });
        hub.start('s3', { from: 'main', payload: panelPayload('r') });

        // Still in flight: nothing to settle.
        expect(hub.expire('s1', () => 'x')).toEqual({ outcome: 'settled' });

        expect(hub.end('s1', false)).toBe(true);
        expect(hub.expire('s1', () => 'x')).toEqual({ outcome: 'discarded' });
        expect(() => hub.peek('s1')).toThrow();

        expect(hub.end('s2', true)).toBe(true);
        expect(hub.expire('s2', () => 'torn-1')).toEqual({
            outcome: 'torn-off',
            windowId: 'torn-1',
            release: { from: 'main', session: 's2', to: 'torn-1' },
        });
        expect(hub.peekPending('torn-1')).toEqual(panelPayload('q'));
        expect(hub.takePendingDrag('torn-1')).toEqual(panelPayload('q'));
        expect(hub.takePendingDrag('torn-1')).toBeNull();

        // A claim that arrived during the grace period wins over the end.
        hub.end('s3', true);
        hub.claim('s3', 'dock-2');
        expect(hub.expire('s3', () => 'x')).toEqual({ outcome: 'settled' });
        expect(hub.end('s3', true)).toBe(false);
    });
});

describe('multi-window: WorkspaceRegistry', () => {
    test('refuses a layout naming a panel another window holds, unless a move explains it', () => {
        const registry = new WorkspaceRegistry();
        registry.setLayout('main', layoutWith('a', 'b'));

        expect(() => registry.setLayout('dock-2', layoutWith('b'))).toThrow(
            'panel b is already held by window main'
        );

        registry.expectMove(['b'], 'main', 'dock-2');
        // The destination may report first...
        registry.setLayout('dock-2', layoutWith('b'));
        // ...and the source reporting the panel gone completes the move.
        registry.setLayout('main', layoutWith('a'));
        // After which a duplicate is a duplicate again.
        expect(() => registry.setLayout('main', layoutWith('a', 'b'))).toThrow(
            'panel b is already held by window dock-2'
        );
    });

    test('snapshots round-trip, with frames, and an applied layout is trusted', () => {
        const registry = new WorkspaceRegistry();
        registry.ensureWindow('main');
        registry.setGeometry('main', { x: 1, y: 2, width: 300, height: 200 });
        registry.setLayout('main', layoutWith('a'));
        registry.setLayoutUnchecked('dock-2', layoutWith('a'));

        const snapshot = registry.snapshot();
        expect(snapshot.version).toBe(1);
        expect(snapshot.windows.map((window) => window.id)).toEqual([
            'main',
            'dock-2',
        ]);
        expect(snapshot.windows[0].geometry).toEqual({
            x: 1,
            y: 2,
            width: 300,
            height: 200,
        });

        const restored = new WorkspaceRegistry(snapshot);
        expect(restored.loadLayout('main')).toEqual(layoutWith('a'));
        expect(restored.loadLayout('nobody')).toBeNull();
        expect(restored.removeWindow('dock-2')?.id).toBe('dock-2');
        expect(restored.windowIds()).toEqual(['main']);

        expect(
            () => new WorkspaceRegistry({ version: 2, windows: [] })
        ).toThrow('workspace format 2 is not the supported 1');
    });
});

describe('multi-window: HistorySequencer', () => {
    const half = (window: string, before: string[], after: string[]) => ({
        window,
        before: layoutWith(...before),
        after: layoutWith(...after),
    });

    test('a move undoes destination first and redoes source first', () => {
        const history = new HistorySequencer();
        history.recordMove('s1', ['p'], 'to', half('dock-2', [], ['p']));
        expect(() => history.undo()).toThrow('move s1 is still being recorded');
        history.recordMove('s1', ['p'], 'from', half('main', ['p'], []));

        expect(history.info()).toEqual({
            undoCount: 1,
            redoCount: 0,
            nextUndo: 'move of p from main to dock-2',
            nextRedo: null,
        });

        const undo = history.undo();
        expect(undo.actions).toEqual([
            { type: 'apply-layout', window: 'dock-2', layout: layoutWith() },
            { type: 'apply-layout', window: 'main', layout: layoutWith('p') },
        ]);
        expect(undo.moved).toEqual({
            session: 's1',
            panels: ['p'],
            from: 'dock-2',
            to: 'main',
        });

        const redo = history.redo();
        expect(redo.actions).toEqual([
            { type: 'apply-layout', window: 'main', layout: layoutWith() },
            { type: 'apply-layout', window: 'dock-2', layout: layoutWith('p') },
        ]);
        expect(redo.moved?.to).toBe('dock-2');
        expect(() => history.redo()).toThrow('nothing to redo');
    });

    test('local steps are ordered against moves, trimmed, and dropped with their window', () => {
        const history = new HistorySequencer(3);
        history.pushLocal('main');
        history.recordMove('s1', ['p'], 'from', half('main', ['p'], []));
        history.recordMove('s1', ['p'], 'to', half('dock-2', [], ['p']));
        history.pushLocal('dock-2');

        expect(history.undo().actions).toEqual([
            { type: 'undo-local', window: 'dock-2' },
        ]);
        expect(history.undo().moved?.session).toBe('s1');
        expect(history.undo().actions).toEqual([
            { type: 'undo-local', window: 'main' },
        ]);
        expect(() => history.undo()).toThrow('nothing to undo');
        expect(history.redo().actions).toEqual([
            { type: 'redo-local', window: 'main' },
        ]);

        // A new step clears what could be redone.
        history.pushLocal('main');
        expect(history.info().redoCount).toBe(0);

        // Depth 3: the oldest entry falls off.
        history.pushLocal('main');
        history.pushLocal('main');
        expect(history.info().undoCount).toBe(3);

        history.forgetWindow('main');
        expect(history.info()).toEqual({
            undoCount: 0,
            redoCount: 0,
            nextUndo: null,
            nextRedo: null,
        });
    });
});

describe('multi-window: two dockviews through the in-memory orchestrator', () => {
    interface Window {
        label: string;
        dockview: DockviewComponent;
        api: DockviewApi;
        mw: MultiWindow;
        log: string[];
        dispose(): void;
    }

    const windows: Window[] = [];

    const open = (
        orchestrator: MemoryOrchestrator,
        label: string,
        options: { buildDefaults?: () => void; tearOff?: boolean } = {}
    ): Window => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        let nextGroup = 0;
        const dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            layoutHistory: { enabled: true, clearOnFromJSON: false },
            // Group ids travel with a group; make them unique per window.
            groupIdGenerator: () => `${label}-${++nextGroup}`,
        });
        dockview.layout(800, 600);
        const api = new DockviewApi(dockview);
        const log: string[] = [];
        const onLog = (line: string) => log.push(line);
        const mw = installMultiWindow(api, orchestrator.connect(label), {
            onLog,
            tearOff: options.tearOff,
            debounceMs: 0,
            buildDefaults: options.buildDefaults,
        });
        const window: Window = {
            label,
            dockview,
            api,
            mw,
            log,
            dispose() {
                mw.dispose();
                dockview.dispose();
                container.remove();
            },
        };
        windows.push(window);
        return window;
    };

    const ids = (window: Window) => window.api.panels.map((p) => p.id).sort();

    const sized = (element: HTMLElement) => {
        jest.spyOn(element, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(element, 'offsetWidth', 'get').mockImplementation(() => 100);
        return element;
    };

    /** A real HTML5 drag gesture: start on `source`'s tab, drop on `onto` in `target`. */
    const dragAcross = async (
        source: Window,
        panelId: string,
        target: Window,
        onto: HTMLElement = target.dockview.element.querySelector(
            '.dv-content-container'
        ) as HTMLElement,
        at: { clientX: number; clientY: number } = { clientX: 50, clientY: 50 },
        afterStart: () => void = () => undefined
    ) => {
        const dataTransfer = fakeDataTransfer();
        const tab = source.api.getPanel(panelId)?.view.tab.element;
        if (!tab) {
            throw new Error(`no tab for ${panelId}`);
        }
        sized(onto);

        fireEvent.dragStart(tab, { dataTransfer });
        expect(dataTransfer.types).toContain(HUB_DRAG_TYPE);
        await flush();
        afterStart();

        fireDrag('dragEnter', onto, dataTransfer, at);
        fireDrag('dragOver', onto, dataTransfer, at);
        fireDrag('drop', onto, dataTransfer, at);
        await flush();
        await flush();

        dataTransfer.dropEffect = 'move';
        fireEvent.dragEnd(tab, { dataTransfer });
        await flush();
        return dataTransfer;
    };

    afterEach(() => {
        for (const window of windows.splice(0)) {
            window.dispose();
        }
        jest.restoreAllMocks();
    });

    test('a tab dropped on another window moves there, with undo and redo through the orchestrator', async () => {
        const orchestrator = new MemoryOrchestrator({ dragEndGraceMs: 0 });
        const moves: MoveEvent[] = [];
        orchestrator.onDidMove((notice) => moves.push(notice));
        const main = open(orchestrator, 'main');
        const other = open(orchestrator, 'other');
        await flush();

        main.api.addPanel({ id: 'a', component: 'default', title: 'A' });
        main.api.addPanel({
            id: 'b',
            component: 'default',
            params: { n: 1 },
            position: { referencePanel: 'a', direction: 'right' },
        });
        other.api.addPanel({ id: 'x', component: 'default' });
        await flush();

        await dragAcross(main, 'b', other);

        expect(ids(main)).toEqual(['a']);
        expect(ids(other)).toEqual(['b', 'x']);
        expect(other.api.getPanel('b')?.params).toEqual({ n: 1 });
        expect(moves).toEqual([
            expect.objectContaining({
                panels: ['b'],
                from: 'main',
                to: 'other',
                reason: 'drop',
            }),
        ]);
        expect(
            main.log.some((line) => line.startsWith('released panel b'))
        ).toBe(true);
        expect(other.log).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/placed 1 panel\(s\) into group/),
            ])
        );
        // Both windows reported their layouts, in whichever order, and the
        // workspace accepted them as the announced move.
        await flush();
        expect(main.log.concat(other.log).join('\n')).not.toMatch(/refused/);
        const held = (label: string) =>
            Object.keys(
                orchestrator
                    .snapshot()
                    .windows.find((window) => window.id === label)?.layout
                    ?.panels ?? {}
            ).sort();
        expect(held('main')).toEqual(['a']);
        expect(held('other')).toEqual(['b', 'x']);

        expect(orchestrator.history).toEqual(
            expect.objectContaining({
                undoCount: 1,
                nextUndo: 'move of b from main to other',
            })
        );

        orchestrator.undo();
        await flush();
        expect(ids(main)).toEqual(['a', 'b']);
        expect(ids(other)).toEqual(['x']);
        expect(moves[1]).toEqual(
            expect.objectContaining({
                from: 'other',
                to: 'main',
                reason: 'undo',
            })
        );
        // Undo via a window's own shared history reaches the same stack.
        expect(orchestrator.history.redoCount).toBe(1);

        orchestrator.redo();
        await flush();
        expect(ids(main)).toEqual(['a']);
        expect(ids(other)).toEqual(['b', 'x']);
        expect(moves[2]).toEqual(
            expect.objectContaining({
                from: 'main',
                to: 'other',
                reason: 'redo',
            })
        );
        await flush();
        expect(main.log.concat(other.log).join('\n')).not.toMatch(/refused/);
    });

    test('a drop is refused, and nothing released, when the window already holds the panel', async () => {
        const orchestrator = new MemoryOrchestrator({ dragEndGraceMs: 0 });
        const main = open(orchestrator, 'main');
        const other = open(orchestrator, 'other');
        await flush();
        main.api.addPanel({ id: 'same', component: 'default' });
        other.api.addPanel({ id: 'same', component: 'default' });

        await dragAcross(main, 'same', other);

        expect(ids(main)).toEqual(['same']);
        expect(ids(other)).toEqual(['same']);
        expect(
            other.log.some((line) =>
                line.includes('refused: Error: this window already holds same')
            )
        ).toBe(true);
        expect(orchestrator.history.undoCount).toBe(0);
    });

    test('a group drag carries every tab of the group', async () => {
        const orchestrator = new MemoryOrchestrator({ dragEndGraceMs: 0 });
        const main = open(orchestrator, 'main');
        const other = open(orchestrator, 'other');
        await flush();
        main.api.addPanel({ id: 'a', component: 'default' });
        main.api.addPanel({ id: 'b', component: 'default' });
        other.api.addPanel({ id: 'x', component: 'default' });

        const dataTransfer = fakeDataTransfer();
        const voidContainer = main.dockview.element.querySelector(
            '.dv-void-container'
        ) as HTMLElement;
        const content = sized(
            other.dockview.element.querySelector(
                '.dv-content-container'
            ) as HTMLElement
        );

        fireEvent.dragStart(voidContainer, { dataTransfer });
        await flush();
        // Dropped at the right edge: a new group beside the target.
        const at = { clientX: 95, clientY: 50 };
        fireDrag('dragEnter', content, dataTransfer, at);
        fireDrag('dragOver', content, dataTransfer, at);
        fireDrag('drop', content, dataTransfer, at);
        await flush();
        await flush();

        expect(ids(main)).toEqual([]);
        expect(ids(other)).toEqual(['a', 'b', 'x']);
        expect(other.api.groups).toHaveLength(2);
        expect(other.log).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/placed 2 panel\(s\) right of group/),
            ])
        );
        expect(
            other.api.getPanel('a')?.group.panels.map((panel) => panel.id)
        ).toEqual(['a', 'b']);
    });

    test('a drop on a tab lands at that tab, through the drop index', async () => {
        const orchestrator = new MemoryOrchestrator({ dragEndGraceMs: 0 });
        const main = open(orchestrator, 'main');
        const other = open(orchestrator, 'other');
        await flush();
        main.api.addPanel({ id: 'b', component: 'default' });
        other.api.addPanel({ id: 'x', component: 'default' });
        other.api.addPanel({ id: 'y', component: 'default' });
        // The drop target is the tab's wrapper, not the renderer inside it.
        const yTab = other.api
            .getPanel('y')
            ?.view.tab.element.closest('.dv-tab') as HTMLElement;

        // The left half of y's tab: before y.
        await dragAcross(main, 'b', other, yTab, { clientX: 10, clientY: 10 });

        expect(ids(main)).toEqual([]);
        expect(
            other.api.getPanel('y')?.group.panels.map((panel) => panel.id)
        ).toEqual(['x', 'b', 'y']);
        expect(other.log).toEqual(
            expect.arrayContaining([
                expect.stringMatching(
                    /placed 1 panel\(s\) into group .* at tab 1/
                ),
            ])
        );
    });

    test('an unclaimed drag with tearOff becomes a new window holding the tab', async () => {
        const created: string[] = [];
        const orchestrator = new MemoryOrchestrator({
            dragEndGraceMs: 0,
            createWindow: (label) => {
                created.push(label);
                open(orchestrator, label);
            },
        });
        const main = open(orchestrator, 'main', { tearOff: true });
        await flush();
        main.api.addPanel({ id: 'a', component: 'default' });
        main.api.addPanel({ id: 'b', component: 'default', title: 'Bee' });

        const dataTransfer = fakeDataTransfer();
        const tab = main.api.getPanel('b')?.view.tab.element as HTMLElement;
        fireEvent.dragStart(tab, { dataTransfer });
        await flush();
        // No drop anywhere: the drag ends with nothing dropped.
        fireEvent.dragEnd(tab, { dataTransfer });
        await flush();
        await flush();

        expect(created).toEqual(['torn-off-1']);
        const torn = windows.find((window) => window.label === 'torn-off-1');
        expect(torn && ids(torn)).toEqual(['b']);
        expect(torn?.api.getPanel('b')?.title).toBe('Bee');
        expect(ids(main)).toEqual(['a']);
    });

    test('a local step is ordered against a move, and undone through the window', async () => {
        const orchestrator = new MemoryOrchestrator({ dragEndGraceMs: 0 });
        const main = open(orchestrator, 'main');
        const other = open(orchestrator, 'other');
        await flush();
        main.api.addPanel({ id: 'a', component: 'default' });
        main.api.addPanel({ id: 'b', component: 'default' });
        main.api.addPanel({ id: 'c', component: 'default' });
        other.api.addPanel({ id: 'x', component: 'default' });
        await flush();
        expect(orchestrator.history.undoCount).toBe(0);

        // A user closes a tab: a local step, reported to the orchestrator.
        const closeC = main.api
            .getPanel('c')
            ?.view.tab.element.querySelector(
                '.dv-default-tab-action'
            ) as HTMLElement;
        fireEvent.click(closeC);
        await flush();
        expect(ids(main)).toEqual(['a', 'b']);
        expect(main.dockview.canUndo).toBe(true);
        expect(orchestrator.history).toEqual(
            expect.objectContaining({ undoCount: 1, nextUndo: 'step in main' })
        );

        await dragAcross(main, 'b', other);
        expect(ids(other)).toEqual(['b', 'x']);
        expect(orchestrator.history).toEqual(
            expect.objectContaining({
                undoCount: 2,
                nextUndo: 'move of b from main to other',
            })
        );

        // Undo through a window's own shared history: the move first...
        const infos: number[] = [];
        main.mw.onDidChangeHistory((info) => infos.push(info.undoCount));
        main.mw.undo();
        await flush();
        expect(ids(main)).toEqual(['a', 'b']);
        expect(ids(other)).toEqual(['x']);
        expect(main.mw.history).toEqual(
            expect.objectContaining({ undoCount: 1, redoCount: 1 })
        );
        // ...then the local step, carried out by main's own history.
        main.mw.undo();
        await flush();
        expect(ids(main)).toEqual(['a', 'b', 'c']);
        expect(main.mw.history.undoCount).toBe(0);
        expect(infos).toEqual([1, 0]);
        // Neither instruction was reported back as a new step.
        expect(orchestrator.history.redoCount).toBe(2);

        main.mw.redo();
        await flush();
        expect(ids(main)).toEqual(['a', 'b']);
        main.mw.redo();
        await flush();
        expect(ids(main)).toEqual(['a']);
        expect(ids(other)).toEqual(['b', 'x']);
        expect(orchestrator.history).toEqual(
            expect.objectContaining({ undoCount: 2, redoCount: 0 })
        );

        // Nothing left to redo: reported, not thrown.
        main.mw.redo();
        await flush();
        expect(main.log).toContain('redo: Error: nothing to redo');
    });

    test('key bindings route to the orchestrator only when asked', async () => {
        const orchestrator = new MemoryOrchestrator();
        const transport = orchestrator.connect('main');
        const undo = jest.fn(async () => undefined);
        const redo = jest.fn(async () => undefined);
        const main = open(orchestrator, 'main');
        const bound = installMultiWindow(
            main.api,
            { ...transport, undo, redo },
            { history: { bindKeys: true }, workspace: false }
        );
        await flush();

        const press = (init: KeyboardEventInit) =>
            fireEvent.keyDown(document, init);
        press({ key: 'z', ctrlKey: true });
        press({ key: 'Z', metaKey: true, shiftKey: true });
        press({ key: 'y', ctrlKey: true });
        press({ key: 'z', ctrlKey: true, altKey: true });
        press({ key: 'z' });
        expect(undo).toHaveBeenCalledTimes(1);
        expect(redo).toHaveBeenCalledTimes(2);

        bound.dispose();
        press({ key: 'z', ctrlKey: true });
        expect(undo).toHaveBeenCalledTimes(1);
    });

    test('with history off, undo stays local to the window', async () => {
        const orchestrator = new MemoryOrchestrator();
        const main = open(orchestrator, 'main');
        const local = installMultiWindow(
            main.api,
            orchestrator.connect('main'),
            {
                history: false,
                workspace: false,
            }
        );
        await flush();
        main.api.addPanel({ id: 'a', component: 'default' });
        main.api.addPanel({ id: 'b', component: 'default' });
        fireEvent.click(
            main.api
                .getPanel('b')
                ?.view.tab.element.querySelector(
                    '.dv-default-tab-action'
                ) as HTMLElement
        );
        expect(ids(main)).toEqual(['a']);

        expect(local.history).toEqual({
            undoCount: 0,
            redoCount: 0,
            nextUndo: null,
            nextRedo: null,
        });
        expect(typeof local.onDidChangeHistory(() => undefined).dispose).toBe(
            'function'
        );
        local.undo();
        expect(ids(main)).toEqual(['a', 'b']);
        local.redo();
        expect(ids(main)).toEqual(['a']);
        local.dispose();
    });

    test('a layout that cannot be restored falls back to the defaults', async () => {
        const orchestrator = new MemoryOrchestrator({
            workspace: {
                version: 1,
                windows: [
                    {
                        id: 'main',
                        layout: {
                            grid: { root: { type: 'leaf' } },
                        } as unknown as SerializedDockview,
                    },
                ],
            },
        });
        const main = open(orchestrator, 'main', {
            buildDefaults: () =>
                main.api.addPanel({ id: 'fallback', component: 'default' }),
        });
        await flush();
        await flush();

        expect(ids(main)).toEqual(['fallback']);
        expect(main.log).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/^could not restore layout: /),
            ])
        );
        orchestrator.setGeometry('main', { x: 0, y: 0, width: 10, height: 10 });
        expect(orchestrator.snapshot().windows[0].geometry?.width).toBe(10);
    });

    test('a drop at a layout edge opens a new group there', async () => {
        const orchestrator = new MemoryOrchestrator({ dragEndGraceMs: 0 });
        const main = open(orchestrator, 'main');
        const other = open(orchestrator, 'other');
        await flush();
        main.api.addPanel({ id: 'b', component: 'default' });
        other.api.addPanel({ id: 'x', component: 'default' });

        // The layout-edge target refuses a drag whose in-heap transfer data
        // names another dockview, which only exists when the two share a
        // heap. Another window has no such data, so clear it as the drag
        // leaves main, as a real second process would never see it.
        const leaveHeap = () =>
            LocalSelectionTransfer.getInstance().clearData(
                PanelTransfer.prototype
            );
        await dragAcross(
            main,
            'b',
            other,
            other.dockview.element,
            { clientX: 2, clientY: 50 },
            leaveHeap
        );

        expect(ids(main)).toEqual([]);
        expect(ids(other)).toEqual(['b', 'x']);
        expect(other.api.groups).toHaveLength(2);
        expect(other.log).toEqual(
            expect.arrayContaining([
                expect.stringMatching(
                    /placed 1 panel\(s\) at the layout's left edge/
                ),
            ])
        );
    });

    test('a torn-off group starts the new window with every tab', async () => {
        const orchestrator = new MemoryOrchestrator({
            dragEndGraceMs: 0,
            createWindow: (label) => {
                open(orchestrator, label);
            },
        });
        const main = open(orchestrator, 'main', { tearOff: true });
        await flush();
        main.api.addPanel({ id: 'a', component: 'default' });
        main.api.addPanel({ id: 'b', component: 'default' });

        const dataTransfer = fakeDataTransfer();
        const voidContainer = main.dockview.element.querySelector(
            '.dv-void-container'
        ) as HTMLElement;
        fireEvent.dragStart(voidContainer, { dataTransfer });
        await flush();
        fireEvent.dragEnd(voidContainer, { dataTransfer });
        await flush();
        await flush();

        const torn = windows.find((window) => window.label === 'torn-off-1');
        expect(torn && ids(torn)).toEqual(['a', 'b']);
        expect(ids(main)).toEqual([]);
        expect(main.log).toContain('released group main-1 to torn-off-1');
    });

    test('a tear-off is not a move the shared history records, and the new window reports cleanly', async () => {
        const orchestrator = new MemoryOrchestrator({
            dragEndGraceMs: 0,
            createWindow: (label) => {
                open(orchestrator, label);
            },
        });
        const moves: MoveEvent[] = [];
        orchestrator.onDidMove((notice) => moves.push(notice));
        const main = open(orchestrator, 'main', { tearOff: true });
        await flush();
        main.api.addPanel({ id: 'a', component: 'default' });
        main.api.addPanel({ id: 'b', component: 'default' });
        await flush();

        const dataTransfer = fakeDataTransfer();
        const tab = main.api.getPanel('b')?.view.tab.element as HTMLElement;
        fireEvent.dragStart(tab, { dataTransfer });
        await flush();
        fireEvent.dragEnd(tab, { dataTransfer });
        await flush();
        await flush();

        const torn = windows.find((window) => window.label === 'torn-off-1');
        expect(torn && ids(torn)).toEqual(['b']);
        expect(ids(main)).toEqual(['a']);
        expect(moves).toEqual([
            expect.objectContaining({
                panels: ['b'],
                from: 'main',
                to: 'torn-off-1',
                reason: 'tear-off',
            }),
        ]);
        // Neither window's layout report was refused as a duplicate...
        await flush();
        expect(main.log.concat(torn?.log ?? []).join('\n')).not.toMatch(
            /refused/
        );
        // ...and the history holds no half-recorded move: undo has nothing
        // to do and says so, rather than failing on an incomplete entry.
        expect(orchestrator.history.undoCount).toBe(0);
        main.mw.undo();
        await flush();
        expect(main.log).toContain('undo: Error: nothing to undo');
        expect(ids(main)).toEqual(['a']);
    });

    test('a transport written as a class keeps its methods and its this', async () => {
        const orchestrator = new MemoryOrchestrator({ dragEndGraceMs: 0 });
        class Bridge implements MultiWindowTransport {
            calls = 0;
            constructor(private readonly inner: MultiWindowTransport) {}
            private count<T>(value: T): T {
                this.calls += 1;
                return value;
            }
            windowId() {
                return this.count(this.inner.windowId());
            }
            startDrag(...args: Parameters<MultiWindowTransport['startDrag']>) {
                return this.count(this.inner.startDrag(...args));
            }
            peekDrag(session: string) {
                return this.count(this.inner.peekDrag(session));
            }
            claimDrag(session: string, to: string) {
                return this.count(this.inner.claimDrag(session, to));
            }
            endDrag(session: string, tearOff: boolean) {
                return this.count(this.inner.endDrag(session, tearOff));
            }
            onDidRelease(
                ...args: Parameters<MultiWindowTransport['onDidRelease']>
            ) {
                return this.count(this.inner.onDidRelease(...args));
            }
            takePendingDrag(label: string) {
                return this.count(this.inner.takePendingDrag(label));
            }
            reportMove(
                ...args: Parameters<MultiWindowTransport['reportMove']>
            ) {
                return this.count(this.inner.reportMove(...args));
            }
            onDidMove(...args: Parameters<MultiWindowTransport['onDidMove']>) {
                return this.count(this.inner.onDidMove(...args));
            }
            loadLayout(label: string) {
                return this.count(this.inner.loadLayout(label));
            }
            reportLayout(
                ...args: Parameters<MultiWindowTransport['reportLayout']>
            ) {
                return this.count(this.inner.reportLayout(...args));
            }
            reportLocalStep(label: string) {
                return this.count(this.inner.reportLocalStep(label));
            }
            undo() {
                return this.count(this.inner.undo());
            }
            redo() {
                return this.count(this.inner.redo());
            }
            getHistory() {
                return this.count(this.inner.getHistory());
            }
            onRequestApplyLayout(
                ...args: Parameters<
                    MultiWindowTransport['onRequestApplyLayout']
                >
            ) {
                return this.count(this.inner.onRequestApplyLayout(...args));
            }
            onRequestUndo(
                ...args: Parameters<MultiWindowTransport['onRequestUndo']>
            ) {
                return this.count(this.inner.onRequestUndo(...args));
            }
            onRequestRedo(
                ...args: Parameters<MultiWindowTransport['onRequestRedo']>
            ) {
                return this.count(this.inner.onRequestRedo(...args));
            }
            onDidChangeHistory(
                ...args: Parameters<MultiWindowTransport['onDidChangeHistory']>
            ) {
                return this.count(this.inner.onDidChangeHistory(...args));
            }
        }
        const bridge = new Bridge(orchestrator.connect('main'));
        const main = open(orchestrator, 'main');
        const handle = installMultiWindow(main.api, bridge, {
            debounceMs: 0,
        });
        await flush();
        const other = open(orchestrator, 'other');
        await flush();
        main.api.addPanel({ id: 'b', component: 'default' });
        other.api.addPanel({ id: 'x', component: 'default' });
        await flush();
        expect(bridge.calls).toBeGreaterThan(5);

        await dragAcross(main, 'b', other);
        expect(ids(other)).toEqual(['b', 'x']);
        expect(handle.windowId).toBe('main');
        handle.dispose();
    });

    test('a subscription that answers after dispose is dropped at once', async () => {
        const orchestrator = new MemoryOrchestrator();
        const transport = orchestrator.connect('main');
        const unlisten = jest.fn();
        let answer: (value: DockviewIDisposable) => void = () => undefined;
        const late = new Promise<DockviewIDisposable>((resolve) => {
            answer = resolve;
        });
        const main = open(orchestrator, 'main');
        const handle = installMultiWindow(
            main.api,
            { ...transport, onDidRelease: () => late },
            { workspace: false, history: false }
        );
        handle.dispose();
        answer({ dispose: unlisten });
        await flush();
        expect(unlisten).toHaveBeenCalledTimes(1);
    });

    test('key bindings leave text editing alone', async () => {
        const orchestrator = new MemoryOrchestrator();
        const transport = orchestrator.connect('main');
        const undo = jest.fn(async () => undefined);
        const main = open(orchestrator, 'main');
        const handle = installMultiWindow(
            main.api,
            { ...transport, undo },
            { history: { bindKeys: true }, workspace: false }
        );
        await flush();
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        fireEvent.keyDown(textarea, { key: 'z', ctrlKey: true });
        const prevented = new KeyboardEvent('keydown', {
            key: 'z',
            ctrlKey: true,
            cancelable: true,
            bubbles: true,
        });
        prevented.preventDefault();
        document.dispatchEvent(prevented);
        expect(undo).not.toHaveBeenCalled();
        fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true });
        expect(undo).toHaveBeenCalledTimes(1);
        textarea.remove();
        handle.dispose();
    });

    test('an orchestrator that cannot be reached at start still gets the defaults', async () => {
        const orchestrator = new MemoryOrchestrator();
        const transport = orchestrator.connect('main');
        const main = open(orchestrator, 'main');
        const handle = installMultiWindow(
            main.api,
            {
                ...transport,
                loadLayout: () => Promise.reject(new Error('not yet')),
            },
            {
                buildDefaults: () =>
                    main.api.addPanel({ id: 'home', component: 'default' }),
                onLog: (line) => main.log.push(line),
            }
        );
        await expect(handle.ready).resolves.toEqual({
            windowId: 'main',
            restored: false,
        });
        expect(ids(main)).toEqual(['home']);
        expect(main.log).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/^no layout from the orchestrator: /),
            ])
        );
        handle.dispose();
    });

    test('the workspace restores a window from the orchestrator and reports changes back', async () => {
        const seed = new MemoryOrchestrator();
        const seedWindow = open(seed, 'main');
        seedWindow.api.addPanel({ id: 'kept', component: 'default' });
        const layout = seedWindow.api.toJSON();
        seedWindow.dispose();
        windows.length = 0;

        const orchestrator = new MemoryOrchestrator({
            workspace: {
                version: 1,
                windows: [{ id: 'main', layout }],
            },
        });
        const changes: string[][] = [];
        orchestrator.onDidChangeWorkspace((state) =>
            changes.push(state.windows.map((window) => window.id))
        );
        const main = open(orchestrator, 'main');
        let defaultsBuilt = 0;
        const other = open(orchestrator, 'other', {
            buildDefaults: () => {
                defaultsBuilt += 1;
                other.api.addPanel({ id: 'kept', component: 'default' });
            },
        });
        await flush();
        await flush();

        expect(ids(main)).toEqual(['kept']);
        expect(main.log).toContain('restored layout with 1 panel(s)');
        expect(defaultsBuilt).toBe(1);
        // The second window's defaults collide with the first's panel, so
        // its report is refused and the workspace keeps the first.
        expect(
            other.log.some((line) =>
                line.includes('panel kept is already held by window main')
            )
        ).toBe(true);
        expect(changes.length).toBeGreaterThan(0);
        expect(orchestrator.windowIds).toEqual(['main', 'other']);

        orchestrator.disconnect('other');
        expect(orchestrator.windowIds).toEqual(['main']);
    });
});
