import { DockviewEmitter as Emitter } from 'dockview-core';
import {
    Box,
    DockviewGroupPanel,
    FloatingGroupDragContext,
    ISmartGuidesHost,
    SmartGuidesOptions,
} from 'dockview-core';
import { SmartGuidesService } from '../smartGuidesService';

/**
 * Smart Guides — Phase 1 (single-axis edge snapping against other floats).
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
    // Distinct identity per drag — the service keys per-drag state by group.
    const group = {} as DockviewGroupPanel;

    const make = (smartGuides: SmartGuidesOptions | undefined): void => {
        container = document.createElement('div');
        document.body.appendChild(container);
        endEmitter = new Emitter<DockviewGroupPanel>();
        const host: ISmartGuidesHost = {
            options: { smartGuides } as any,
            getFloatingContainer: () => container,
            onDidEndFloatingGroupDrag: endEmitter.event,
        };
        service = new SmartGuidesService(host);
    };

    const ctx = (proposed: Box, others: Box[]): FloatingGroupDragContext => ({
        group,
        proposed,
        container: { width: 1000, height: 1000 },
        others,
    });

    const guideLine = (): HTMLElement | null =>
        container.querySelector('.dv-smart-guide');

    afterEach(() => {
        service?.dispose();
        container?.remove();
    });

    test('snaps a float left edge to another float left edge within snapDistance', () => {
        make({});
        const other: Box = { left: 100, top: 50, width: 200, height: 150 };
        // dragged left edge at 106 — 6px from the other float's left edge (100),
        // inside the 8px default threshold.
        const result = service.transformFloatingGroupDrag(
            ctx({ left: 106, top: 400, width: 50, height: 50 }, [other])
        );

        expect(result).toEqual({ top: 400, left: 100 });

        // a single vertical guide line is painted at x = 100
        const line = guideLine();
        expect(line).toBeTruthy();
        expect(line!.style.display).toBe('block');
        expect(line!.style.left).toBe('100px');
        expect(line!.style.width).toBe('1px');
    });

    test('snaps the top edge (Y axis) and draws a horizontal guide', () => {
        make({});
        const other: Box = { left: 100, top: 200, width: 200, height: 150 };
        // dragged top edge at 195 — 5px from the other float's top edge (200);
        // horizontally far away, so the only snap is on Y.
        const result = service.transformFloatingGroupDrag(
            ctx({ left: 600, top: 195, width: 50, height: 50 }, [other])
        );

        expect(result).toEqual({ top: 200, left: 600 });
        const line = guideLine();
        expect(line!.style.display).toBe('block');
        expect(line!.style.top).toBe('200px');
        expect(line!.style.height).toBe('1px');
    });

    test('picks the nearest edge when several are in range', () => {
        make({ snapDistance: 10 });
        const other: Box = { left: 100, top: 50, width: 60, height: 150 };
        // left probe 104 → Δ4 to edge 100; right probe 154 → Δ6 to edge 160.
        // The nearer (left, Δ4) wins.
        const result = service.transformFloatingGroupDrag(
            ctx({ left: 104, top: 400, width: 50, height: 50 }, [other])
        );
        expect(result).toEqual({ top: 400, left: 100 });
        expect(guideLine()!.style.left).toBe('100px');
    });

    test('no snap outside snapDistance — pass-through, guide hidden', () => {
        make({});
        const other: Box = { left: 100, top: 50, width: 200, height: 150 };
        const result = service.transformFloatingGroupDrag(
            ctx({ left: 130, top: 500, width: 50, height: 50 }, [other])
        );
        expect(result).toBeUndefined();
        expect(guideLine()!.style.display).toBe('none');
    });

    test('inert when `smartGuides` is unset — no overlay, no adjustment', () => {
        make(undefined);
        const other: Box = { left: 100, top: 50, width: 200, height: 150 };
        const result = service.transformFloatingGroupDrag(
            ctx({ left: 106, top: 400, width: 50, height: 50 }, [other])
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
        make({ showGuides: false });
        const result = service.transformFloatingGroupDrag(
            ctx({ left: 106, top: 400, width: 50, height: 50 }, [
                { left: 100, top: 50, width: 200, height: 150 },
            ])
        );
        expect(result).toEqual({ top: 400, left: 100 });
        expect(guideLine()!.style.display).toBe('none');
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
        make({});
        const others: Box[] = [{ left: 100, top: 50, width: 200, height: 150 }];
        const first = ctx(
            { left: 106, top: 400, width: 50, height: 50 },
            others
        );
        service.transformFloatingGroupDrag(first);

        // A later frame whose `others` snapshot has drifted must NOT rebuild the
        // candidate set — the float at x=100 is still the snap target.
        const second = ctx({ left: 104, top: 400, width: 50, height: 50 }, [
            { left: 500, top: 50, width: 200, height: 150 },
        ]);
        const result = service.transformFloatingGroupDrag(second);
        expect(result).toEqual({ top: 400, left: 100 });
    });
});
