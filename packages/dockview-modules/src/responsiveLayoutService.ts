import {
    DockviewBreakpointChangeEvent,
    DockviewCompositeDisposable as CompositeDisposable,
    DockviewEmitter as Emitter,
    DockviewEvent as Event,
    DockviewResponsiveOptions,
    IResponsiveLayoutHost,
    IResponsiveLayoutService,
    ReflowRule,
    SerializedDockview,
    defineModule,
} from 'dockview-core';
import { BreakpointResolver } from './responsiveBreakpointResolver';
import { SizeObserver } from './responsiveSizeObserver';
import { CanonicalStore } from './responsiveCanonicalStore';
import { deriveLayout } from './responsiveReflowEngine';
import { rebaseCanonical } from './responsiveRebase';

type RebaseMode = 'auto' | 'discard' | 'manual';

const DEFAULT_DEBOUNCE_MS = 120;

/**
 * The responsive-layout service.
 *
 * - Phase 1: resolves the active breakpoint from the container width (with
 *   hysteresis + debounce) and fires `onDidBreakpointChange`.
 * - Phase 2: the canonical/derived split — holds the canonical ("wide") layout
 *   and serializes *it* (not the collapsed view) through `toJSON`.
 * - Phase 3: `deriveLayout` projects a collapsed layout via `collapseToTabs`.
 * - Phase 4: **applies** the derived layout to the live component. On the first
 *   collapse it freezes the current layout as canonical, then reconciles the
 *   live tree to each breakpoint's derived target (reusing panel instances).
 *   Widening back to the canonical band restores the frozen layout exactly. A
 *   reentrancy guard stops the apply's own layout events from re-triggering,
 *   and reflow defers while a group is maximized.
 * - Phase 6: **rebase** — edits made while collapsed (close / add / activate)
 *   are folded back onto canonical (by panel id) so widening keeps them.
 *   `rebase: 'discard'` treats them as ephemeral; `'manual'` fires
 *   `onDidRebaseConflict` and leaves canonical untouched.
 */
export class ResponsiveLayoutService
    extends CompositeDisposable
    implements IResponsiveLayoutService
{
    private resolver: BreakpointResolver | undefined;
    private observer: SizeObserver | undefined;
    private options: DockviewResponsiveOptions | undefined;
    private _activeBreakpoint: string | undefined;

    private readonly _canonical = new CanonicalStore();
    /** True once the live layout is a derived (collapsed) projection. */
    private _derived = false;
    /** The breakpoint whose reflow has actually been applied to the live tree —
     *  distinct from `_activeBreakpoint`, so a layout that *starts* inside a
     *  band (never crossing a boundary) still applies on the first settle. */
    private _appliedBreakpoint: string | undefined;
    /** Guards against the apply's own layout events re-triggering a reflow. */
    private _applying = false;
    /** How edits made while collapsed are folded back onto canonical. */
    private _rebaseMode: RebaseMode = 'auto';

    private readonly _onDidBreakpointChange =
        new Emitter<DockviewBreakpointChangeEvent>();
    readonly onDidBreakpointChange: Event<DockviewBreakpointChangeEvent> =
        this._onDidBreakpointChange.event;

    private readonly _onDidRebaseConflict = new Emitter<{ reason: string }>();
    readonly onDidRebaseConflict: Event<{ reason: string }> =
        this._onDidRebaseConflict.event;

    get activeBreakpoint(): string | undefined {
        return this._activeBreakpoint;
    }

    constructor(private readonly host: IResponsiveLayoutHost) {
        super();

        this.addDisposables(
            this._onDidBreakpointChange,
            this._onDidRebaseConflict
        );

        this.configure(host.options.responsive);

        this.addDisposables(
            // re-settle on every layout/size ping; the observer debounces so a
            // continuous drag-resize only resolves once it settles
            this.host.onDidLayoutChange(() => {
                if (!this._applying) {
                    this.observer?.signal();
                }
            }),
            // a fresh (external) load replaces the canonical baseline
            this.host.onDidLayoutFromJSON(() => {
                if (!this._applying) {
                    this._derived = false;
                    this._appliedBreakpoint = undefined;
                    this._canonical.clear();
                    this.reflow();
                }
            }),
            // fold user edits made while collapsed back onto canonical
            this.host.onDidMutateLayout(() => {
                if (!this._applying && this._derived) {
                    this.rebase();
                }
            })
        );
    }

    /** (Re)build the resolver + observer from the `responsive` option. */
    private configure(options: DockviewResponsiveOptions | undefined): void {
        this.observer?.dispose();
        this.observer = undefined;
        this.resolver = undefined;
        this.options = undefined;
        this._activeBreakpoint = undefined;
        this._appliedBreakpoint = undefined;
        this._canonical.clear();
        this._derived = false;
        this._rebaseMode = 'auto';

        if (!options || options.breakpoints.length === 0) {
            return; // inert until configured
        }

        this.options = options;
        this._rebaseMode = options.rebase ?? 'auto';
        this.resolver = new BreakpointResolver(options.breakpoints);
        this.observer = new SizeObserver(
            () => this.host.width,
            (width) => this.resolveAt(width),
            options.debounceMs ?? DEFAULT_DEBOUNCE_MS
        );

        // resolve an initial breakpoint against the current width (no event on
        // the very first resolution — it establishes the baseline)
        this._activeBreakpoint = this.resolver.resolve(this.host.width);
    }

    reflow(): void {
        // flush any pending debounce, or resolve synchronously if idle
        if (this.observer?.pending) {
            this.observer.flush();
        } else {
            this.resolveAt(this.host.width);
        }
    }

    serializeCanonical():
        | Pick<SerializedDockview, 'grid' | 'panels'>
        | undefined {
        if (!this._derived || !this._canonical.has()) {
            return undefined;
        }
        const canonical = this._canonical.get();
        return { grid: canonical.grid, panels: canonical.panels };
    }

    /** The canonical (wide) layout — the frozen baseline while collapsed, or the
     *  live layout when not. */
    getCanonicalLayout(): SerializedDockview {
        return this._derived && this._canonical.has()
            ? this._canonical.get()
            : this.host.serializeLiveLayout();
    }

    /** Replace the canonical (wide) layout, then re-derive for the current width. */
    setCanonicalLayout(data: SerializedDockview): void {
        this._applying = true;
        try {
            this.host.fromJSON(data, { reuseExistingPanels: true });
        } finally {
            this._applying = false;
        }
        this._canonical.clear();
        this._derived = false;
        this._appliedBreakpoint = undefined;
        this.reflow();
    }

    private resolveAt(width: number): void {
        if (!this.resolver) {
            return;
        }
        const next = this.resolver.resolve(width, this._activeBreakpoint);
        if (next === undefined) {
            return;
        }

        const changed = next !== this._activeBreakpoint;
        const needsApply = next !== this._appliedBreakpoint;
        if (!changed && !needsApply) {
            return; // already resolved *and* applied for this band
        }

        // Defer while maximized — a restore fires `onDidLayoutChange`, which
        // re-runs this. Neither pointer advances, so it is re-detected then.
        if (this.host.hasMaximizedGroup()) {
            return;
        }

        const from = this._activeBreakpoint;
        this._activeBreakpoint = next;
        this._appliedBreakpoint = next;
        this.applyReflow(next);

        // only a genuine breakpoint change is an `onDidBreakpointChange` — an
        // apply that merely catches up a same-band initial layout is silent
        if (changed) {
            this._onDidBreakpointChange.fire({ from, to: next, width });
        }
    }

    /**
     * Reconcile the live layout to the breakpoint's derived target.
     *
     * - Collapsing band: freeze the current layout as canonical on the *first*
     *   collapse, then apply `deriveLayout(canonical, rules)`.
     * - Canonical band (no rules): restore the frozen wide layout exactly.
     */
    private applyReflow(breakpoint: string): void {
        const rules = this.effectiveRules(breakpoint);

        this._applying = true;
        try {
            if (rules.length === 0) {
                // widest / canonical band — restore the wide layout
                if (this._derived) {
                    this.applyGrid(this._canonical.get());
                    this._derived = false;
                }
                return;
            }

            // collapsing band — freeze the wide layout the first time
            if (!this._derived) {
                this._canonical.set(this.host.toJSON());
            }
            this.applyGrid(deriveLayout(this._canonical.get(), rules));
            this._derived = true;
        } finally {
            this._applying = false;
        }
    }

    /**
     * Reconcile the live tree to `source`'s grid + panels, but keep the *live*
     * floating groups, popouts and edge groups — they are outside the reflow's
     * scope, so a collapse/restore never tears them down or reverts a float the
     * user moved while collapsed.
     */
    private applyGrid(source: SerializedDockview): void {
        const live = this.host.serializeLiveLayout();
        this.host.fromJSON(
            {
                ...live,
                grid: source.grid,
                panels: source.panels,
                activeGroup: source.activeGroup,
            },
            { reuseExistingPanels: true }
        );
    }

    /**
     * Fold an edit made while collapsed back onto canonical, per the configured
     * mode. `'discard'` leaves canonical frozen (the edit is lost on widen);
     * `'manual'` leaves it untouched and fires `onDidRebaseConflict`; `'auto'`
     * reconciles canonical with the live derived layout.
     */
    private rebase(): void {
        if (this._rebaseMode === 'discard' || !this._canonical.has()) {
            return;
        }
        if (this._rebaseMode === 'manual') {
            this._onDidRebaseConflict.fire({
                reason: 'layout edited while collapsed (rebase: manual)',
            });
            return;
        }
        const { canonical, conflict } = rebaseCanonical(
            this._canonical.get(),
            this.host.serializeLiveLayout()
        );
        this._canonical.set(canonical);
        if (conflict) {
            this._onDidRebaseConflict.fire({ reason: conflict });
        }
    }

    /**
     * The complete rule chain for a breakpoint. A breakpoint's own `rules` win;
     * otherwise the widest band is the identity (canonical) and every narrower
     * band falls back to the default `rules`.
     */
    private effectiveRules(breakpoint: string): readonly ReflowRule[] {
        const options = this.options;
        if (!options) {
            return [];
        }
        const bp = options.breakpoints.find((b) => b.name === breakpoint);
        if (bp?.rules) {
            return bp.rules;
        }
        const widest = options.breakpoints.reduce((a, b) =>
            b.maxWidth > a.maxWidth ? b : a
        );
        return bp === widest ? [] : (options.rules ?? []);
    }

    override dispose(): void {
        this.observer?.dispose();
        super.dispose();
    }
}

export const ResponsiveLayoutModule = defineModule<
    'responsiveLayoutService',
    IResponsiveLayoutHost
>({
    name: 'ResponsiveLayout',
    serviceKey: 'responsiveLayoutService',
    create: (host) => new ResponsiveLayoutService(host),
});
