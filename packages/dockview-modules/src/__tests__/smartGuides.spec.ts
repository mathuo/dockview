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
});
