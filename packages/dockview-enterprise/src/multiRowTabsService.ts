import {
    DockviewCompositeDisposable as CompositeDisposable,
    DockviewGroupPanel,
    DockviewOverflowOptions,
    OVERFLOW_WRAP_TABS_CLASS as WRAP_CLASS,
    OVERFLOW_WRAP_TABS_CAPPED_CLASS as CAPPED_CLASS,
    OVERFLOW_MAX_TAB_ROWS_VARIABLE as MAX_ROWS_VAR,
    OVERFLOW_WRAP_TABS_VERTICAL_TAB_HEIGHT_VARIABLE as VERTICAL_TAB_HEIGHT_VAR,
    defineModule,
} from 'dockview';
import { IMultiRowTabsHost, IMultiRowTabsService } from 'dockview';

function isWrapMode(overflow: DockviewOverflowOptions | undefined): boolean {
    return typeof overflow === 'object' && overflow?.mode === 'wrap';
}

const VERTICAL_TABS_CLASS = 'dv-tabs-container-vertical';
const TAB_CLASS = 'dv-tab';
const HEADER_CLASS = 'dv-tabs-and-actions-container';
/** The per-line thickness var (row height / column width) core sizes tabs by. */
const LINE_SIZE_VARIABLE = '--dv-tabs-and-actions-container-height';

/**
 * The wrapped-row neighbour of `current` one row up or down, or `undefined` when
 * there is no row in that direction. Tabs are bucketed into rows by `offsetTop`
 * (the same signal `countRows` uses); within the target row the tab whose
 * horizontal centre is nearest `current`'s is chosen — so Up/Down lands on the
 * geometrically-aligned tab rather than a fixed index. Pure geometry (reads
 * layout only) so it is unit-testable with mocked offsets.
 */
export function findVerticalNeighbour(
    tabs: HTMLElement[],
    current: HTMLElement,
    direction: 'up' | 'down'
): HTMLElement | undefined {
    const rowTops = Array.from(new Set(tabs.map((t) => t.offsetTop))).sort(
        (a, b) => a - b
    );
    const currentRow = rowTops.indexOf(current.offsetTop);
    const targetTop =
        rowTops[direction === 'up' ? currentRow - 1 : currentRow + 1];
    if (targetTop === undefined) {
        // Already on the top / bottom row — no wrap-around.
        return undefined;
    }

    const centre = (tab: HTMLElement): number =>
        tab.offsetLeft + tab.offsetWidth / 2;
    const currentCentre = centre(current);

    let best: HTMLElement | undefined;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const tab of tabs) {
        if (tab.offsetTop !== targetTop) {
            continue;
        }
        const distance = Math.abs(centre(tab) - currentCentre);
        if (distance < bestDistance) {
            bestDistance = distance;
            best = tab;
        }
    }
    return best;
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
     * The number of wrapped lines the tabs occupy in their natural (uncapped)
     * layout — the count of distinct tab cross-axis offsets (`offsetTop` for a
     * horizontal header's rows, `offsetLeft` for a vertical header's columns).
     * Zero for an empty strip. Capped tabs stay in flow (clipped, not removed),
     * so this is always the natural count. (jsdom reports offset 0 for every
     * tab, so this is 1 there regardless of size — real wrapping is e2e.)
     */
    rows: number;
    /**
     * Panel ids of the tabs that wrapped onto a line at/after the `maxRows` cap
     * — the surplus set routed to the overflow dropdown. Empty when uncapped or
     * when the natural layout already fits within the cap.
     */
    surplus: string[];
}

/**
 * Bucket a tab list's tabs by their cross-axis offset — `offsetTop` for a
 * horizontal header (rows), `offsetLeft` for a vertical header (columns) — to
 * derive the natural line count and, given a cap, the surplus set of panel ids
 * on lines beyond it.
 *
 * Lines are ordered by DOM (flex-fill) order rather than by raw offset value:
 * flex-wrap fills line 0 fully, then line 1, and so on, so the first DOM tab
 * carrying a new offset opens the next line. This is direction-agnostic — it is
 * correct for a `vertical-rl` strip whose columns grow right-to-left (first
 * column is the right-most, i.e. the largest `offsetLeft`), where sorting by
 * offset would mis-order the columns.
 */
function measureRows(
    list: HTMLElement,
    maxRows: number | undefined,
    isVertical: boolean
): RowMeasurement {
    const tabs = Array.from(list.querySelectorAll<HTMLElement>('.dv-tab'));
    if (tabs.length === 0) {
        return { rows: 0, surplus: [] };
    }

    const offsetOf = (tab: HTMLElement): number =>
        isVertical ? tab.offsetLeft : tab.offsetTop;

    // Assign each distinct offset a line index by first appearance in DOM order.
    const lineOfOffset = new Map<number, number>();
    for (const tab of tabs) {
        const offset = offsetOf(tab);
        if (!lineOfOffset.has(offset)) {
            lineOfOffset.set(offset, lineOfOffset.size);
        }
    }
    const rows = lineOfOffset.size;

    if (maxRows === undefined || rows <= maxRows) {
        return { rows, surplus: [] };
    }

    // Every tab on a line at/after the cap index spills to the dropdown.
    const surplus: string[] = [];
    for (const tab of tabs) {
        if ((lineOfOffset.get(offsetOf(tab)) ?? 0) >= maxRows) {
            // `dataset.tabPanelId` maps to the `data-tab-panel-id` attribute.
            const id = tab.dataset.tabPanelId;
            if (id !== undefined) {
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
 * Wraps both horizontal headers (into rows) and vertical/edge-group headers
 * (into columns); a hidden header is a no-op.
 *
 * Wrap is (re)evaluated on construction, on `overflow` option changes, and on a
 * runtime header-direction flip (`setHeaderPosition` horizontal↔vertical) via
 * the group API's `onDidHeaderDirectionChange` signal — so a group that flips
 * orientation re-measures on the correct axis (rows vs columns).
 */
class WrapController extends CompositeDisposable {
    private _wrapped = false;
    /** True when the wrapped header is vertical (columns), false for rows. */
    private _vertical = false;
    /** The effective (capped) line count last propagated via relayout. */
    private _rowCount = 0;
    private _maxRows: number | undefined;
    private _forcedIds: ReadonlySet<string> = new Set();
    private _observer: ResizeObserver | undefined;
    private _pendingMeasure: { win: Window; handle: number } | undefined;
    private _detachRowNav: (() => void) | undefined;

    constructor(
        private readonly group: DockviewGroupPanel,
        private readonly host: IMultiRowTabsHost
    ) {
        super();

        this.addDisposables(
            // A tab added/removed can change the line count without a size
            // change, so re-measure on panel churn too. `remeasure` also refreshes
            // the vertical uniform-tab-height (a new/removed title can change the
            // tallest tab) before counting columns.
            this.group.model.onDidAddPanel(() => this.remeasure()),
            this.group.model.onDidRemovePanel(() => this.remeasure()),
            // A title edit changes a vertical tab's natural (rotated) length, so
            // the tallest-tab height may move — re-measure so the uniform height
            // still contains every tab. A no-op for horizontal wrap.
            this.group.model.onDidPanelTitleChange(() => this.remeasure()),
            // A header-direction flip swaps the wrap axis (rows↔columns): the
            // vertical class core toggles is already applied by the time this
            // fires, so a re-apply re-measures on the correct axis.
            this.group.api.onDidHeaderDirectionChange(() => this.apply()),
            { dispose: () => this.teardown() }
        );

        this.apply();
    }

    apply(): void {
        const list = this.host.getTabsListElement(this.group);
        const wrap = isWrapMode(this.host.options.overflow) && !!list;

        if (wrap && list) {
            this._vertical = list.classList.contains(VERTICAL_TABS_CLASS);
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
                this.attachRowNav(list);
            }
            // Pin (or clear, when now horizontal) the uniform tab height before
            // counting columns so the count reflects the uniform layout.
            this.refreshVerticalTabHeight(list);
            this.measure();
        } else if (this._wrapped) {
            this.teardown();
        }
    }

    /** Refresh the vertical uniform-tab-height, then re-count columns. Used for
     *  panel churn / title edits (a resize keeps titles, so its RO path skips the
     *  height refresh and just re-counts). */
    private remeasure(): void {
        const list = this.host.getTabsListElement(this.group);
        if (list) {
            this.refreshVerticalTabHeight(list);
        }
        this.measure();
    }

    /**
     * Pin every wrapped tab to a single uniform height so the columns line up
     * into a clean grid (see {@link VERTICAL_TAB_HEIGHT_VAR}). The height is the
     * tallest tab's natural (content) height: dropping the current pin first lets
     * each tab report its content height, so the max is correct even when a pin
     * was already in place; pinning to that max never clips (every tab fits).
     * Horizontal wrap clears the property (its rows already share the fixed row
     * height), which also undoes a pin left over from an orientation flip.
     */
    private refreshVerticalTabHeight(list: HTMLElement): void {
        if (!this._vertical) {
            list.style.removeProperty(VERTICAL_TAB_HEIGHT_VAR);
            return;
        }
        // Clear then read: the first `offsetHeight` flushes the natural layout,
        // so the loop measures content heights rather than the previous pin.
        list.style.removeProperty(VERTICAL_TAB_HEIGHT_VAR);
        const tabs = Array.from(list.querySelectorAll<HTMLElement>('.dv-tab'));
        let max = 0;
        for (const tab of tabs) {
            if (tab.offsetHeight > max) {
                max = tab.offsetHeight;
            }
        }
        if (max > 0) {
            list.style.setProperty(VERTICAL_TAB_HEIGHT_VAR, `${max}px`);
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

    /**
     * Add cross-row keyboard nav. Core's tab-strip roving handles Left/Right/
     * Home/End within a single visual line; when tabs wrap, ArrowUp/ArrowDown
     * should step between rows too. A capture-phase listener claims only Up/Down
     * (leaving core's keys untouched) and moves the roving focus to the
     * nearest-aligned tab in the row above / below. Only wired while the strip is
     * actually wrapping; the handler re-checks the wrap + horizontal guards so a
     * stale class can't re-enable it.
     */
    private attachRowNav(list: HTMLElement): void {
        if (this._detachRowNav) {
            return;
        }
        const handler = (event: Event): void =>
            this.onRowKeyDown(event as KeyboardEvent, list);
        list.addEventListener('keydown', handler, /* capture */ true);
        this._detachRowNav = () =>
            list.removeEventListener('keydown', handler, true);
    }

    private onRowKeyDown(event: KeyboardEvent, list: HTMLElement): void {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
            return;
        }
        // Inert unless the strip is currently wrapping a horizontal header —
        // mirror the wrap gate (`apply`) and core's `:not(...-vertical)` guard.
        if (
            !list.classList.contains(WRAP_CLASS) ||
            list.classList.contains(VERTICAL_TABS_CLASS)
        ) {
            return;
        }
        // Only when a tab element itself holds focus, never a control inside a
        // custom tab renderer (matches core's `_onKeyDown` target check).
        const focused = event.target;
        if (
            !(focused instanceof HTMLElement) ||
            !focused.classList.contains(TAB_CLASS)
        ) {
            return;
        }
        const tabs = Array.from(
            list.querySelectorAll<HTMLElement>(`.${TAB_CLASS}`)
        );
        const target = findVerticalNeighbour(
            tabs,
            focused,
            event.key === 'ArrowUp' ? 'up' : 'down'
        );
        if (!target) {
            return;
        }
        // Claim the key so the list doesn't scroll and core's bubble-phase
        // handler doesn't also see it.
        event.preventDefault();
        event.stopPropagation();
        // Move the roving tabindex the way core's `_focusTab` does: the target
        // becomes the sole tab-stop, then takes DOM focus.
        for (const tab of tabs) {
            tab.tabIndex = tab === target ? 0 : -1;
        }
        target.focus();
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

        const { rows, surplus } = measureRows(
            list,
            this._maxRows,
            this._vertical
        );

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
            // Pin the header cross-size before relaying out so content sizing
            // (which subtracts the header's rendered size) sees the right value.
            this.sizeVerticalHeader(list, effectiveRows);
            this.host.relayoutGroup(this.group);
        }
    }

    /**
     * Pin a vertical (edge-group) header's WIDTH to the wrapped column count.
     *
     * A horizontal header grows its height to fit wrapped rows purely in CSS:
     * the strip's width is definite, so flex-wrap intrinsic sizing accounts for
     * the rows. A vertical header can't — the strip wraps on its (percentage)
     * height, which is indefinite during intrinsic-width resolution, so the
     * header's `auto` width is computed for a single column and stays clamped
     * when a resize reflows the tabs into more columns. The surplus columns then
     * overflow the header and render over the panel content.
     *
     * Setting the width explicitly to `columns x lineThickness` makes the header
     * contain its columns; core's content sizing (group width minus the header's
     * now-correct width) follows. Capped wrap passes the capped column count, so
     * the header stops growing at the cap exactly as the CSS max-width does. A
     * horizontal header clears the property (its height stays CSS-driven), which
     * also undoes any width left over from a runtime orientation flip.
     */
    private sizeVerticalHeader(list: HTMLElement, columns: number): void {
        const header = list.closest<HTMLElement>(`.${HEADER_CLASS}`);
        if (!header) {
            return;
        }
        if (!this._vertical) {
            header.style.removeProperty('width');
            return;
        }
        const lineSize = Number.parseFloat(
            getComputedStyle(header).getPropertyValue(LINE_SIZE_VARIABLE)
        );
        if (Number.isFinite(lineSize) && lineSize > 0) {
            header.style.width = `${columns * lineSize}px`;
        }
    }

    private teardown(): void {
        this._pendingMeasure?.win.cancelAnimationFrame(
            this._pendingMeasure.handle
        );
        this._pendingMeasure = undefined;
        this._observer?.disconnect();
        this._observer = undefined;
        this._detachRowNav?.();
        this._detachRowNav = undefined;
        this._rowCount = 0;
        this._maxRows = undefined;
        this._wrapped = false;
        this._vertical = false;
        if (this._forcedIds.size > 0) {
            this._forcedIds = new Set();
            this.host.setForcedOverflow(this.group, () => false);
        }
        const list = this.host.getTabsListElement(this.group);
        if (list) {
            list.classList.remove(WRAP_CLASS, CAPPED_CLASS);
            list.style.removeProperty(MAX_ROWS_VAR);
            // Drop the uniform vertical tab height so tabs return to natural size.
            list.style.removeProperty(VERTICAL_TAB_HEIGHT_VAR);
            // Drop the explicit width pinned on the vertical header (if any) so
            // the header returns to its CSS-driven single-line size.
            list.closest<HTMLElement>(`.${HEADER_CLASS}`)?.style.removeProperty(
                'width'
            );
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
