import { DockviewEmitter as Emitter } from 'dockview-core';
import {
    DockviewGroupPanel,
    DockviewWillShowOverlayLocationEvent,
    Position,
    PositionResolverArgs,
} from 'dockview-core';
import { DropGuideService } from '../dropGuideService';

/**
 * Drop Guide ("compass") — Phase 1. The cell hit-test is pure geometry
 * (container-relative px) so it's driven directly; the widget lifecycle is
 * driven via a mock `onWillShowOverlay` host signal.
 */
describe('drop guide', () => {
    let overlayEmitter: Emitter<DockviewWillShowOverlayLocationEvent>;
    let service: DropGuideService;

    const make = (
        dndGuide: { zones?: Position[] } | boolean | undefined
    ): void => {
        overlayEmitter = new Emitter<DockviewWillShowOverlayLocationEvent>();
        service = new DropGuideService({
            options: { dndGuide } as any,
            onWillShowOverlay: overlayEmitter.event,
        });
    };

    const args = (
        x: number,
        y: number,
        zones: Position[] = ['top', 'bottom', 'left', 'right', 'center'],
        width = 200,
        height = 100
    ): PositionResolverArgs => ({
        x,
        y,
        width,
        height,
        zones: new Set(zones),
        event: {} as any,
    });

    afterEach(() => service?.dispose());

    // 200x100 target: centre cell ≈ x[81,119] y[31,69]; left ≈ x[39,77];
    // right ≈ x[123,161]; top ≈ y[-11,27]; bottom ≈ y[73,111] (all x[81,119]).
    test('hit-tests the pointer against the compass cells', () => {
        make(true);
        const r = service.resolver!;
        expect(r.resolve(args(100, 50))).toEqual({ position: 'center' });
        expect(r.resolve(args(58, 50))).toEqual({ position: 'left' });
        expect(r.resolve(args(140, 50))).toEqual({ position: 'right' });
        expect(r.resolve(args(100, 10))).toEqual({ position: 'top' });
        expect(r.resolve(args(100, 90))).toEqual({ position: 'bottom' });
    });

    test('a dead corner (no cell) resolves to null', () => {
        make(true);
        expect(service.resolver!.resolve(args(10, 10))).toBeNull();
    });

    test("honours the target's accepted zones", () => {
        make(true);
        // left cell is not offered when the target only accepts center
        expect(service.resolver!.resolve(args(58, 50, ['center']))).toBeNull();
        expect(service.resolver!.resolve(args(100, 50, ['center']))).toEqual({
            position: 'center',
        });
    });

    test('`dndGuide.zones` restricts which cells the compass offers', () => {
        make({ zones: ['center'] });
        // left is in the target's zones but excluded by the option
        expect(service.resolver!.resolve(args(58, 50))).toBeNull();
        expect(service.resolver!.resolve(args(100, 50))).toEqual({
            position: 'center',
        });
    });

    test('the resolver is absent when `dndGuide` is unset (default quadrant)', () => {
        make(undefined);
        expect(service.resolver).toBeUndefined();
    });

    // --- widget lifecycle ---

    const groupWithContent = (): {
        group: DockviewGroupPanel;
        content: HTMLElement;
    } => {
        const content = document.createElement('div');
        content.className = 'dv-content-container';
        const element = document.createElement('div');
        element.appendChild(content);
        document.body.appendChild(element);
        return { group: { element } as DockviewGroupPanel, content };
    };

    test('paints the compass over the hovered group, torn down on drop', () => {
        make(true);
        const { group, content } = groupWithContent();

        overlayEmitter.fire({
            kind: 'content',
            group,
        } as DockviewWillShowOverlayLocationEvent);

        const guide = content.querySelector('.dv-drop-guide');
        expect(guide).toBeTruthy();
        expect(content.querySelectorAll('.dv-drop-guide-cell')).toHaveLength(5);

        // the drag ending tears the widget down
        window.dispatchEvent(new Event('pointerup'));
        expect(content.querySelector('.dv-drop-guide')).toBeNull();
    });

    test('does not paint a non-content overlay or when disabled', () => {
        make(true);
        const { group, content } = groupWithContent();
        // a tab/header overlay is not the compass target
        overlayEmitter.fire({
            kind: 'tab',
            group,
        } as DockviewWillShowOverlayLocationEvent);
        expect(content.querySelector('.dv-drop-guide')).toBeNull();

        make(undefined);
        const off = groupWithContent();
        overlayEmitter.fire({
            kind: 'content',
            group: off.group,
        } as DockviewWillShowOverlayLocationEvent);
        expect(off.content.querySelector('.dv-drop-guide')).toBeNull();
    });
});
