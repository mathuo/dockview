import {
    DockviewCompositeDisposable as CompositeDisposable,
    DockviewGroupPanel,
    defineModule,
    IPinnedTabsHost,
    IPinnedTabsService,
} from 'dockview-core';

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
 * pinned-state changes and reorders the strip — it never mutates pinned state,
 * touches layout, or re-implements the tab list.
 *
 * Phase 1: `inline` mode ordering only. Overflow exclusion, the cross-boundary
 * reorder guard, compact rendering, serialization and the second row are later
 * phases.
 */
export class PinnedTabsService implements IPinnedTabsService {
    private readonly _host: IPinnedTabsHost;
    private readonly _disposable: CompositeDisposable;

    /** Per-group canonical pinned order (panel ids in pin sequence). */
    private readonly _pinnedOrder = new Map<DockviewGroupPanel, string[]>();

    /** Flat set of pinned panel ids — the overflow-exclusion lookup. Panel ids
     *  are unique component-wide, so a single set serves every group. */
    private readonly _pinnedIds = new Set<string>();

    /** Re-entrancy guard: reordering moves panels, which must not re-trigger. */
    private _enforcing = false;

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
            }),
            // Every group's tab strip consults the pinned predicate (overflow)
            // and the pin-boundary resolver (reorder guard).
            this._host.onDidAddGroup((group) => {
                group.model.header.setOverflowExclude(
                    this.isExcludedFromOverflow
                );
                group.model.header.setDropIndexResolver((panelId, index) =>
                    this.resolveDropIndex(group, panelId, index)
                );
            }),
            // Drop bookkeeping for groups that go away.
            this._host.onDidRemoveGroup((group) => {
                this._pinnedOrder.delete(group);
            })
        );
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

        const flip =
            this._host.options.pinnedTabs?.togglePinOnCrossBoundaryDrag !==
            false;

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
        this._pinnedOrder.clear();
        this._pinnedIds.clear();
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
