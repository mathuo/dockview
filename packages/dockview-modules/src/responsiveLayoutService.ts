import {
    DockviewBreakpointChangeEvent,
    DockviewCompositeDisposable as CompositeDisposable,
    DockviewEmitter as Emitter,
    DockviewEvent as Event,
    DockviewResponsiveOptions,
    IResponsiveLayoutHost,
    IResponsiveLayoutService,
    defineModule,
} from 'dockview-core';
import { BreakpointResolver } from './responsiveBreakpointResolver';
import { SizeObserver } from './responsiveSizeObserver';

const DEFAULT_DEBOUNCE_MS = 120;

/**
 * Phase 1 of the responsive-layout module: resolves the active breakpoint from
 * the container width (with hysteresis + debounce) and fires
 * `onDidBreakpointChange`. No reflow transforms yet — those land in later phases.
 *
 * Reactive like `LayoutHistoryService`: it subscribes to the host's
 * `onDidLayoutChange` in its constructor (services are created eagerly) and owns
 * its teardown via `CompositeDisposable`.
 */
export class ResponsiveLayoutService
    extends CompositeDisposable
    implements IResponsiveLayoutService
{
    private resolver: BreakpointResolver | undefined;
    private observer: SizeObserver | undefined;
    private _activeBreakpoint: string | undefined;

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
            this.host.onDidLayoutChange(() => this.observer?.signal())
        );
    }

    /** (Re)build the resolver + observer from the `responsive` option. */
    private configure(options: DockviewResponsiveOptions | undefined): void {
        this.observer?.dispose();
        this.observer = undefined;
        this.resolver = undefined;
        this._activeBreakpoint = undefined;

        if (!options || options.breakpoints.length === 0) {
            return; // inert until configured
        }

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
        this._onDidBreakpointChange.fire({ from, to: next, width });
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
