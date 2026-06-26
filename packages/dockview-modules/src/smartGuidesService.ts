import { DockviewCompositeDisposable as CompositeDisposable } from 'dockview-core';
import {
    DockviewGroupPanel,
    FloatingGroupDragContext,
    SmartGuidesOptions,
} from 'dockview-core';
import { defineModule, FloatingGroupModule } from 'dockview-core';
import { ISmartGuidesHost, ISmartGuidesService } from 'dockview-core';

function resolveOptions(o: SmartGuidesOptions | undefined): {
    enabled: boolean;
    snapDistance: number;
    showGuides: boolean;
    className: string | undefined;
} {
    return {
        // Present + not explicitly disabled. Absent ⇒ inert (pass-through).
        enabled: !!o && o.enabled !== false,
        snapDistance: o?.snapDistance ?? 8,
        showGuides: o?.showGuides ?? true,
        className: o?.className,
    };
}

/** A 1-D alignment line: the axis it constrains and its container-relative px. */
interface Candidate {
    readonly axis: 'x' | 'y';
    readonly coord: number;
}

/** Per-drag state: the candidate lines (built once at drag start, since only
 *  the dragged float moves) and the DOM overlay that paints the active guide. */
interface DragSession {
    readonly xCandidates: number[];
    readonly yCandidates: number[];
    readonly layer: HTMLElement;
    readonly line: HTMLElement;
}

/**
 * Smart Guides — Figma-style alignment guides + magnetic snapping for floating
 * groups (Phase 1: single-axis edge snapping against other floats).
 *
 * The float drag loop stays fully owned by `Overlay`; this service is a pure
 * consumer. The component composes it into the loop's position-transform
 * (`transformFloatingGroupDrag`), so each pointer-move frame the proposed,
 * container-relative box is offered here and an adjusted top-left returned. A
 * winning snap also paints one alignment line in the floating container's
 * coordinate space. With `smartGuides` unset the transform is a pass-through
 * and no overlay is created.
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

    private get _opts() {
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
            this._sessions.get(context.group) ?? this._startSession(context);

        const { proposed } = context;
        const xProbes = [proposed.left, proposed.left + proposed.width];
        const yProbes = [proposed.top, proposed.top + proposed.height];

        // Single best snap across BOTH axes (Phase 1): the smallest in-threshold
        // edge delta wins; ties are resolved by encounter order (x before y).
        let best: { axis: 'x' | 'y'; delta: number; coord: number } | undefined;
        const consider = (
            axis: 'x' | 'y',
            candidates: number[],
            probes: number[]
        ): void => {
            for (const coord of candidates) {
                for (const probe of probes) {
                    const delta = coord - probe;
                    if (
                        Math.abs(delta) <= opts.snapDistance &&
                        (best === undefined ||
                            Math.abs(delta) < Math.abs(best.delta))
                    ) {
                        best = { axis, delta, coord };
                    }
                }
            }
        };
        consider('x', session.xCandidates, xProbes);
        consider('y', session.yCandidates, yProbes);

        if (best === undefined) {
            this._hideGuide(session);
            return;
        }

        if (opts.showGuides) {
            this._showGuide(session, best.axis, best.coord, context.container);
        } else {
            this._hideGuide(session);
        }

        return {
            top: proposed.top + (best.axis === 'y' ? best.delta : 0),
            left: proposed.left + (best.axis === 'x' ? best.delta : 0),
        };
    }

    private _startSession(context: FloatingGroupDragContext): DragSession {
        const xCandidates: number[] = [];
        const yCandidates: number[] = [];
        // Each other float contributes its leading + trailing edges on each
        // axis. The dragged float is already excluded from `context.others`.
        for (const box of context.others) {
            xCandidates.push(box.left, box.left + box.width);
            yCandidates.push(box.top, box.top + box.height);
        }

        const container = this.host.getFloatingContainer();
        const doc = container.ownerDocument;

        const layer = doc.createElement('div');
        layer.className = 'dv-smart-guides';
        if (this._opts.className) {
            layer.classList.add(this._opts.className);
        }
        layer.style.position = 'absolute';
        layer.style.left = '0';
        layer.style.top = '0';
        layer.style.width = '100%';
        layer.style.height = '100%';
        layer.style.pointerEvents = 'none';
        layer.style.overflow = 'hidden';

        const line = doc.createElement('div');
        line.className = 'dv-smart-guide';
        line.style.position = 'absolute';
        line.style.display = 'none';
        // Themable via a CSS var, with a sensible default so it works untouched.
        line.style.backgroundColor = 'var(--dv-smart-guides-color, #1f9cf0)';
        layer.appendChild(line);

        container.appendChild(layer);

        const session: DragSession = { xCandidates, yCandidates, layer, line };
        this._sessions.set(context.group, session);
        return session;
    }

    private _showGuide(
        session: DragSession,
        axis: 'x' | 'y',
        coord: number,
        container: { width: number; height: number }
    ): void {
        const { line } = session;
        line.style.display = 'block';
        if (axis === 'x') {
            // Vertical line spanning the container height at x = coord.
            line.style.left = `${coord}px`;
            line.style.top = '0';
            line.style.width = '1px';
            line.style.height = `${container.height}px`;
        } else {
            // Horizontal line spanning the container width at y = coord.
            line.style.top = `${coord}px`;
            line.style.left = '0';
            line.style.height = '1px';
            line.style.width = `${container.width}px`;
        }
    }

    private _hideGuide(session: DragSession): void {
        session.line.style.display = 'none';
    }

    private _endSession(group: DockviewGroupPanel): void {
        const session = this._sessions.get(group);
        if (!session) {
            return;
        }
        this._sessions.delete(group);
        session.layer.remove();
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
