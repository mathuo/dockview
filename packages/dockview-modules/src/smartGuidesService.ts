import { DockviewCompositeDisposable as CompositeDisposable } from 'dockview-core';
import {
    DockviewGroupPanel,
    FloatingGroupDragContext,
    SmartGuidesOptions,
} from 'dockview-core';
import { defineModule, FloatingGroupModule } from 'dockview-core';
import { ISmartGuidesHost, ISmartGuidesService } from 'dockview-core';

interface ResolvedOptions {
    enabled: boolean;
    snapDistance: number;
    releaseDistance: number;
    showGuides: boolean;
    className: string | undefined;
    snapFloats: boolean;
    snapContainer: boolean;
    containerInset: number | undefined;
}

function resolveOptions(o: SmartGuidesOptions | undefined): ResolvedOptions {
    return {
        // Present + not explicitly disabled. Absent ⇒ inert (pass-through).
        enabled: !!o && o.enabled !== false,
        snapDistance: o?.snapDistance ?? 8,
        releaseDistance: o?.releaseDistance ?? 4,
        showGuides: o?.showGuides ?? true,
        className: o?.className,
        snapFloats: o?.snapTargets?.floats ?? true,
        snapContainer: o?.snapTargets?.container ?? true,
        containerInset: o?.snapTargets?.containerInset,
    };
}

type CandidateKind = 'edge' | 'center';
type CandidateSource = 'float' | 'container';

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

    clear(): void {
        for (const line of this._lines) {
            line.style.display = 'none';
        }
    }

    dispose(): void {
        this._element.remove();
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
    engagedX: number | undefined;
    engagedY: number | undefined;
}

const SOURCE_RANK: Record<CandidateSource, number> = { float: 0, container: 1 };

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

    constructor(private readonly host: ISmartGuidesHost) {
        super();

        this.addDisposables(
            // Drag end (pointerup / cancel) tears the per-drag guides down.
            this.host.onDidEndFloatingGroupDrag((group) =>
                this._endSession(group)
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

    private get _opts(): ResolvedOptions {
        return resolveOptions(this.host.options.smartGuides);
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

        const snappedLeft = proposed.left + (resX?.delta ?? 0);
        const snappedTop = proposed.top + (resY?.delta ?? 0);

        if (opts.showGuides) {
            session.layer.render(
                this._guideLines(session, {
                    left: snappedLeft,
                    top: snappedTop,
                    width: proposed.width,
                    height: proposed.height,
                }),
                context.container
            );
        } else {
            session.layer.clear();
        }

        if (!resX && !resY) {
            return;
        }
        return { top: snappedTop, left: snappedLeft };
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

        const layer = new GuideLayer(
            this.host.getFloatingContainer(),
            opts.className
        );
        const session: DragSession = {
            x,
            y,
            layer,
            engagedX: undefined,
            engagedY: undefined,
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

    private _endSession(group: DockviewGroupPanel): void {
        const session = this._sessions.get(group);
        if (!session) {
            return;
        }
        this._sessions.delete(group);
        session.layer.dispose();
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
