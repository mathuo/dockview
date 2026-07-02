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
import { deriveLayout, diffLayouts } from './responsiveReflowEngine';

const DEFAULT_DEBOUNCE_MS = 120;

/**
 * The responsive-layout service.
 *
 * - Phase 1: resolves the active breakpoint from the container width (with
 *   hysteresis + debounce) and fires `onDidBreakpointChange`.
 * - Phase 2: introduces the canonical/derived split — it holds the canonical
 *   ("wide") layout, projects the derived layout from it via `deriveLayout`
 *   (identity for now), and serializes the *canonical* through `toJSON` so a
 *   narrow-width save never bakes a collapsed layout in. No reflow transforms
 *   are applied yet, so the derived layout equals the live one.
 *
 * Reactive like `LayoutHistoryService`: it subscribes to the host in its
 * constructor (services are created eagerly) and owns teardown via
 * `CompositeDisposable`.
 */
export class ResponsiveLayoutService
    extends CompositeDisposable
    implements IResponsiveLayoutService
{
    private resolver: BreakpointResolver | undefined;
    private observer: SizeObserver | undefined;
    private _activeBreakpoint: string | undefined;

    private readonly _canonical = new CanonicalStore();
    /** True once the live layout is a *derived* (collapsed) projection of
     *  canonical. Always false in Phase 2 (identity transform only). */
    private _derived = false;
    private _rules: readonly ReflowRule[] = [];

    private readonly _onDidBreakpointChange =
        new Emitter<DockviewBreakpointChangeEvent>();
    readonly onDidBreakpointChange: Event<DockviewBreakpointChangeEvent> =
        this._onDidBreakpointChange.event;

    get activeBreakpoint(): string | undefined {
        return this._activeBreakpoint;
    }

    constructor(private readonly host: IResponsiveLayoutHost) {
        super();

        this.addDisposables(this._onDidBreakpointChange);

        this.configure(host.options.responsive);

        this.addDisposables(
            // re-settle on every layout/size ping; the observer debounces so a
            // continuous drag-resize only resolves once it settles
            this.host.onDidLayoutChange(() => this.observer?.signal()),
            // a fresh layout replaces the canonical baseline; re-resolve for the
            // current width against it
            this.host.onDidLayoutFromJSON(() => this.reflow())
        );
    }

    /** (Re)build the resolver + observer from the `responsive` option. */
    private configure(options: DockviewResponsiveOptions | undefined): void {
        this.observer?.dispose();
        this.observer = undefined;
        this.resolver = undefined;
        this._activeBreakpoint = undefined;
        this._canonical.clear();
        this._derived = false;
        this._rules = [];

        if (!options || options.breakpoints.length === 0) {
            return; // inert until configured
        }

        this._rules = options.rules ?? [];
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

    /**
     * The canonical (wide) `grid` + `panels` to persist, or `undefined` to let
     * `toJSON` serialize the live tree. Only diverges from live once the layout
     * is actually derived/collapsed (Phase 3+); in Phase 2 it is always
     * `undefined`, so serialization is byte-identical to today.
     */
    serializeCanonical():
        | Pick<SerializedDockview, 'grid' | 'panels'>
        | undefined {
        if (!this._derived || !this._canonical.has()) {
            return undefined;
        }
        const canonical = this._canonical.get();
        return { grid: canonical.grid, panels: canonical.panels };
    }

    private resolveAt(width: number): void {
        if (!this.resolver) {
            return;
        }
        const next = this.resolver.resolve(width, this._activeBreakpoint);
        if (next === undefined || next === this._activeBreakpoint) {
            return;
        }
        const from = this._activeBreakpoint;
        this._activeBreakpoint = next;
        this.applyReflow();
        this._onDidBreakpointChange.fire({ from, to: next, width });
    }

    /**
     * Project the derived layout from canonical and reconcile the live tree to
     * it. Phase 2 is identity-only: canonical mirrors the live layout, the
     * derived target equals it, the diff is empty, and nothing is applied — so
     * `_derived` stays false and `serializeCanonical` keeps returning the live
     * tree. The collapse/restack/hide transforms and the minimal-diff apply
     * arrive in later phases.
     */
    private applyReflow(): void {
        // Phase 3 ships the pure collapse engine (`deriveLayout` supports
        // `collapseToTabs`), but the service does not yet APPLY a derived layout
        // to the live tree — that, and the rebase safety that keeps canonical in
        // sync with user edits, arrive in later phases. Until then the live
        // layout is never collapsed, so we derive with the identity transform
        // and canonical simply mirrors live (never stale relative to on-screen).
        this._canonical.set(this.host.toJSON());

        const target = deriveLayout(this._canonical.get(), []);
        const ops = diffLayouts(this.host.toJSON(), target);

        // identity transform => zero ops => the live layout already matches the
        // derived target, so it is not a collapsed projection.
        this._derived = ops.length > 0;
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
