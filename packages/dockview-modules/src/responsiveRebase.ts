import { SerializedDockview, SerializedGridObject } from 'dockview-core';

/** Minimal view of a serialized group for rebasing. */
interface GroupState {
    id: string;
    views: string[];
    activeView?: string;
    [key: string]: unknown;
}

type GridNode = SerializedGridObject<GroupState>;

export interface RebaseResult {
    /** The updated canonical layout (a fresh object; the input is untouched). */
    canonical: SerializedDockview;
    /** Set when an edit could not be cleanly folded in. */
    conflict?: string;
}

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

function collectLeafNodes(node: GridNode): GridNode[] {
    if (node.type === 'leaf') {
        return [node];
    }
    return (node.data as GridNode[]).flatMap((child) =>
        collectLeafNodes(child)
    );
}

function panelIds(layout: SerializedDockview): Set<string> {
    const ids = new Set<string>();
    for (const node of collectLeafNodes(layout.grid.root as GridNode)) {
        for (const view of (node.data as GroupState).views) {
            ids.add(view);
        }
    }
    return ids;
}

/** The active panel id (the active group's active view). */
function activePanelId(layout: SerializedDockview): string | undefined {
    const leaves = collectLeafNodes(layout.grid.root as GridNode);
    const active = leaves.find(
        (node) => (node.data as GroupState).id === layout.activeGroup
    );
    return (active?.data as GroupState | undefined)?.activeView;
}

/** Remove empty leaves and collapse single-child branches. */
function prune(node: GridNode): GridNode | undefined {
    if (node.type === 'leaf') {
        return (node.data as GroupState).views.length > 0 ? node : undefined;
    }
    const children = (node.data as GridNode[])
        .map(prune)
        .filter((child): child is GridNode => child !== undefined);
    if (children.length === 0) {
        return undefined;
    }
    if (children.length === 1) {
        return children[0]; // collapse a branch down to its only child
    }
    return { ...node, data: children };
}

function removePanel(canonical: SerializedDockview, id: string): void {
    delete canonical.panels[id];
    for (const node of collectLeafNodes(canonical.grid.root as GridNode)) {
        const group = node.data as GroupState;
        group.views = group.views.filter((view) => view !== id);
        if (group.activeView === id) {
            group.activeView = group.views[0];
        }
    }
    let root = prune(canonical.grid.root as GridNode);
    if (root === undefined) {
        // an emptied layout keeps an empty branch
        root = { type: 'branch', data: [] };
    } else if (root.type === 'leaf') {
        // dockview requires the grid root to be a branch, so a layout pruned
        // down to a single group is a branch with that one leaf.
        root = { type: 'branch', data: [root] };
    }
    canonical.grid.root = root as unknown as SerializedDockview['grid']['root'];
}

function addPanel(
    canonical: SerializedDockview,
    id: string,
    state: unknown,
    conflicts: string[]
): void {
    canonical.panels[id] = state as never;
    const leaves = collectLeafNodes(canonical.grid.root as GridNode);
    const target =
        leaves.find(
            (node) => (node.data as GroupState).id === canonical.activeGroup
        ) ?? leaves[0];
    if (!target) {
        conflicts.push(`panel "${id}" was added but canonical has no group`);
        return;
    }
    (target.data as GroupState).views.push(id);
}

function reactivate(
    canonical: SerializedDockview,
    activePanel: string | undefined
): void {
    if (!activePanel) {
        return;
    }
    const leaf = collectLeafNodes(canonical.grid.root as GridNode).find(
        (node) => (node.data as GroupState).views.includes(activePanel)
    );
    if (leaf) {
        (leaf.data as GroupState).activeView = activePanel;
        canonical.activeGroup = (leaf.data as GroupState).id;
    }
}

/**
 * Fold the edits a user made against the derived (`live`) layout back onto the
 * canonical (wide) one, matching panels by id. Handles closes (remove + prune),
 * adds (insert into the canonical active group), and active-tab changes. Moves
 * / resizes *within* the collapsed layout don't change the panel set and so are
 * naturally ignored. Pure: the input `canonical` is never mutated.
 *
 * Limitation: only *grid* panels are reconciled. Floating a panel or popping one
 * out while collapsed is treated as a grid add, so such panels are not tracked
 * as floats on widen — avoid float/popout operations while collapsed for now.
 */
export function rebaseCanonical(
    canonicalIn: SerializedDockview,
    live: SerializedDockview
): RebaseResult {
    const canonical = clone(canonicalIn);
    const conflicts: string[] = [];

    const canonicalIds = panelIds(canonical);
    const liveIds = panelIds(live);

    for (const id of canonicalIds) {
        if (!liveIds.has(id)) {
            removePanel(canonical, id); // closed while collapsed
        }
    }
    for (const id of liveIds) {
        if (!canonicalIds.has(id)) {
            addPanel(canonical, id, live.panels[id], conflicts); // added
        }
    }

    reactivate(canonical, activePanelId(live));

    return {
        canonical,
        conflict: conflicts.length > 0 ? conflicts.join('; ') : undefined,
    };
}
