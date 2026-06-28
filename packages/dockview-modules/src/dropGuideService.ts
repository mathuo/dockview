import {
    DockviewCompositeDisposable as CompositeDisposable,
    DockviewIDisposable as IDisposable,
} from 'dockview-core';
import {
    DockviewGroupPanel,
    DockviewWillShowOverlayLocationEvent,
    Position,
    PositionResolver,
    PositionResolverArgs,
    PositionResolverResult,
} from 'dockview-core';
import { defineModule } from 'dockview-core';
import { IDropGuideHost, IDropGuideService } from 'dockview-core';
import { AdvancedDnDModule } from './advancedDnDService';

/** Size (px) of each compass cell + the gap between them. */
const CELL = 38;
const GAP = 4;

/** The inner drop cells, in render order. */
const INNER_CELLS: Position[] = ['center', 'top', 'bottom', 'left', 'right'];
/** The four directional cells (the inner ring's arms + the outer ring). */
const DIRECTIONS: Exclude<Position, 'center'>[] = [
    'top',
    'bottom',
    'left',
    'right',
];

interface CompassCell {
    readonly position: Position;
    readonly left: number;
    readonly top: number;
    readonly size: number;
    /** An outer cell that docks against the whole layout, not this group. */
    readonly edge: boolean;
}

const UNIT: Record<Position, { dx: number; dy: number }> = {
    center: { dx: 0, dy: 0 },
    top: { dx: 0, dy: -1 },
    bottom: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
};

/**
 * The cross of cells centred in a `width`×`height` target: the inner ring
 * (split/merge this group, restricted to `zones`) plus, when `includeEdges`, an
 * outer ring of directional cells that dock against the whole layout. The
 * resolver hit-tests these rects and the widget paints them — one geometry, so
 * you aim at exactly the cell you see.
 */
function compassCells(
    width: number,
    height: number,
    zones: ReadonlySet<Position>,
    includeEdges: boolean
): CompassCell[] {
    const half = CELL / 2;
    const step = CELL + GAP;
    const cx = width / 2 - half;
    const cy = height / 2 - half;
    const cell = (p: Position, ring: number, edge: boolean): CompassCell => ({
        position: p,
        left: cx + UNIT[p].dx * step * ring,
        top: cy + UNIT[p].dy * step * ring,
        size: CELL,
        edge,
    });
    const cells: CompassCell[] = [];
    for (const p of INNER_CELLS) {
        if (zones.has(p)) {
            cells.push(cell(p, p === 'center' ? 0 : 1, false));
        }
    }
    if (includeEdges) {
        for (const p of DIRECTIONS) {
            cells.push(cell(p, 2, true));
        }
    }
    return cells;
}

function intersect(
    a: ReadonlySet<Position>,
    b: ReadonlySet<Position>
): Set<Position> {
    return new Set([...a].filter((p) => b.has(p)));
}

/** Small disposable DOM listener helper (core's is not exported). */
function listen(
    target: EventTarget,
    type: string,
    handler: (e: Event) => void
): IDisposable {
    target.addEventListener(type, handler, true);
    return {
        dispose: () => target.removeEventListener(type, handler, true),
    };
}

/**
 * The {@link PositionResolver} the host installs at the drop-target seam in
 * place of the cursor-quadrant logic: hit-test the pointer against the compass
 * cells (centred cross), gated by the target's accepted zones intersected with
 * the configured `dndGuide.zones`. A miss (a dead corner) returns `null`. A
 * per-cell veto is enforced by the drop target itself (`canDisplayOverlay`).
 */
class CompassResolver implements PositionResolver {
    constructor(
        private readonly configuredZones: () =>
            | ReadonlySet<Position>
            | undefined,
        private readonly edgesEnabled: () => boolean
    ) {}

    resolve(args: PositionResolverArgs): PositionResolverResult | null {
        const configured = this.configuredZones();
        const zones = configured
            ? intersect(args.zones, configured)
            : args.zones;
        const cells = compassCells(
            args.width,
            args.height,
            zones,
            this.edgesEnabled()
        );
        for (const cell of cells) {
            if (
                args.x >= cell.left &&
                args.x <= cell.left + cell.size &&
                args.y >= cell.top &&
                args.y <= cell.top + cell.size
            ) {
                return { position: cell.position, edge: cell.edge };
            }
        }
        return null;
    }
}

/** The cross of cells painted over the hovered group's content area. */
class CompassWidget {
    private readonly _element: HTMLElement;
    private readonly _container: HTMLElement;
    private readonly _priorPosition: string;

    constructor(container: HTMLElement) {
        this._container = container;
        // Pin a stable containing block. The drop target sets `position:
        // relative` on this element only while an inner-cell overlay shows (the
        // `.dv-drop-target` class), and removes it for edge cells — without this
        // the absolutely-positioned compass re-anchors to a higher ancestor on
        // an outer cell and visibly jumps. Restored on dispose.
        this._priorPosition = container.style.position;
        container.style.position = 'relative';

        const doc = container.ownerDocument;
        const el = doc.createElement('div');
        el.className = 'dv-drop-guide';
        el.style.position = 'absolute';
        el.style.left = '0';
        el.style.top = '0';
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.pointerEvents = 'none';
        el.style.overflow = 'hidden';
        container.appendChild(el);
        this._element = el;
    }

    /**
     * Paint the cells `gate` accepts (so only legal drops show), centred on
     * `outline` — the frame the drop target measures — and translated into this
     * widget's own box so the cells line up with where a drop resolves even when
     * the two boxes differ (e.g. `dndPanelOverlay: 'group'` measures the whole
     * group, but the widget is mounted in the content container).
     */
    render(
        outline: HTMLElement,
        zones: ReadonlySet<Position>,
        includeEdges: boolean,
        gate: (cell: { position: Position; edge: boolean }) => boolean
    ): void {
        const doc = this._element.ownerDocument;
        const elRect = this._element.getBoundingClientRect();
        const oRect = outline.getBoundingClientRect();
        const dx = oRect.left - elRect.left;
        const dy = oRect.top - elRect.top;
        const cells = compassCells(
            oRect.width,
            oRect.height,
            zones,
            includeEdges
        ).filter(gate);
        this._element.replaceChildren();
        for (const cell of cells) {
            const el = doc.createElement('div');
            el.className =
                `dv-drop-guide-cell dv-drop-guide-cell-${cell.position}` +
                (cell.edge ? ' dv-drop-guide-cell-edge' : '');
            el.style.position = 'absolute';
            el.style.left = `${cell.left + dx}px`;
            el.style.top = `${cell.top + dy}px`;
            el.style.width = `${cell.size}px`;
            el.style.height = `${cell.size}px`;
            this._element.appendChild(el);
        }
    }

    dispose(): void {
        this._element.remove();
        this._container.style.position = this._priorPosition;
    }
}

/**
 * Drop Guide ("compass") — a VS Code-style aim-at-a-cell drop overlay for group
 * docking. While a panel/group is dragged over a group, a cross of cells is
 * painted over it and the dragged item snaps to whichever cell the cursor is
 * over (instead of the cursor-quadrant of the target). Drop resolution + commit
 * stay in core: the service installs a {@link CompassResolver} at the drop-target
 * seam and paints the widget. Opt-in via `dndGuide` (default off → unchanged).
 *
 * Inner cells split/merge the hovered group; the outer ring (`edge` cells) docks
 * against the whole layout (core routes `edge`-flagged drops to the layout edge).
 * Cells the drop would reject are hidden (per-cell gating).
 */
export class DropGuideService
    extends CompositeDisposable
    implements IDropGuideService
{
    private readonly _resolver: CompassResolver;
    private _mounted:
        | { group: DockviewGroupPanel; widget: CompassWidget }
        | undefined;
    private _endListeners: CompositeDisposable | undefined;

    constructor(private readonly host: IDropGuideHost) {
        super();

        this._resolver = new CompassResolver(
            () => this._configuredZones(),
            () => this._edgesEnabled()
        );

        this.addDisposables(
            this.host.onWillShowOverlay((e) => this._onWillShowOverlay(e)),
            { dispose: () => this._unmount() }
        );
    }

    /** Installed by the host only while the compass is enabled. */
    get resolver(): PositionResolver | undefined {
        return this._enabled ? this._resolver : undefined;
    }

    private get _enabled(): boolean {
        return !!this.host.options.dndGuide;
    }

    /** Cells the option restricts the compass to, or `undefined` for all. */
    private _configuredZones(): ReadonlySet<Position> | undefined {
        const guide = this.host.options.dndGuide;
        if (guide && typeof guide === 'object' && guide.zones) {
            return new Set(guide.zones);
        }
        return undefined;
    }

    /** Whether the outer whole-layout-edge cells are shown (default true). */
    private _edgesEnabled(): boolean {
        const guide = this.host.options.dndGuide;
        if (guide && typeof guide === 'object') {
            return guide.edges !== false;
        }
        return !!guide;
    }

    private _onWillShowOverlay(e: DockviewWillShowOverlayLocationEvent): void {
        // The compass covers the group content target.
        if (!this._enabled || e.kind !== 'content' || !e.group) {
            return;
        }
        this._mount(e.group, e.nativeEvent);
    }

    private _mount(
        group: DockviewGroupPanel,
        event: DragEvent | PointerEvent
    ): void {
        if (this._mounted?.group === group) {
            return; // already showing on this group
        }
        this._unmount();

        const content = group.element.querySelector<HTMLElement>(
            '.dv-content-container'
        );
        if (!content) {
            return;
        }

        const widget = new CompassWidget(content);
        const all = new Set(INNER_CELLS);
        const configured = this._configuredZones();
        // The frame the drop target measures (the whole group or just the
        // content, per `dndPanelOverlay`); fall back to the content container.
        const outline = this.host.getDropOverlayElement(group) ?? content;
        widget.render(
            outline,
            configured ? intersect(all, configured) : all,
            this._edgesEnabled(),
            // Hide cells the drop would reject. Outer (edge) cells are gated the
            // same way they commit: the drop target routes an edge drop to the
            // layout edge only after the group's own content veto passes, so the
            // compass must apply that veto here too or it would paint a cell that
            // does nothing on drop.
            (cell) => this.host.canDropOnGroup(group, cell.position, event)
        );
        this._mounted = { group, widget };

        // The drag has no "left everything" event; tear the widget down when the
        // drag ends (drop / dragend / pointerup / cancel) in the group's window.
        const win = group.element.ownerDocument.defaultView ?? window;
        const end = (): void => this._unmount();
        this._endListeners = new CompositeDisposable(
            listen(win, 'drop', end),
            listen(win, 'dragend', end),
            listen(win, 'pointerup', end),
            listen(win, 'pointercancel', end)
        );
    }

    private _unmount(): void {
        this._endListeners?.dispose();
        this._endListeners = undefined;
        this._mounted?.widget.dispose();
        this._mounted = undefined;
    }
}

export const DropGuideModule = defineModule<'dropGuideService', IDropGuideHost>(
    {
        name: 'DropGuide',
        serviceKey: 'dropGuideService',
        dependsOn: [AdvancedDnDModule],
        create: (host) => new DropGuideService(host),
    }
);
