import {
    DockviewCompositeDisposable as CompositeDisposable,
    DockviewMutableDisposable as MutableDisposable,
    DockviewGroupPanel,
    IDockviewPanel,
    createPinButton,
    defineModule,
    IPinnedTabsHost,
    IPinnedTabsService,
} from 'dockview-core';

/**
 * The pinned second row (`mode: 'separate-row'`). Renders each pinned panel as
 * a lightweight tab in a strip mounted above the main tab bar via the core
 * `setPinnedRow` seam; the main strip hides its (still-present) pinned tabs via
 * CSS. Click a row tab to activate its panel; click its pin glyph to unpin
 * (which returns it to the main strip). The row collapses (unmounts) when the
 * group has no pinned panels.
 *
 * MVP: cross-row drag-and-drop and custom tab renderers in the row are not yet
 * implemented — the row shows the panel title only.
 */
class SecondRowController extends CompositeDisposable {
    private readonly _row: HTMLElement;
    private readonly _titleSubs = new MutableDisposable();
    private _mounted = false;

    constructor(private readonly group: DockviewGroupPanel) {
        super();

        this._row = document.createElement('div');
        this._row.className = 'dv-pinned-row';

        const onClick = (event: MouseEvent) => {
            const tabEl = (event.target as HTMLElement).closest(
                '.dv-pinned-tab'
            ) as HTMLElement | null;
            if (!tabEl) {
                return;
            }
            const panel = this.group.model.panels.find(
                (p) => p.id === tabEl.dataset.panelId
            );
            if (!panel) {
                return;
            }
            if ((event.target as HTMLElement).closest('.dv-pinned-tab-unpin')) {
                panel.api.setPinned(false);
            } else {
                panel.api.setActive();
            }
        };
        this._row.addEventListener('click', onClick);

        this.addDisposables(
            this._titleSubs,
            {
                dispose: () => this._row.removeEventListener('click', onClick),
            },
            this.group.model.onDidRemovePanel(() => this.render()),
            this.group.model.onDidActivePanelChange(() => this.render()),
            { dispose: () => this._unmount() }
        );

        this.render();
    }

    render(): void {
        const pinned = this.group.model.panels.filter((p) => p.api.isPinned);

        this._row.replaceChildren(...pinned.map((p) => this._buildTab(p)));

        // Re-render when any pinned panel's title changes (rebuilt each render
        // so subscriptions track the current pinned set).
        this._titleSubs.value = new CompositeDisposable(
            ...pinned.map((p) => p.api.onDidTitleChange(() => this.render()))
        );

        if (pinned.length > 0) {
            this._mount();
        } else {
            this._unmount();
        }
    }

    private _buildTab(panel: IDockviewPanel): HTMLElement {
        const el = document.createElement('div');
        el.className = 'dv-pinned-tab';
        el.dataset.panelId = panel.id;
        if (this.group.model.activePanel === panel) {
            el.classList.add('dv-pinned-tab--active');
        }
        const title = panel.title ?? panel.id;
        el.title = title;

        const label = document.createElement('span');
        label.className = 'dv-pinned-tab-label';
        label.textContent = title;
        el.appendChild(label);

        const unpin = createPinButton();
        unpin.classList.add('dv-pinned-tab-unpin');
        el.appendChild(unpin);

        return el;
    }

    private _mount(): void {
        if (this._mounted) {
            return;
        }
        this.group.model.header.setPinnedRow(this._row);
        this._mounted = true;
        // The header grew by a row — reflow content for the new height.
        this.group.model.relayout();
    }

    private _unmount(): void {
        if (!this._mounted) {
            return;
        }
        this.group.model.header.setPinnedRow(undefined);
        this._mounted = false;
        this.group.model.relayout();
    }
}

/**
 * Compute the pinned-first tab order for a group.
 *
 * The invariant is: `[ pinned tabs (in pinned order) ][ unpinned tabs (in
 * their current relative order) ]`. Pinned tabs are ordered by their position
 * in `pinnedOrder` (the order they were pinned); a pinned id missing from
 * `pinnedOrder` sorts after the known ones while preserving its relative
 * position. Pure — no DOM, no side effects — so the ordering math is unit
 * testable in isolation from a live component.
 *
 * @param currentOrder panel ids in their current strip order
 * @param isPinned     predicate: is this panel id pinned?
 * @param pinnedOrder  canonical order of pinned ids
 */
export function computePinnedFirstOrder(
    currentOrder: string[],
    isPinned: (panelId: string) => boolean,
    pinnedOrder: string[]
): string[] {
    const rank = (id: string): number => {
        const i = pinnedOrder.indexOf(id);
        return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };

    const pinned = currentOrder
        .filter((id) => isPinned(id))
        // stable sort by pinned rank; ties (both unknown) keep current order
        .map((id, index) => ({ id, index }))
        .sort((a, b) => rank(a.id) - rank(b.id) || a.index - b.index)
        .map((entry) => entry.id);

    const unpinned = currentOrder.filter((id) => !isPinned(id));

    return [...pinned, ...unpinned];
}

/**
 * Enforces the pinned-first invariant on each group's tab strip. Pinned state
 * itself lives on the panel (`panel.api.isPinned`, mutated through the gated
 * `DockviewComponent.setPanelPinned`); this service only reacts to
 * pinned-state changes and reorders the strip — it never mutates pinned state
 * (except the deliberate cross-boundary-drag flip) or re-implements the tab
 * list.
 *
 * Owns: pinned-first ordering, overflow exclusion, the reorder guard, and (in
 * `separate-row` mode) the pinned second row. Compact rendering + serialization
 * live in core, keyed off the panel's pinned state.
 */
export class PinnedTabsService implements IPinnedTabsService {
    private readonly _host: IPinnedTabsHost;
    private readonly _disposable: CompositeDisposable;

    /** Per-group canonical pinned order (panel ids in pin sequence). */
    private readonly _pinnedOrder = new Map<DockviewGroupPanel, string[]>();

    /** Flat set of pinned panel ids — the overflow-exclusion lookup. Panel ids
     *  are unique component-wide, so a single set serves every group. */
    private readonly _pinnedIds = new Set<string>();

    /** Live groups, tracked so a `fromJSON` restore can seed every strip. */
    private readonly _groups = new Set<DockviewGroupPanel>();

    /** Per-group pinned second row (only in `separate-row` mode). */
    private readonly _secondRows = new Map<
        DockviewGroupPanel,
        SecondRowController
    >();

    /** Re-entrancy guard: reordering moves panels, which must not re-trigger. */
    private _enforcing = false;

    private get _separateRow(): boolean {
        return (
            !!this._host.options.pinnedTabs?.enabled &&
            this._host.options.pinnedTabs?.mode === 'separate-row'
        );
    }

    constructor(host: IPinnedTabsHost) {
        this._host = host;

        this._disposable = new CompositeDisposable(
            this._host.onDidPanelPinnedChange((event) => {
                const group = event.panel.api.group;
                const order = this._orderFor(group);

                if (event.isPinned) {
                    this._pinnedIds.add(event.panel.id);
                    if (!order.includes(event.panel.id)) {
                        order.push(event.panel.id);
                    }
                } else {
                    this._pinnedIds.delete(event.panel.id);
                    const at = order.indexOf(event.panel.id);
                    if (at !== -1) {
                        order.splice(at, 1);
                    }
                }

                this.enforceOrder(group);
                // Refresh the dropdown so the pin takes effect immediately
                // rather than waiting for the next resize/observer fire.
                group.model.header.setOverflowExclude(
                    this.isExcludedFromOverflow
                );
                // Move the tab in/out of the pinned second row.
                this._secondRows.get(group)?.render();
            }),
            // Every group's tab strip consults the pinned predicate (overflow)
            // and the pin-boundary resolver (reorder guard).
            this._host.onDidAddGroup((group) => {
                this._groups.add(group);
                group.model.header.setOverflowExclude(
                    this.isExcludedFromOverflow
                );
                group.model.header.setDropIndexResolver((panelId, index) =>
                    this.resolveDropIndex(group, panelId, index)
                );
                if (this._separateRow) {
                    this._secondRows.set(group, new SecondRowController(group));
                }
            }),
            // Drop bookkeeping for groups that go away.
            this._host.onDidRemoveGroup((group) => {
                this._groups.delete(group);
                this._pinnedOrder.delete(group);
                this._secondRows.get(group)?.dispose();
                this._secondRows.delete(group);
            }),
            // A restore populates panels' `isPinned` directly (not via the
            // gated setter), so seed the store from them and re-assert the
            // invariant once the layout is fully built.
            this._host.onDidLayoutFromJSON(() => {
                for (const group of this._groups) {
                    this._seedFromRestore(group);
                }
            })
        );
    }

    /** Seed pinned bookkeeping from a restored group's panels (already in
     *  pinned-first strip order) and re-assert the invariant + overflow. */
    private _seedFromRestore(group: DockviewGroupPanel): void {
        const order = this._orderFor(group);
        for (const panel of group.model.panels) {
            if (panel.api.isPinned) {
                this._pinnedIds.add(panel.id);
                if (!order.includes(panel.id)) {
                    order.push(panel.id);
                }
            }
        }
        this.enforceOrder(group);
        group.model.header.setOverflowExclude(this.isExcludedFromOverflow);
        this._secondRows.get(group)?.render();
    }

    /**
     * Keep a panel's tab out of the overflow dropdown when it is pinned. A pure
     * `Set.has` lookup (no DOM reads) so it is safe to call from the overflow
     * filter, which re-fires on every resize. Returns `false` while the feature
     * is dormant.
     */
    readonly isExcludedFromOverflow = (panelId: string): boolean => {
        if (!this._host.options.pinnedTabs?.enabled) {
            return false;
        }
        return this._pinnedIds.has(panelId);
    };

    /**
     * Keep a header drop on the correct side of the pin boundary. With
     * `togglePinOnCrossBoundaryDrag` (default on) a drop that crosses the
     * boundary flips the dragged panel's pinned state instead of being clamped
     * — the flip is deferred to a microtask so it runs after the in-progress
     * move settles, then the pinned-change handler re-orders the strip.
     *
     * The boundary is the pinned count *excluding the dragged panel* (it is
     * removed and re-inserted during the move, so the index is post-removal).
     */
    resolveDropIndex(
        group: DockviewGroupPanel,
        panelId: string,
        index: number
    ): number {
        if (!this._host.options.pinnedTabs?.enabled) {
            return index;
        }

        const dragged = group.model.panels.find((p) => p.id === panelId);
        if (!dragged) {
            // Cross-group drop — the boundary is enforced within a group only.
            return index;
        }

        let boundary = 0;
        for (const panel of group.model.panels) {
            if (panel.id !== panelId && panel.api.isPinned) {
                boundary++;
            }
        }

        // Default: clamp (Chrome-style — dragging across the boundary is
        // refused). Opt in to flipping the pinned state with
        // `togglePinOnCrossBoundaryDrag: true` (VS-Code-style).
        const flip =
            this._host.options.pinnedTabs?.togglePinOnCrossBoundaryDrag ===
            true;

        if (dragged.api.isPinned) {
            // A pinned tab may land anywhere in [0, boundary].
            if (index <= boundary) {
                return index;
            }
            if (flip) {
                queueMicrotask(() => dragged.api.setPinned(false));
                return index;
            }
            return boundary;
        }

        // An unpinned tab may land anywhere in [boundary, end].
        if (index >= boundary) {
            return index;
        }
        if (flip) {
            queueMicrotask(() => dragged.api.setPinned(true));
            return index;
        }
        return boundary;
    }

    /**
     * Re-assert the pinned-first invariant on `group`'s tab strip by moving
     * panels into the computed order. A no-op while the feature is dormant
     * (`pinnedTabs.enabled` unset) or while a reorder is already in flight.
     */
    enforceOrder(group: DockviewGroupPanel): void {
        if (!this._host.options.pinnedTabs?.enabled || this._enforcing) {
            return;
        }

        const panels = group.model.panels;
        const currentOrder = panels.map((panel) => panel.id);
        const order = this._prune(group, currentOrder);

        const target = computePinnedFirstOrder(
            currentOrder,
            (id) => this._isPinned(group, id),
            order
        );

        // Already correct — avoid a needless move storm (and active flicker).
        if (target.every((id, index) => currentOrder[index] === id)) {
            return;
        }

        this._enforcing = true;
        try {
            // Preserve the active panel: an in-strip move removes + re-opens
            // the panel, which reassigns active when the moved panel was the
            // active one.
            const active = group.model.activePanel;

            for (let index = 0; index < target.length; index++) {
                const id = target[index];
                const panel = group.model.panels.find((p) => p.id === id);
                if (!panel) {
                    continue;
                }
                if (group.model.indexOf(panel) !== index) {
                    panel.api.moveTo({ index, skipSetActive: true });
                }
            }

            if (active && group.model.activePanel !== active) {
                active.api.setActive();
            }
        } finally {
            this._enforcing = false;
        }
    }

    dispose(): void {
        this._disposable.dispose();
        for (const controller of this._secondRows.values()) {
            controller.dispose();
        }
        this._secondRows.clear();
        this._pinnedOrder.clear();
        this._pinnedIds.clear();
        this._groups.clear();
    }

    private _isPinned(group: DockviewGroupPanel, panelId: string): boolean {
        const panel = group.model.panels.find((p) => p.id === panelId);
        return panel?.api.isPinned ?? false;
    }

    private _orderFor(group: DockviewGroupPanel): string[] {
        let order = this._pinnedOrder.get(group);
        if (!order) {
            order = [];
            this._pinnedOrder.set(group, order);
        }
        return order;
    }

    /** Drop ids that have left the group (e.g. closed/moved panels). */
    private _prune(
        group: DockviewGroupPanel,
        currentOrder: string[]
    ): string[] {
        const order = this._orderFor(group);
        const present = new Set(currentOrder);
        const pruned = order.filter((id) => present.has(id));
        if (pruned.length !== order.length) {
            this._pinnedOrder.set(group, pruned);
        }
        return pruned;
    }
}

export const PinnedTabsModule = defineModule<
    'pinnedTabsService',
    IPinnedTabsHost
>({
    name: 'PinnedTabs',
    serviceKey: 'pinnedTabsService',
    // ContextMenuModule is an optional enhancer (a later phase adds the
    // Pin/Unpin menu item only when it is present), not a hard dependency — so
    // it is intentionally not listed here.
    dependsOn: [],
    create: (host) => new PinnedTabsService(host),
});
