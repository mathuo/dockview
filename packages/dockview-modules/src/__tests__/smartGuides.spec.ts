import { DockviewEmitter as Emitter } from 'dockview-core';
import {
    Box,
    DockviewGroupPanel,
    DragModifiers,
    FloatingGroupDragContext,
    ISmartGuidesHost,
    SmartGuidesOptions,
    SmartGuidesSnapPosition,
    SmartGuidesSnapTogetherEvent,
} from 'dockview-core';
import { SmartGuidesService } from '../smartGuidesService';

const NO_MODIFIERS: DragModifiers = {
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
};

/**
 * Smart Guides — independent X/Y edge + center snapping against other floats and
 * the container, with engage/release hysteresis.
 *
 * Driven at the service boundary with a mock host + synthetic drag contexts:
 * the snap math is pure geometry (container-relative px), so it doesn't need a
 * real browser layout. The component-side composition (and byte-identical
 * pass-through when the module is absent) is covered by `moduleRemovability`.
 */
describe('smart guides', () => {
    let container: HTMLElement;
    let endEmitter: Emitter<DockviewGroupPanel>;
    let service: SmartGuidesService;
    let snapshots: { group: DockviewGroupPanel; box: Box }[];
    let splitterRects: Box[];
    let mergeCalls: {
        dragged: DockviewGroupPanel;
        target: DockviewGroupPanel;
        position: SmartGuidesSnapPosition;
    }[];
    // Distinct identity per drag — the service keys per-drag state by group.
    const group = {} as DockviewGroupPanel;

    const make = (
        smartGuides: SmartGuidesOptions | undefined,
        floats: { group: DockviewGroupPanel; box: Box }[] = []
    ): void => {
        container = document.createElement('div');
        document.body.appendChild(container);
        endEmitter = new Emitter<DockviewGroupPanel>();
        snapshots = floats;
        splitterRects = [];
        mergeCalls = [];
        const host: ISmartGuidesHost = {
            options: { smartGuides } as any,
            getFloatingContainer: () => container,
            onDidEndFloatingGroupDrag: endEmitter.event,
            getFloatingGroupSnapshots: () => snapshots,
            getGridSplitterRects: () => splitterRects,
            mergeFloatInto: (dragged, target, position) => {
                mergeCalls.push({ dragged, target, position });
            },
        };
        service = new SmartGuidesService(host);
    };

    const ctx = (
        proposed: Box,
        others: Box[],
        modifiers: DragModifiers = NO_MODIFIERS
    ): FloatingGroupDragContext => ({
        group,
        proposed,
        container: { width: 1000, height: 1000 },
        others,
        modifiers,
    });

    // Lines the layer is currently painting (pooled hidden ones excluded).
    const visibleLines = (): HTMLElement[] =>
        Array.from(
            container.querySelectorAll<HTMLElement>('.dv-smart-guide')
        ).filter((l) => l.style.display === 'block');

    // Float-only options — isolate from the container edges that are on by default.
    const floatsOnly = (
        extra: SmartGuidesOptions = {}
    ): SmartGuidesOptions => ({
        snapTargets: { container: false },
        ...extra,
    });

    afterEach(() => {
        service?.dispose();
        container?.remove();
    });

    test('snaps a float left edge to another float left edge within snapDistance', () => {
        make({});
        const other: Box = { left: 100, top: 50, width: 200, height: 150 };
        // dragged left edge at 106 — 6px from the other float's left edge (100).
        const result = service.transformFloatingGroupDrag(
            ctx({ left: 106, top: 400, width: 50, height: 50 }, [other])
        );

        expect(result).toEqual({ top: 400, left: 100 });
        const lines = visibleLines();
        expect(lines).toHaveLength(1);
        expect(lines[0].style.left).toBe('100px');
        expect(lines[0].style.width).toBe('1px');
    });

    test('snaps the top edge (Y axis) and draws a horizontal guide', () => {
        make(floatsOnly());
        const other: Box = { left: 100, top: 200, width: 200, height: 150 };
        // top edge at 195 — 5px from the other float's top (200); far on X.
        const result = service.transformFloatingGroupDrag(
            ctx({ left: 600, top: 195, width: 50, height: 50 }, [other])
        );

        expect(result).toEqual({ top: 200, left: 600 });
        const lines = visibleLines();
        expect(lines).toHaveLength(1);
        expect(lines[0].style.top).toBe('200px');
        expect(lines[0].style.height).toBe('1px');
    });

    test('resolves X and Y independently — two simultaneous guides', () => {
        make(floatsOnly());
        // One neighbour: align the dragged float's left edge AND top edge to it.
        const other: Box = { left: 100, top: 100, width: 200, height: 150 };
        const result = service.transformFloatingGroupDrag(
            ctx({ left: 105, top: 104, width: 50, height: 50 }, [other])
        );

        expect(result).toEqual({ top: 100, left: 100 });
        const lines = visibleLines();
        expect(lines).toHaveLength(2);
        // a vertical guide at x=100 and a horizontal guide at y=100
        expect(
            lines.some(
                (l) => l.style.width === '1px' && l.style.left === '100px'
            )
        ).toBe(true);
        expect(
            lines.some(
                (l) => l.style.height === '1px' && l.style.top === '100px'
            )
        ).toBe(true);
    });

    test('snaps to the container edge', () => {
        make({});
        // near the right container edge (1000); no floats in play.
        const result = service.transformFloatingGroupDrag(
            ctx({ left: 945, top: 400, width: 50, height: 50 }, [])
        );
        // right edge 995 → snaps to 1000, so left becomes 950.
        expect(result).toEqual({ top: 400, left: 950 });
        const lines = visibleLines();
        expect(lines).toHaveLength(1);
        expect(lines[0].style.left).toBe('1000px');
    });

    test('snaps centers together', () => {
        make(floatsOnly());
        const other: Box = { left: 100, top: 50, width: 200, height: 150 };
        // dragged center 202 vs the other float centre 200 — only the centres
        // line up (no edge is in range).
        const result = service.transformFloatingGroupDrag(
            ctx({ left: 172, top: 400, width: 60, height: 50 }, [other])
        );
        expect(result).toEqual({ top: 400, left: 170 });
        expect(visibleLines()[0].style.left).toBe('200px');
    });

    test('container inset adds margin guide lines', () => {
        make({ snapTargets: { floats: false, containerInset: 20 } });
        // left edge at 24 → snaps to the 20px inset line.
        const result = service.transformFloatingGroupDrag(
            ctx({ left: 24, top: 400, width: 50, height: 50 }, [])
        );
        expect(result).toEqual({ top: 400, left: 20 });
        expect(visibleLines()[0].style.left).toBe('20px');
    });

    test('hysteresis — stays engaged within release, frees past it (no oscillation)', () => {
        make(floatsOnly());
        const other: Box = { left: 100, top: 50, width: 200, height: 150 };
        const at = (left: number) =>
            service.transformFloatingGroupDrag(
                ctx({ left, top: 400, width: 50, height: 50 }, [other])
            );

        // engage exactly on the edge
        expect(at(100)).toEqual({ top: 400, left: 100 });
        // 10px away (> snapDistance 8, < snapDistance+release 12): stays snapped
        expect(at(110)).toEqual({ top: 400, left: 100 });
        // 13px away (> 12): releases — and is now out of the 8px engage range
        expect(at(113)).toBeUndefined();
    });

    test('engages at the snap distance, not beyond', () => {
        make(floatsOnly());
        const other: Box = { left: 100, top: 50, width: 200, height: 150 };
        // fresh drag, exactly 8px away → engages
        expect(
            service.transformFloatingGroupDrag(
                ctx({ left: 108, top: 400, width: 50, height: 50 }, [other])
            )
        ).toEqual({ top: 400, left: 100 });

        // fresh drag, 9px away → no snap
        make(floatsOnly());
        expect(
            service.transformFloatingGroupDrag(
                ctx({ left: 109, top: 400, width: 50, height: 50 }, [other])
            )
        ).toBeUndefined();
    });

    test('no snap outside snapDistance — pass-through, no guides', () => {
        make({});
        const other: Box = { left: 100, top: 50, width: 200, height: 150 };
        const result = service.transformFloatingGroupDrag(
            ctx({ left: 130, top: 400, width: 50, height: 50 }, [other])
        );
        expect(result).toBeUndefined();
        expect(visibleLines()).toHaveLength(0);
    });

    test('a guide reappears after the snap is lost and re-acquired', () => {
        // Guards the per-frame write dedup: a re-acquired alignment must redraw
        // rather than being skipped as "unchanged".
        make(floatsOnly());
        const other: Box = { left: 100, top: 50, width: 200, height: 150 };
        const at = (left: number) =>
            service.transformFloatingGroupDrag(
                ctx({ left, top: 400, width: 50, height: 50 }, [other])
            );

        at(106); // engage x=100
        expect(visibleLines()).toHaveLength(1);
        at(500); // well clear of every edge → guide hidden
        expect(visibleLines()).toHaveLength(0);
        at(106); // re-acquire the same edge → guide shown again
        expect(visibleLines()).toHaveLength(1);
        expect(visibleLines()[0].style.left).toBe('100px');
    });

    test('inert when `smartGuides` is unset — no overlay, no adjustment', () => {
        make(undefined);
        const result = service.transformFloatingGroupDrag(
            ctx({ left: 106, top: 400, width: 50, height: 50 }, [
                { left: 100, top: 50, width: 200, height: 150 },
            ])
        );
        expect(result).toBeUndefined();
        expect(container.querySelector('.dv-smart-guides')).toBeNull();
    });

    test('`enabled: false` snaps nothing', () => {
        make({ enabled: false });
        const result = service.transformFloatingGroupDrag(
            ctx({ left: 106, top: 400, width: 50, height: 50 }, [
                { left: 100, top: 50, width: 200, height: 150 },
            ])
        );
        expect(result).toBeUndefined();
        expect(container.querySelector('.dv-smart-guides')).toBeNull();
    });

    test('`showGuides: false` still snaps but draws no visible guide', () => {
        make(floatsOnly({ showGuides: false }));
        const result = service.transformFloatingGroupDrag(
            ctx({ left: 106, top: 400, width: 50, height: 50 }, [
                { left: 100, top: 50, width: 200, height: 150 },
            ])
        );
        expect(result).toEqual({ top: 400, left: 100 });
        expect(visibleLines()).toHaveLength(0);
    });

    test('drag end tears the guide overlay down', () => {
        make({});
        service.transformFloatingGroupDrag(
            ctx({ left: 106, top: 400, width: 50, height: 50 }, [
                { left: 100, top: 50, width: 200, height: 150 },
            ])
        );
        expect(container.querySelector('.dv-smart-guides')).toBeTruthy();

        endEmitter.fire(group);
        expect(container.querySelector('.dv-smart-guides')).toBeNull();
    });

    test('candidates are built once per drag, not per frame', () => {
        make(floatsOnly());
        const others: Box[] = [{ left: 100, top: 50, width: 200, height: 150 }];
        service.transformFloatingGroupDrag(
            ctx({ left: 106, top: 400, width: 50, height: 50 }, others)
        );

        // A later frame whose `others` snapshot has drifted must NOT rebuild the
        // candidate set — the float at x=100 is still the snap target.
        const result = service.transformFloatingGroupDrag(
            ctx({ left: 104, top: 400, width: 50, height: 50 }, [
                { left: 500, top: 50, width: 200, height: 150 },
            ])
        );
        expect(result).toEqual({ top: 400, left: 100 });
    });

    // --- snap-together ---

    const targetGroup = { id: 'target' } as DockviewGroupPanel;
    const preview = (): HTMLElement | null =>
        container.querySelector('.dv-smart-guide-preview');
    // Disable alignment (no float/container candidates) so the snapped box is
    // the raw proposed box — the snap-together geometry is then exact.
    const noAlign = (extra: SmartGuidesOptions = {}): SmartGuidesOptions => ({
        snapTargets: { floats: false, container: false },
        ...extra,
    });

    test('edge-adjacency suggests docking beside the target and commits on drop', () => {
        const t: Box = { left: 300, top: 100, width: 200, height: 200 };
        make(noAlign(), [{ group: targetGroup, box: t }]);

        // dragged right edge (150+150=300) meets the target's left edge (300),
        // with full vertical overlap → dock on the target's left.
        service.transformFloatingGroupDrag(
            ctx({ left: 150, top: 100, width: 150, height: 200 }, [])
        );

        const p = preview();
        expect(p).toBeTruthy();
        expect(p!.style.display).toBe('block');
        // preview is the left half of the target
        expect(p!.style.left).toBe('300px');
        expect(p!.style.width).toBe('100px');
        expect(p!.style.height).toBe('200px');
        expect(mergeCalls).toHaveLength(0);

        endEmitter.fire(group);
        expect(mergeCalls).toEqual([
            { dragged: group, target: targetGroup, position: 'left' },
        ]);
    });

    test('overlapping tab strips suggest a center (tabset) merge', () => {
        const t: Box = { left: 100, top: 100, width: 200, height: 200 };
        make(noAlign(), [{ group: targetGroup, box: t }]);

        // tops flush (100) and the boxes stacked (90% horizontal overlap).
        service.transformFloatingGroupDrag(
            ctx({ left: 120, top: 100, width: 200, height: 200 }, [])
        );

        const p = preview()!;
        expect(p.style.display).toBe('block');
        // the whole target is previewed for a tabset merge
        expect(p.style.left).toBe('100px');
        expect(p.style.width).toBe('200px');

        endEmitter.fire(group);
        expect(mergeCalls).toEqual([
            { dragged: group, target: targetGroup, position: 'center' },
        ]);
    });

    test('`snapTogether: false` never suggests or commits a merge', () => {
        const t: Box = { left: 300, top: 100, width: 200, height: 200 };
        make(noAlign({ snapTogether: false }), [
            { group: targetGroup, box: t },
        ]);

        service.transformFloatingGroupDrag(
            ctx({ left: 150, top: 100, width: 150, height: 200 }, [])
        );
        expect(preview()?.style.display ?? 'none').toBe('none');

        endEmitter.fire(group);
        expect(mergeCalls).toHaveLength(0);
    });

    test('moving away from a target clears the pending merge before drop', () => {
        const t: Box = { left: 300, top: 100, width: 200, height: 200 };
        make(noAlign(), [{ group: targetGroup, box: t }]);

        // engage adjacency...
        service.transformFloatingGroupDrag(
            ctx({ left: 150, top: 100, width: 150, height: 200 }, [])
        );
        // ...then drag well clear of it
        service.transformFloatingGroupDrag(
            ctx({ left: 10, top: 600, width: 150, height: 200 }, [])
        );
        expect(preview()!.style.display).toBe('none');

        endEmitter.fire(group);
        expect(mergeCalls).toHaveLength(0);
    });

    test('an edge that barely overlaps the target is not an adjacency', () => {
        // dragged right edge meets target left edge, but only 40% vertical
        // overlap (< 50%) → no dock suggestion.
        const t: Box = { left: 300, top: 100, width: 200, height: 200 };
        make(noAlign(), [{ group: targetGroup, box: t }]);

        service.transformFloatingGroupDrag(
            ctx({ left: 150, top: 280, width: 150, height: 50 }, [])
        );
        expect(preview()?.style.display ?? 'none').toBe('none');

        endEmitter.fire(group);
        expect(mergeCalls).toHaveLength(0);
    });

    // --- modifier gate ---

    const alt: DragModifiers = { ...NO_MODIFIERS, altKey: true };

    test('holding the disable modifier (default Alt) suspends snapping', () => {
        make(floatsOnly());
        const other: Box = { left: 100, top: 50, width: 200, height: 150 };
        const box: Box = { left: 106, top: 400, width: 50, height: 50 };

        // Alt held → no snap, no guides
        expect(
            service.transformFloatingGroupDrag(ctx(box, [other], alt))
        ).toBeUndefined();
        expect(visibleLines()).toHaveLength(0);

        // released → snaps again on the next frame
        expect(service.transformFloatingGroupDrag(ctx(box, [other]))).toEqual({
            top: 400,
            left: 100,
        });
    });

    test('the disable modifier is configurable', () => {
        make(floatsOnly({ disableSnapModifier: 'shift' }));
        const other: Box = { left: 100, top: 50, width: 200, height: 150 };
        const box: Box = { left: 106, top: 400, width: 50, height: 50 };

        // Alt is no longer the gate → still snaps with Alt held
        expect(
            service.transformFloatingGroupDrag(ctx(box, [other], alt))
        ).toEqual({ top: 400, left: 100 });
        // Shift held → suspended
        expect(
            service.transformFloatingGroupDrag(
                ctx(box, [other], { ...NO_MODIFIERS, shiftKey: true })
            )
        ).toBeUndefined();
    });

    test('`disableSnapModifier: false` ignores modifiers', () => {
        make(floatsOnly({ disableSnapModifier: false }));
        const other: Box = { left: 100, top: 50, width: 200, height: 150 };
        expect(
            service.transformFloatingGroupDrag(
                ctx(
                    { left: 106, top: 400, width: 50, height: 50 },
                    [other],
                    alt
                )
            )
        ).toEqual({ top: 400, left: 100 });
    });

    // --- splitter targets ---

    test('snaps to a grid splitter when `snapTargets.splitters` is on', () => {
        make({
            snapTargets: { floats: false, container: false, splitters: true },
        });
        // a vertical sash at x = 300
        splitterRects = [{ left: 300, top: 0, width: 0, height: 1000 }];

        const result = service.transformFloatingGroupDrag(
            ctx({ left: 305, top: 400, width: 50, height: 50 }, [])
        );
        expect(result).toEqual({ top: 400, left: 300 });
        expect(visibleLines()[0].style.left).toBe('300px');
    });

    test('splitters are off by default', () => {
        make({ snapTargets: { floats: false, container: false } });
        splitterRects = [{ left: 300, top: 0, width: 0, height: 1000 }];
        expect(
            service.transformFloatingGroupDrag(
                ctx({ left: 305, top: 400, width: 50, height: 50 }, [])
            )
        ).toBeUndefined();
    });

    // --- runtime options ---

    test('setEnabled toggles snapping at runtime', () => {
        make(floatsOnly());
        const other: Box = { left: 100, top: 50, width: 200, height: 150 };
        const box: Box = { left: 106, top: 400, width: 50, height: 50 };

        service.setEnabled(false);
        expect(service.enabled).toBe(false);
        expect(
            service.transformFloatingGroupDrag(ctx(box, [other]))
        ).toBeUndefined();

        service.setEnabled(true);
        expect(service.enabled).toBe(true);
        expect(service.transformFloatingGroupDrag(ctx(box, [other]))).toEqual({
            top: 400,
            left: 100,
        });
    });

    test('updateOptions merges an override at runtime', () => {
        make(floatsOnly());
        const other: Box = { left: 100, top: 50, width: 200, height: 150 };
        // 25px away — outside the default 8px, inside an overridden 30px.
        service.updateOptions({ snapDistance: 30 });
        expect(
            service.transformFloatingGroupDrag(
                ctx({ left: 125, top: 400, width: 50, height: 50 }, [other])
            )
        ).toEqual({ top: 400, left: 100 });
    });

    test('setEnabled(true) activates even when `smartGuides` was unset', () => {
        make(undefined);
        service.setEnabled(true);
        expect(
            service.transformFloatingGroupDrag(
                ctx({ left: 106, top: 400, width: 50, height: 50 }, [
                    { left: 100, top: 50, width: 200, height: 150 },
                ])
            )
        ).toEqual({ top: 400, left: 100 });
    });

    // --- events ---

    test('onDidSnapFloat fires on drop with the snapped axes', () => {
        make(floatsOnly());
        const events: { axes: ('x' | 'y')[] }[] = [];
        service.onDidSnapFloat((e) => events.push({ axes: e.axes }));

        service.transformFloatingGroupDrag(
            ctx({ left: 106, top: 400, width: 50, height: 50 }, [
                { left: 100, top: 50, width: 200, height: 150 },
            ])
        );
        endEmitter.fire(group);
        expect(events).toEqual([{ axes: ['x'] }]);
    });

    test('onDidSnapTogether fires on a merge drop (and not onDidSnapFloat)', () => {
        const t: Box = { left: 300, top: 100, width: 200, height: 200 };
        make(noAlign(), [{ group: targetGroup, box: t }]);
        const together: SmartGuidesSnapTogetherEvent[] = [];
        const aligned: unknown[] = [];
        service.onDidSnapTogether((e) => together.push(e));
        service.onDidSnapFloat((e) => aligned.push(e));

        service.transformFloatingGroupDrag(
            ctx({ left: 150, top: 100, width: 150, height: 200 }, [])
        );
        endEmitter.fire(group);

        expect(together).toEqual([
            { dragged: group, target: targetGroup, position: 'left' },
        ]);
        expect(aligned).toHaveLength(0);
    });
});
