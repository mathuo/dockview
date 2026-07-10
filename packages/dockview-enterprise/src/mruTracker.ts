/**
 * Most-recently-used ordering for overflow tab-switching, private to the
 * advanced overflow module.
 *
 * Keeps, per group, the group's panel ids ordered by last activation — front is
 * most recently activated. Component-scoped (one tracker per component) so
 * recency survives a group closing and a panel moving between groups. There is
 * no second consumer, so this deliberately stays a module-local model rather
 * than a shared core primitive.
 */
export class MruTracker {
    private readonly _byGroup = new Map<string, string[]>();

    /**
     * Seed a group's recency list from its current tab order (front = first
     * tab). Called on group attach. Idempotent — re-seeding replaces the list,
     * but existing recency is preserved for ids already tracked so a re-attach
     * doesn't reset ordering.
     */
    attach(groupId: string, panelIds: readonly string[]): void {
        const existing = this._byGroup.get(groupId);
        if (!existing) {
            this._byGroup.set(groupId, [...panelIds]);
            return;
        }
        // Keep the recency of already-tracked ids; append any new ids in tab
        // order at the (least-recent) end.
        for (const id of panelIds) {
            if (!existing.includes(id)) {
                existing.push(id);
            }
        }
    }

    /** Drop a group's recency list — called when the group is removed. */
    detach(groupId: string): void {
        this._byGroup.delete(groupId);
    }

    /**
     * Record an activation: move `panelId` to the front of `groupId`'s list.
     * The panel is first removed from every other group's list so a cross-group
     * move leaves the source list and enters the destination.
     */
    activate(groupId: string, panelId: string): void {
        for (const [gid, ids] of this._byGroup) {
            if (gid === groupId) {
                continue;
            }
            const index = ids.indexOf(panelId);
            if (index !== -1) {
                ids.splice(index, 1);
            }
        }

        let ids = this._byGroup.get(groupId);
        if (!ids) {
            ids = [];
            this._byGroup.set(groupId, ids);
        }
        const existing = ids.indexOf(panelId);
        if (existing !== -1) {
            ids.splice(existing, 1);
        }
        ids.unshift(panelId);
    }

    /** Remove a panel from every group's list — called when a panel is closed. */
    remove(panelId: string): void {
        for (const ids of this._byGroup.values()) {
            const index = ids.indexOf(panelId);
            if (index !== -1) {
                ids.splice(index, 1);
            }
        }
    }

    /**
     * The recency order (front = most recent) for a group, or an empty list
     * when the group is not tracked.
     */
    order(groupId: string): string[] {
        return [...(this._byGroup.get(groupId) ?? [])];
    }

    /** Whether a group currently has a recency list. */
    has(groupId: string): boolean {
        return this._byGroup.has(groupId);
    }
}
