import { DockviewEmitter as Emitter } from 'dockview-core';
import {
    DockviewGroupPanel,
    DockviewWillShowOverlayLocationEvent,
    Position,
    PositionResolverArgs,
} from 'dockview-core';
import { DropGuideService } from '../dropGuideService';

/**
 * Drop Guide ("compass"). The cell hit-test is pure geometry (container-relative
 * px) so it's driven directly; the widget + edge-preview + gating lifecycle is
 * driven via a mock `onWillShowOverlay` host signal.
 */
describe('drop guide', () => {
    let overlayEmitter: Emitter<DockviewWillShowOverlayLocationEvent>;
    let service: DropGuideService;
    let canDrop: (position: Position) => boolean;
    let dropOverlayEl: (group: DockviewGroupPanel) => HTMLElement | undefined;

    const make = (
        dndGuide: { zones?: Position[]; edges?: boolean } | boolean | undefined
    ): void => {
        overlayEmitter = new Emitter<DockviewWillShowOverlayLocationEvent>();
        canDrop = () => true;
        // the drop target measures the content container by default
        dropOverlayEl = (group) =>
            group.element.querySelector<HTMLElement>('.dv-content-container') ??
            undefined;
        service = new DropGuideService({
            options: { dndGuide } as any,
            onWillShowOverlay: overlayEmitter.event,
            canDropOnGroup: (_group, position) => canDrop(position),
            getDropOverlayElement: (group: DockviewGroupPanel) =>
                dropOverlayEl(group),
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
    test('hit-tests the pointer against the inner compass cells', () => {
        make(true);
        const r = service.resolver!;
        expect(r.resolve(args(100, 50))).toEqual({
            position: 'center',
            edge: false,
        });
        expect(r.resolve(args(58, 50))).toEqual({
            position: 'left',
            edge: false,
        });
        expect(r.resolve(args(140, 50))).toEqual({
            position: 'right',
            edge: false,
        });
        expect(r.resolve(args(100, 10))).toEqual({
            position: 'top',
            edge: false,
        });
        expect(r.resolve(args(100, 90))).toEqual({
            position: 'bottom',
            edge: false,
        });
    });

    // 400x400 target: outer top cell ≈ x[181,219] y[97,135] (one ring beyond
    // the inner top), flagged `edge` to dock against the whole layout.
    test('outer cells resolve with the edge flag', () => {
        make(true);
        expect(
            service.resolver!.resolve(args(200, 110, undefined, 400, 400))
        ).toEqual({ position: 'top', edge: true });
    });

    test('`edges: false` hides the outer cells', () => {
        make({ edges: false });
        // the outer-top point is no longer a cell
        expect(
            service.resolver!.resolve(args(200, 110, undefined, 400, 400))
        ).toBeNull();
        // ...but the inner ring still resolves
        expect(
            service.resolver!.resolve(args(200, 200, undefined, 400, 400))
        ).toEqual({ position: 'center', edge: false });
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
            edge: false,
        });
    });

    test('`dndGuide.zones` restricts which inner cells the compass offers', () => {
        make({ zones: ['center'] });
        // left is in the target's zones but excluded by the option
        expect(service.resolver!.resolve(args(58, 50))).toBeNull();
        expect(service.resolver!.resolve(args(100, 50))).toEqual({
            position: 'center',
            edge: false,
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
        // 5 inner cells + 4 outer (edge) cells
        expect(content.querySelectorAll('.dv-drop-guide-cell')).toHaveLength(9);
        expect(
            content.querySelectorAll('.dv-drop-guide-cell-edge')
        ).toHaveLength(4);

        // the drag ending tears the widget down
        window.dispatchEvent(new Event('pointerup'));
        expect(content.querySelector('.dv-drop-guide')).toBeNull();
    });

    test('paints cells in the drop-target outline frame, translated into its box', () => {
        make(true);
        const { group, content } = groupWithContent();
        // the drop target measures a frame offset from the content the widget
        // mounts in (e.g. dndPanelOverlay: 'group' includes the tab header).
        const outline = document.createElement('div');
        jest.spyOn(outline, 'getBoundingClientRect').mockReturnValue({
            left: 10,
            top: 40,
            width: 200,
            height: 100,
            right: 210,
            bottom: 140,
            x: 10,
            y: 40,
            toJSON: () => ({}),
        } as DOMRect);
        dropOverlayEl = () => outline;

        overlayEmitter.fire({
            kind: 'content',
            group,
        } as DockviewWillShowOverlayLocationEvent);

        // centre cell: (200/2 - 19) + dx(10), (100/2 - 19) + dy(40)
        const center = content.querySelector<HTMLElement>(
            '.dv-drop-guide-cell-center'
        )!;
        expect(center.style.left).toBe('91px');
        expect(center.style.top).toBe('71px');
    });

    test('per-cell gating hides cells the drop would reject', () => {
        make(true);
        const { group, content } = groupWithContent();
        canDrop = (p) => p !== 'center'; // the group rejects a tab-into

        overlayEmitter.fire({
            kind: 'content',
            group,
        } as DockviewWillShowOverlayLocationEvent);

        // centre inner cell hidden → 4 inner + 4 outer; edge cells are unaffected
        expect(content.querySelectorAll('.dv-drop-guide-cell')).toHaveLength(8);
        expect(content.querySelector('.dv-drop-guide-cell-center')).toBeNull();
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
