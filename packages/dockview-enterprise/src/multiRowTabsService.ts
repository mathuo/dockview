import {
    DockviewCompositeDisposable as CompositeDisposable,
    DockviewGroupPanel,
    DockviewOverflowOptions,
    OVERFLOW_WRAP_TABS_CLASS as WRAP_CLASS,
    OVERFLOW_WRAP_TABS_CAPPED_CLASS as CAPPED_CLASS,
    OVERFLOW_MAX_TAB_ROWS_VARIABLE as MAX_ROWS_VAR,
    defineModule,
} from 'dockview';
import { IMultiRowTabsHost, IMultiRowTabsService } from 'dockview';

function isWrapMode(overflow: DockviewOverflowOptions | undefined): boolean {
    return typeof overflow === 'object' && overflow?.mode === 'wrap';
}

/**
 * The row cap from `overflow.maxRows`, normalised to a positive integer, or
 * `undefined` for unbounded wrap (the default, and any non-positive / non-finite
 * value). Only meaningful in wrap mode.
 */
function resolveMaxRows(
    overflow: DockviewOverflowOptions | undefined
): number | undefined {
    const maxRows = overflow?.maxRows;
    if (
        typeof maxRows !== 'number' ||
        !Number.isFinite(maxRows) ||
        maxRows < 1
    ) {
        return undefined;
    }
    return Math.floor(maxRows);
}

interface RowMeasurement {
    /**
     * The number of wrapped rows the tabs occupy in their natural (uncapped)
     * layout — the count of distinct tab `offsetTop` values. Zero for an empty
     * strip. Capped tabs stay in flow (clipped, not removed), so this is always
     * the natural count. (jsdom reports `offsetTop` 0 for every tab, so this is
     * 1 there regardless of width — real wrapping is e2e.)
     */
    rows: number;
    /**
     * Panel ids of the tabs that wrapped onto a row at/after the `maxRows` cap —
     * the surplus set routed to the overflow dropdown. Empty when uncapped or
     * when the natural layout already fits within the cap.
     */
    surplus: string[];
}

/**
 * Bucket a tab list's tabs by `offsetTop` (each distinct value is one wrapped
 * row) to derive the natural row count and, given a cap, the surplus set of
 * panel ids on rows beyond it.
 */
function measureRows(
    list: HTMLElement,
    maxRows: number | undefined
): RowMeasurement {
    const tabs = Array.from(list.querySelectorAll<HTMLElement>('.dv-tab'));
    if (tabs.length === 0) {
        return { rows: 0, surplus: [] };
    }

    // Distinct row offsets, ascending — one entry per wrapped row.
    const tops = Array.from(new Set(tabs.map((tab) => tab.offsetTop))).sort(
        (a, b) => a - b
    );
    const rows = tops.length;

    if (maxRows === undefined || rows <= maxRows) {
        return { rows, surplus: [] };
    }

    // The first surplus row is the one at index `maxRows`; every tab at or below
    // it (offsetTop >= that row's top) spills to the dropdown.
    const capTop = tops[maxRows];
    const surplus: string[] = [];
    for (const tab of tabs) {
        if (tab.offsetTop >= capTop) {
            const id = tab.getAttribute('data-tab-panel-id');
            if (id !== null) {
                surplus.push(id);
            }
        }
    }
    return { rows, surplus };
}

function sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
    if (a.size !== b.size) {
        return false;
    }
    for (const value of a) {
        if (!b.has(value)) {
            return false;
        }
    }
    return true;
}

/**
 * Drives wrap layout for one group. The wrap itself is CSS (the inert
 * `.dv-tabs-container--wrap` rules in core); this controller toggles that class
 * on the group's tab list and, when the wrapped row count changes, asks the host
 * to relayout so the now-taller header shrinks the content area (the free
 * header-aware content-sizing seam does the subtraction).
 *
 * With `overflow.maxRows` set it also caps growth: it adds the capped class +
 * `--dv-max-tab-rows` var (so CSS clips the strip to the cap), measures the
 * natural row count from per-tab `offsetTop` buckets, and hands the surplus set
 * (tabs on rows beyond the cap) to the free forced-overflow seam so those tabs
 * spill into the dropdown. Detection is a row-count test, not the free path's
 * horizontal-clip test — nothing clips horizontally when tabs wrap.
 *
 * v1 wraps only horizontal headers — a hidden or vertical header is a no-op.
 *
 * Wrap is (re)evaluated on construction and on `overflow` option changes. A
 * runtime header-direction flip (`setHeaderPosition` horizontal↔vertical) is
 * NOT re-evaluated — core exposes no direction-change signal today; the CSS
 * guard (`:not(.dv-tabs-container-vertical)`) still prevents a vertical header
 * from visually wrapping, so this is a stale-class edge, not a broken layout.
 */
class WrapController extends CompositeDisposable {
    private _wrapped = false;
    /** The effective (capped) row count last propagated via relayout. */
    private _rowCount = 0;
    private _maxRows: number | undefined;
    private _forcedIds: ReadonlySet<string> = new Set();
    private _observer: ResizeObserver | undefined;
    private _pendingMeasure: { win: Window; handle: number } | undefined;

    constructor(
        private readonly group: DockviewGroupPanel,
        private readonly host: IMultiRowTabsHost
    ) {
        super();

        this.addDisposables(
            // A tab added/removed can change the row count without a width
            // change, so re-measure on panel churn too.
            this.group.model.onDidAddPanel(() => this.measure()),
            this.group.model.onDidRemovePanel(() => this.measure()),
            { dispose: () => this.teardown() }
        );

        this.apply();
    }

    apply(): void {
        const list = this.host.getTabsListElement(this.group);
        const wrap =
            isWrapMode(this.host.options.overflow) &&
            !!list &&
            !list.classList.contains('dv-tabs-container-vertical');

        if (wrap && list) {
            const first = !this._wrapped;
            this._wrapped = true;
            list.classList.add(WRAP_CLASS);

            // Sync the row cap (may change without a wrap on/off transition, e.g.
            // a runtime `overflow.maxRows` update).
            this._maxRows = resolveMaxRows(this.host.options.overflow);
            this.applyCap(list);

            if (first) {
                // Mutating layout synchronously inside the ResizeObserver
                // callback trips the browser's "ResizeObserver loop" warning, so
                // the RO schedules the measure on the next frame. The initial
                // measure runs synchronously (it's not inside an RO callback).
                this._observer = new ResizeObserver(() =>
                    this.scheduleMeasure(list)
                );
                this._observer.observe(list);
            }
            this.measure();
        } else if (this._wrapped) {
            this.teardown();
        }
    }

    /** Toggle the capped class + `--dv-max-tab-rows` var so CSS clips the strip
     *  to the cap (or removes the clip when unbounded). */
    private applyCap(list: HTMLElement): void {
        if (this._maxRows === undefined) {
            list.classList.remove(CAPPED_CLASS);
            list.style.removeProperty(MAX_ROWS_VAR);
        } else {
            list.classList.add(CAPPED_CLASS);
            list.style.setProperty(MAX_ROWS_VAR, String(this._maxRows));
        }
    }

    private scheduleMeasure(list: HTMLElement): void {
        if (this._pendingMeasure) {
            return;
        }
        const win = list.ownerDocument.defaultView;
        if (!win) {
            this.measure();
            return;
        }
        this._pendingMeasure = {
            win,
            handle: win.requestAnimationFrame(() => {
                this._pendingMeasure = undefined;
                this.measure();
            }),
        };
    }

    private measure(): void {
        if (!this._wrapped) {
            return;
        }
        const list = this.host.getTabsListElement(this.group);
        if (!list) {
            return;
        }

        const { rows, surplus } = measureRows(list, this._maxRows);

        // Only the visible (capped) rows drive header height, so relayout keys
        // off the effective count, not the natural one.
        const effectiveRows =
            this._maxRows === undefined ? rows : Math.min(rows, this._maxRows);

        // Route the surplus set to the dropdown (idempotent: skip when unchanged
        // so we don't rebuild the dropdown, which would loop via the observer).
        const forced = new Set(surplus);
        if (!sameSet(forced, this._forcedIds)) {
            this._forcedIds = forced;
            this.host.setForcedOverflow(this.group, (id) => forced.has(id));
        }

        if (effectiveRows !== this._rowCount) {
            this._rowCount = effectiveRows;
            this.host.relayoutGroup(this.group);
        }
    }

    private teardown(): void {
        this._pendingMeasure?.win.cancelAnimationFrame(
            this._pendingMeasure.handle
        );
        this._pendingMeasure = undefined;
        this._observer?.disconnect();
        this._observer = undefined;
        this._rowCount = 0;
        this._maxRows = undefined;
        this._wrapped = false;
        if (this._forcedIds.size > 0) {
            this._forcedIds = new Set();
            this.host.setForcedOverflow(this.group, () => false);
        }
        const list = this.host.getTabsListElement(this.group);
        if (list) {
            list.classList.remove(WRAP_CLASS, CAPPED_CLASS);
            list.style.removeProperty(MAX_ROWS_VAR);
        }
    }
}

/**
 * Multi-row (wrapping) tabs. Adds `overflow.mode: 'wrap'` — tabs wrap onto
 * multiple rows and the header grows, instead of clipping into the chevron
 * dropdown. Consumes the free tab-list seam + header-aware content sizing; owns
 * no tab model, overflow detection, or sizing math.
 */
export class MultiRowTabsService
    extends CompositeDisposable
    implements IMultiRowTabsService
{
    private readonly _controllers = new Map<
        DockviewGroupPanel,
        WrapController
    >();

    constructor(private readonly host: IMultiRowTabsHost) {
        super();

        this.addDisposables(
            this.host.onDidAddGroup((group) => this._track(group)),
            this.host.onDidRemoveGroup((group) => this._untrack(group)),
            // Re-apply wrap to every group on a runtime `overflow.mode` change.
            this.host.onDidOptionsChange(() =>
                this._controllers.forEach((c) => c.apply())
            ),
            {
                dispose: () => {
                    this._controllers.forEach((c) => c.dispose());
                    this._controllers.clear();
                },
            }
        );
    }

    get enabled(): boolean {
        return isWrapMode(this.host.options.overflow);
    }

    private _track(group: DockviewGroupPanel): void {
        if (this._controllers.has(group)) {
            return;
        }
        this._controllers.set(group, new WrapController(group, this.host));
    }

    private _untrack(group: DockviewGroupPanel): void {
        const controller = this._controllers.get(group);
        if (controller) {
            controller.dispose();
            this._controllers.delete(group);
        }
    }
}

export const MultiRowTabsModule = defineModule<
    'multiRowTabsService',
    IMultiRowTabsHost
>({
    name: 'MultiRowTabs',
    serviceKey: 'multiRowTabsService',
    create: (host) => new MultiRowTabsService(host),
});
