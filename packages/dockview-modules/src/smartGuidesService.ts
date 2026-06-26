import {
    DockviewCompositeDisposable as CompositeDisposable,
    DockviewEmitter as Emitter,
    DockviewEvent as Event,
} from 'dockview-core';
import {
    DockviewGroupPanel,
    DragModifiers,
    FloatingGroupDragContext,
    SmartGuidesOptions,
    SmartGuidesSnapEvent,
    SmartGuidesSnapPosition,
    SmartGuidesSnapTogetherEvent,
    SnapModifier,
} from 'dockview-core';
import { defineModule, FloatingGroupModule } from 'dockview-core';
import { ISmartGuidesHost, ISmartGuidesService } from 'dockview-core';

/** Fraction of the perpendicular extents that must overlap for an edge to read
 *  as an adjacency (dock-beside) rather than a glancing touch. */
const ADJACENCY_OVERLAP = 0.5;

interface ResolvedOptions {
    enabled: boolean;
    snapDistance: number;
    releaseDistance: number;
    showGuides: boolean;
    snapTogether: boolean;
    disableSnapModifier: SnapModifier | false;
    className: string | undefined;
    snapFloats: boolean;
    snapContainer: boolean;
    containerInset: number | undefined;
    snapSplitters: boolean;
}

function resolveOptions(o: SmartGuidesOptions | undefined): ResolvedOptions {
    return {
        // Present + not explicitly disabled. Absent ⇒ inert (pass-through).
        enabled: !!o && o.enabled !== false,
        snapDistance: o?.snapDistance ?? 8,
        releaseDistance: o?.releaseDistance ?? 4,
        showGuides: o?.showGuides ?? true,
        snapTogether: o?.snapTogether ?? true,
        disableSnapModifier: o?.disableSnapModifier ?? 'alt',
        className: o?.className,
        snapFloats: o?.snapTargets?.floats ?? true,
        snapContainer: o?.snapTargets?.container ?? true,
        containerInset: o?.snapTargets?.containerInset,
        snapSplitters: o?.snapTargets?.splitters ?? false,
    };
}

interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}

/** A pending dock/merge intent the drag is currently suggesting. */
interface MergeIntent {
    readonly target: DockviewGroupPanel;
    readonly position: SmartGuidesSnapPosition;
    readonly preview: Rect;
}

type CandidateKind = 'edge' | 'center';
type CandidateSource = 'float' | 'container' | 'splitter';

/** A 1-D alignment line on one axis: its container-relative px + provenance
 *  (used to prioritise which line wins a contested snap). */
interface Candidate {
    readonly coord: number;
    readonly kind: CandidateKind;
    readonly source: CandidateSource;
}

/** A coordinate on the dragged box that can land on a candidate. */
interface Probe {
    readonly coord: number;
    readonly kind: CandidateKind;
}

interface AxisResult {
    readonly coord: number;
    readonly delta: number;
}

/**
 * The DOM layer that paints guide lines for one drag. Pools the line elements
 * so a frame only mutates inline styles (no churn of create/remove per line).
 */
class GuideLayer {
    private readonly _element: HTMLElement;
    private readonly _lines: HTMLElement[] = [];
    private _preview: HTMLElement | undefined;

    constructor(container: HTMLElement, className: string | undefined) {
        const doc = container.ownerDocument;
        const el = doc.createElement('div');
        el.className = 'dv-smart-guides';
        if (className) {
            el.classList.add(className);
        }
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

    render(
        lines: { axis: 'x' | 'y'; coord: number }[],
        size: { width: number; height: number }
    ): void {
        for (let i = 0; i < lines.length; i++) {
            const line = this._lineAt(i);
            const { axis, coord } = lines[i];
            line.style.display = 'block';
            if (axis === 'x') {
                // Vertical line spanning the container height at x = coord.
                line.style.left = `${coord}px`;
                line.style.top = '0';
                line.style.width = '1px';
                line.style.height = `${size.height}px`;
            } else {
                // Horizontal line spanning the container width at y = coord.
                line.style.top = `${coord}px`;
                line.style.left = '0';
                line.style.height = '1px';
                line.style.width = `${size.width}px`;
            }
        }
        // Hide any pooled lines not used this frame.
        for (let i = lines.length; i < this._lines.length; i++) {
            this._lines[i].style.display = 'none';
        }
    }

    /** Show (or hide, when `box` is undefined) the dock/merge drop-preview. */
    renderPreview(box: Rect | undefined): void {
        if (!box) {
            if (this._preview) {
                this._preview.style.display = 'none';
            }
            return;
        }
        const preview = this._ensurePreview();
        preview.style.display = 'block';
        preview.style.left = `${box.left}px`;
        preview.style.top = `${box.top}px`;
        preview.style.width = `${box.width}px`;
        preview.style.height = `${box.height}px`;
    }

    clear(): void {
        for (const line of this._lines) {
            line.style.display = 'none';
        }
        this.renderPreview(undefined);
    }

    dispose(): void {
        this._element.remove();
    }

    private _ensurePreview(): HTMLElement {
        if (!this._preview) {
            const preview = this._element.ownerDocument.createElement('div');
            preview.className = 'dv-smart-guide-preview';
            preview.style.position = 'absolute';
            preview.style.boxSizing = 'border-box';
            preview.style.backgroundColor =
                'var(--dv-smart-guides-preview-color, rgba(31, 156, 240, 0.18))';
            preview.style.border =
                '1px solid var(--dv-smart-guides-color, #1f9cf0)';
            this._element.appendChild(preview);
            this._preview = preview;
        }
        return this._preview;
    }

    private _lineAt(i: number): HTMLElement {
        let line = this._lines[i];
        if (!line) {
            line = this._element.ownerDocument.createElement('div');
            line.className = 'dv-smart-guide';
            line.style.position = 'absolute';
            // Themable via a CSS var, with a sensible default so it works untouched.
            line.style.backgroundColor =
                'var(--dv-smart-guides-color, #1f9cf0)';
            this._element.appendChild(line);
            this._lines[i] = line;
        }
        return line;
    }
}

/** Per-drag state: the candidate lines (built once at drag start, since only
 *  the dragged float moves) + the engaged candidate per axis (hysteresis). */
interface DragSession {
    readonly x: Candidate[];
    readonly y: Candidate[];
    readonly layer: GuideLayer;
    /** Other floats with identity + box, for snap-together (built once). */
    readonly targets: readonly { group: DockviewGroupPanel; box: Rect }[];
    engagedX: number | undefined;
    engagedY: number | undefined;
    /** The dock/merge suggestion active this frame, committed on drop. */
    pendingMerge: MergeIntent | undefined;
}

const SOURCE_RANK: Record<CandidateSource, number> = {
    float: 0,
    container: 1,
    splitter: 2,
};

/**
 * Smart Guides — Figma-style alignment guides + magnetic snapping for floating
 * groups.
 *
 * The float drag loop stays fully owned by `Overlay`; this service is a pure
 * consumer. The component composes it into the loop's position-transform, so
 * each pointer-move frame the proposed, container-relative box is offered here
 * and an adjusted top-left returned. X and Y are resolved independently against
 * the other floats' and the container's edges + centers, with asymmetric
 * engage/release hysteresis to stop boundary oscillation; every alignment the
 * snapped box lands on is painted as a guide line. With `smartGuides` unset the
 * transform is a pass-through and no overlay is created.
 */
export class SmartGuidesService
    extends CompositeDisposable
    implements ISmartGuidesService
{
    private readonly _sessions = new Map<DockviewGroupPanel, DragSession>();
    /** Runtime option overrides (from `setEnabled` / `updateOptions`), merged
     *  over the host's `smartGuides` option. */
    private _override: Partial<SmartGuidesOptions> = {};

    private readonly _onDidSnapFloat = new Emitter<SmartGuidesSnapEvent>();
    readonly onDidSnapFloat: Event<SmartGuidesSnapEvent> =
        this._onDidSnapFloat.event;

    private readonly _onDidSnapTogether =
        new Emitter<SmartGuidesSnapTogetherEvent>();
    readonly onDidSnapTogether: Event<SmartGuidesSnapTogetherEvent> =
        this._onDidSnapTogether.event;

    constructor(private readonly host: ISmartGuidesHost) {
        super();

        this.addDisposables(
            this._onDidSnapFloat,
            this._onDidSnapTogether,
            // Drag end (pointerup / cancel): commit any pending snap-together,
            // then tear the per-drag guides down.
            this.host.onDidEndFloatingGroupDrag((group) =>
                this._commitAndEnd(group)
            ),
            {
                dispose: () => {
                    for (const group of [...this._sessions.keys()]) {
                        this._endSession(group);
                    }
                },
            }
        );
    }

    get enabled(): boolean {
        return this._opts.enabled;
    }

    setEnabled(enabled: boolean): void {
        this.updateOptions({ enabled });
    }

    updateOptions(options: Partial<SmartGuidesOptions>): void {
        this._override = {
            ...this._override,
            ...options,
            // Merge `snapTargets` rather than replacing the whole sub-object.
            snapTargets: options.snapTargets
                ? { ...this._override.snapTargets, ...options.snapTargets }
                : this._override.snapTargets,
        };
    }

    private get _opts(): ResolvedOptions {
        const base = this.host.options.smartGuides;
        if (!base && Object.keys(this._override).length === 0) {
            return resolveOptions(undefined);
        }
        return resolveOptions({
            ...base,
            ...this._override,
            snapTargets: {
                ...base?.snapTargets,
                ...this._override.snapTargets,
            },
        });
    }

    /** Whether the configured disable-modifier is held this frame. */
    private _gated(opts: ResolvedOptions, modifiers: DragModifiers): boolean {
        switch (opts.disableSnapModifier) {
            case 'alt':
                return modifiers.altKey;
            case 'ctrl':
                return modifiers.ctrlKey;
            case 'meta':
                return modifiers.metaKey;
            case 'shift':
                return modifiers.shiftKey;
            default:
                return false;
        }
    }

    transformFloatingGroupDrag(
        context: FloatingGroupDragContext
    ): { top: number; left: number } | void {
        const opts = this._opts;
        if (!opts.enabled) {
            // Disabled mid-drag (or never on): drop any guides, pass through.
            this._endSession(context.group);
            return;
        }

        // Modifier gate (default Alt): suspend snapping + guides while held; the
        // float follows the pointer freely and re-engages on release.
        if (this._gated(opts, context.modifiers)) {
            const existing = this._sessions.get(context.group);
            if (existing) {
                existing.layer.clear();
                existing.engagedX = undefined;
                existing.engagedY = undefined;
                existing.pendingMerge = undefined;
            }
            return;
        }

        const session =
            this._sessions.get(context.group) ??
            this._startSession(context, opts);

        const { proposed } = context;
        const resX = this._resolveAxis(
            session.x,
            this._probes('x', proposed),
            session.engagedX,
            opts
        );
        const resY = this._resolveAxis(
            session.y,
            this._probes('y', proposed),
            session.engagedY,
            opts
        );
        session.engagedX = resX?.coord;
        session.engagedY = resY?.coord;

        const snappedBox: Rect = {
            left: proposed.left + (resX?.delta ?? 0),
            top: proposed.top + (resY?.delta ?? 0),
            width: proposed.width,
            height: proposed.height,
        };

        // Snap-together: a dock/merge suggestion, committed on drop.
        const merge = opts.snapTogether
            ? this._detectSnapTogether(snappedBox, session.targets, opts)
            : undefined;
        session.pendingMerge = merge;

        if (opts.showGuides) {
            session.layer.render(
                this._guideLines(session, snappedBox),
                context.container
            );
            session.layer.renderPreview(merge?.preview);
        } else {
            session.layer.clear();
        }

        if (!resX && !resY) {
            return;
        }
        return { top: snappedBox.top, left: snappedBox.left };
    }

    private _startSession(
        context: FloatingGroupDragContext,
        opts: ResolvedOptions
    ): DragSession {
        const x: Candidate[] = [];
        const y: Candidate[] = [];
        const pushBox = (
            box: { left: number; top: number; width: number; height: number },
            source: CandidateSource
        ): void => {
            x.push(
                { coord: box.left, kind: 'edge', source },
                { coord: box.left + box.width / 2, kind: 'center', source },
                { coord: box.left + box.width, kind: 'edge', source }
            );
            y.push(
                { coord: box.top, kind: 'edge', source },
                { coord: box.top + box.height / 2, kind: 'center', source },
                { coord: box.top + box.height, kind: 'edge', source }
            );
        };

        // Other floats (the dragged one is already excluded from `others`).
        if (opts.snapFloats) {
            for (const box of context.others) {
                pushBox(box, 'float');
            }
        }
        // The container's own edges + center, plus optional inset margin lines.
        if (opts.snapContainer) {
            pushBox(
                {
                    left: 0,
                    top: 0,
                    width: context.container.width,
                    height: context.container.height,
                },
                'container'
            );
            const inset = opts.containerInset;
            if (typeof inset === 'number' && inset > 0) {
                x.push(
                    { coord: inset, kind: 'edge', source: 'container' },
                    {
                        coord: context.container.width - inset,
                        kind: 'edge',
                        source: 'container',
                    }
                );
                y.push(
                    { coord: inset, kind: 'edge', source: 'container' },
                    {
                        coord: context.container.height - inset,
                        kind: 'edge',
                        source: 'container',
                    }
                );
            }
        }
        // The grid's splitters behind the float (a vertical sash → an x line,
        // a horizontal sash → a y line).
        if (opts.snapSplitters) {
            for (const r of this.host.getGridSplitterRects()) {
                if (r.width <= r.height) {
                    x.push({
                        coord: r.left + r.width / 2,
                        kind: 'edge',
                        source: 'splitter',
                    });
                } else {
                    y.push({
                        coord: r.top + r.height / 2,
                        kind: 'edge',
                        source: 'splitter',
                    });
                }
            }
        }

        const layer = new GuideLayer(
            this.host.getFloatingContainer(),
            opts.className
        );
        const session: DragSession = {
            x,
            y,
            layer,
            targets: this.host.getFloatingGroupSnapshots(context.group),
            engagedX: undefined,
            engagedY: undefined,
            pendingMerge: undefined,
        };
        this._sessions.set(context.group, session);
        return session;
    }

    private _probes(
        axis: 'x' | 'y',
        proposed: { left: number; top: number; width: number; height: number }
    ): Probe[] {
        const start = axis === 'x' ? proposed.left : proposed.top;
        const extent = axis === 'x' ? proposed.width : proposed.height;
        return [
            { coord: start, kind: 'edge' },
            { coord: start + extent / 2, kind: 'center' },
            { coord: start + extent, kind: 'edge' },
        ];
    }

    /**
     * Resolve one axis: keep the engaged candidate until the pointer moves past
     * the release threshold, otherwise acquire the best in-range candidate. The
     * best is ranked edge-over-center, then source priority, then nearest.
     */
    private _resolveAxis(
        candidates: Candidate[],
        probes: Probe[],
        engaged: number | undefined,
        opts: ResolvedOptions
    ): AxisResult | undefined {
        // Sticky: stay on the engaged line until past snapDistance + release.
        if (engaged !== undefined) {
            const delta = this._nearestDelta(engaged, probes);
            if (
                delta !== undefined &&
                Math.abs(delta) <= opts.snapDistance + opts.releaseDistance
            ) {
                return { coord: engaged, delta };
            }
        }

        // Acquire: the highest-priority candidate within the engage threshold.
        let best:
            | { coord: number; delta: number; key: [number, number, number] }
            | undefined;
        for (const c of candidates) {
            for (const p of probes) {
                const delta = c.coord - p.coord;
                if (Math.abs(delta) > opts.snapDistance) {
                    continue;
                }
                const key: [number, number, number] = [
                    (p.kind === 'center' ? 1 : 0) +
                        (c.kind === 'center' ? 1 : 0),
                    SOURCE_RANK[c.source],
                    Math.abs(delta),
                ];
                if (best === undefined || this._keyLess(key, best.key)) {
                    best = { coord: c.coord, delta, key };
                }
            }
        }
        return best ? { coord: best.coord, delta: best.delta } : undefined;
    }

    /** Smallest signed delta from any probe to `coord`. */
    private _nearestDelta(coord: number, probes: Probe[]): number | undefined {
        let best: number | undefined;
        for (const p of probes) {
            const delta = coord - p.coord;
            if (best === undefined || Math.abs(delta) < Math.abs(best)) {
                best = delta;
            }
        }
        return best;
    }

    private _keyLess(
        a: [number, number, number],
        b: [number, number, number]
    ): boolean {
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return a[i] < b[i];
            }
        }
        return false;
    }

    /** Every candidate line the (already snapped) box's probes land on, so two
     *  simultaneous alignments (e.g. left edges AND tops) draw two guides. */
    private _guideLines(
        session: DragSession,
        snapped: { left: number; top: number; width: number; height: number }
    ): { axis: 'x' | 'y'; coord: number }[] {
        const lines: { axis: 'x' | 'y'; coord: number }[] = [];
        const collect = (axis: 'x' | 'y', candidates: Candidate[]): void => {
            const probes = this._probes(axis, snapped);
            const seen = new Set<number>();
            for (const c of candidates) {
                if (seen.has(c.coord)) {
                    continue;
                }
                if (probes.some((p) => Math.abs(c.coord - p.coord) < 0.5)) {
                    seen.add(c.coord);
                    lines.push({ axis, coord: c.coord });
                }
            }
        };
        collect('x', session.x);
        collect('y', session.y);
        return lines;
    }

    /**
     * Detect a dock/merge intent for the snapped box against the other floats:
     * a tab-strip overlap (tops flush + stacked) suggests a **center** merge
     * into a shared tabset; an edge flush against a target's opposite edge —
     * with ≥ 50% perpendicular overlap — suggests docking **beside** it. Returns
     * the first match (with the drop-preview rect), or `undefined`.
     */
    private _detectSnapTogether(
        box: Rect,
        targets: readonly { group: DockviewGroupPanel; box: Rect }[],
        opts: ResolvedOptions
    ): MergeIntent | undefined {
        const d = edges(box);
        for (const t of targets) {
            const e = edges(t.box);
            const within = (a: number, b: number): boolean =>
                Math.abs(a - b) <= opts.snapDistance;
            const hOverlap = overlapRatio(d.left, d.right, e.left, e.right);
            const vOverlap = overlapRatio(d.top, d.bottom, e.top, e.bottom);

            // Tabset merge: tops flush + the boxes stacked (strong overlap).
            if (within(d.top, e.top) && hOverlap >= ADJACENCY_OVERLAP) {
                return { target: t.group, position: 'center', preview: t.box };
            }
            // Edge adjacency: a dragged edge meets the target's opposite edge.
            if (within(d.right, e.left) && vOverlap >= ADJACENCY_OVERLAP) {
                return {
                    target: t.group,
                    position: 'left',
                    preview: half(t.box, 'left'),
                };
            }
            if (within(d.left, e.right) && vOverlap >= ADJACENCY_OVERLAP) {
                return {
                    target: t.group,
                    position: 'right',
                    preview: half(t.box, 'right'),
                };
            }
            if (within(d.bottom, e.top) && hOverlap >= ADJACENCY_OVERLAP) {
                return {
                    target: t.group,
                    position: 'top',
                    preview: half(t.box, 'top'),
                };
            }
            if (within(d.top, e.bottom) && hOverlap >= ADJACENCY_OVERLAP) {
                return {
                    target: t.group,
                    position: 'bottom',
                    preview: half(t.box, 'bottom'),
                };
            }
        }
        return undefined;
    }

    private _commitAndEnd(group: DockviewGroupPanel): void {
        const session = this._sessions.get(group);
        if (!session) {
            return;
        }
        const pending = session.pendingMerge;
        const axes: ('x' | 'y')[] = [];
        if (session.engagedX !== undefined) {
            axes.push('x');
        }
        if (session.engagedY !== undefined) {
            axes.push('y');
        }
        // Tear the overlay down before the layout mutates.
        this._endSession(group);
        // A merge supersedes a plain alignment for the drop's outcome.
        if (pending) {
            this.host.mergeFloatInto(group, pending.target, pending.position);
            this._onDidSnapTogether.fire({
                dragged: group,
                target: pending.target,
                position: pending.position,
            });
        } else if (axes.length > 0) {
            this._onDidSnapFloat.fire({ group, axes });
        }
    }

    private _endSession(group: DockviewGroupPanel): void {
        const session = this._sessions.get(group);
        if (!session) {
            return;
        }
        this._sessions.delete(group);
        session.layer.dispose();
    }
}

interface Edges {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

function edges(r: Rect): Edges {
    return {
        left: r.left,
        right: r.left + r.width,
        top: r.top,
        bottom: r.top + r.height,
    };
}

/** Overlap of `[a1,a2]` and `[b1,b2]` as a fraction of the smaller extent. */
function overlapRatio(a1: number, a2: number, b1: number, b2: number): number {
    const overlap = Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
    const smaller = Math.min(a2 - a1, b2 - b1);
    return smaller > 0 ? overlap / smaller : 0;
}

/** The half of `r` the dragged float would occupy when docked at `side`. */
function half(r: Rect, side: 'left' | 'right' | 'top' | 'bottom'): Rect {
    switch (side) {
        case 'left':
            return { ...r, width: r.width / 2 };
        case 'right':
            return { ...r, left: r.left + r.width / 2, width: r.width / 2 };
        case 'top':
            return { ...r, height: r.height / 2 };
        case 'bottom':
            return { ...r, top: r.top + r.height / 2, height: r.height / 2 };
    }
}

export const SmartGuidesModule = defineModule<
    'smartGuidesService',
    ISmartGuidesHost
>({
    name: 'SmartGuides',
    serviceKey: 'smartGuidesService',
    dependsOn: [FloatingGroupModule],
    create: (host) => new SmartGuidesService(host),
});
