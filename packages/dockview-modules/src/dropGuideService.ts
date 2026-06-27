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

interface CompassCell {
    readonly position: Position;
    readonly left: number;
    readonly top: number;
    readonly size: number;
}

/**
 * The cross of cells centred in a `width`×`height` target, restricted to
 * `zones`. The resolver hit-tests against these rects and the widget paints
 * them — one geometry, so you aim at exactly the cell you see.
 */
function compassCells(
    width: number,
    height: number,
    zones: ReadonlySet<Position>
): CompassCell[] {
    const half = CELL / 2;
    const step = CELL + GAP;
    const cx = width / 2 - half;
    const cy = height / 2 - half;
    const offset: Record<Position, { left: number; top: number }> = {
        center: { left: cx, top: cy },
        top: { left: cx, top: cy - step },
        bottom: { left: cx, top: cy + step },
        left: { left: cx - step, top: cy },
        right: { left: cx + step, top: cy },
    };
    return INNER_CELLS.filter((p) => zones.has(p)).map((p) => ({
        position: p,
        left: offset[p].left,
        top: offset[p].top,
        size: CELL,
    }));
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
 * the configured `dndGuide.zones`. A miss (a dead corner) returns `null`.
 */
class CompassResolver implements PositionResolver {
    constructor(
        private readonly configuredZones: () =>
            | ReadonlySet<Position>
            | undefined
    ) {}

    resolve(args: PositionResolverArgs): PositionResolverResult | null {
        const configured = this.configuredZones();
        const zones = configured
            ? intersect(args.zones, configured)
            : args.zones;
        for (const cell of compassCells(args.width, args.height, zones)) {
            if (
                args.x >= cell.left &&
                args.x <= cell.left + cell.size &&
                args.y >= cell.top &&
                args.y <= cell.top + cell.size
            ) {
                return { position: cell.position };
            }
        }
        return null;
    }
}

/** The cross of cells painted over the hovered group's content area. */
class CompassWidget {
    private readonly _element: HTMLElement;

    constructor(container: HTMLElement) {
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

    render(zones: ReadonlySet<Position>): void {
        const doc = this._element.ownerDocument;
        const rect = this._element.getBoundingClientRect();
        const cells = compassCells(rect.width, rect.height, zones);
        this._element.replaceChildren();
        for (const cell of cells) {
            const el = doc.createElement('div');
            el.className = `dv-drop-guide-cell dv-drop-guide-cell-${cell.position}`;
            el.style.position = 'absolute';
            el.style.left = `${cell.left}px`;
            el.style.top = `${cell.top}px`;
            el.style.width = `${cell.size}px`;
            el.style.height = `${cell.size}px`;
            this._element.appendChild(el);
        }
    }

    dispose(): void {
        this._element.remove();
    }
}

/**
 * Drop Guide ("compass") — a VS Code-style aim-at-a-cell drop overlay for group
 * docking. While a panel/group is dragged over a group, a cross of cells is
 * painted over it and the dragged item snaps to whichever cell the cursor is
 * over (instead of the cursor-quadrant of the target). The actual drop
 * resolution + commit stay in core: the service installs a {@link CompassResolver}
 * at the drop-target seam and paints the widget; the existing overlay renders
 * the aimed cell's preview. Opt-in via `dndGuide` (default off → unchanged).
 *
 * Phase 1: inner cells (split/merge this group) on the group content target.
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

        this._resolver = new CompassResolver(() => this._configuredZones());

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

    private _onWillShowOverlay(e: DockviewWillShowOverlayLocationEvent): void {
        // Phase 1 covers the group content target only.
        if (!this._enabled || e.kind !== 'content' || !e.group) {
            return;
        }
        this._mount(e.group);
    }

    private _mount(group: DockviewGroupPanel): void {
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
        widget.render(configured ? intersect(all, configured) : all);
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
