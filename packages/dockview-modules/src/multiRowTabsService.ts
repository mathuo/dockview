import {
    DockviewCompositeDisposable as CompositeDisposable,
    DockviewGroupPanel,
    DockviewOverflowOptions,
    OVERFLOW_WRAP_TABS_CLASS as WRAP_CLASS,
    defineModule,
} from 'dockview-core';
import { IMultiRowTabsHost, IMultiRowTabsService } from 'dockview-core';

function isWrapMode(overflow: DockviewOverflowOptions | undefined): boolean {
    return typeof overflow === 'object' && overflow?.mode === 'wrap';
}

/**
 * The number of wrapped rows in a tab list — the count of distinct tab
 * `offsetTop` values. Zero for an empty strip. (jsdom reports `offsetTop` 0 for
 * every tab, so this is 1 there regardless of width — real wrapping is e2e.)
 */
function countRows(list: HTMLElement): number {
    const tabs = Array.from(list.querySelectorAll<HTMLElement>('.dv-tab'));
    if (tabs.length === 0) {
        return 0;
    }
    const tops = new Set<number>();
    for (const tab of tabs) {
        tops.add(tab.offsetTop);
    }
    return tops.size;
}

/**
 * Drives wrap layout for one group. The wrap itself is CSS (the inert
 * `.dv-tabs-container--wrap` rules in core); this controller only toggles that
 * class on the group's tab list and, when the wrapped row count changes, asks
 * the host to relayout so the now-taller header shrinks the content area (the
 * free header-aware content-sizing seam does the subtraction). v1 wraps only
 * horizontal headers — a hidden or vertical header is a no-op.
 */
class WrapController extends CompositeDisposable {
    private _wrapped = false;
    private _rowCount = 0;
    private _observer: ResizeObserver | undefined;

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

        if (wrap === this._wrapped) {
            return;
        }
        this._wrapped = wrap;

        if (wrap && list) {
            list.classList.add(WRAP_CLASS);
            this._observer = new ResizeObserver(() => this.measure());
            this._observer.observe(list);
            this.measure();
        } else {
            this.teardown();
        }
    }

    private measure(): void {
        if (!this._wrapped) {
            return;
        }
        const list = this.host.getTabsListElement(this.group);
        if (!list) {
            return;
        }
        const rows = countRows(list);
        if (rows !== this._rowCount) {
            this._rowCount = rows;
            this.host.relayoutGroup(this.group);
        }
    }

    private teardown(): void {
        this._observer?.disconnect();
        this._observer = undefined;
        this._rowCount = 0;
        this.host.getTabsListElement(this.group)?.classList.remove(WRAP_CLASS);
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
