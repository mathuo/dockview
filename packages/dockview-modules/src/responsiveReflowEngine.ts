import {
    LayoutPriority,
    Orientation,
    ReflowRule,
    SerializedDockview,
    SerializedGridObject,
} from 'dockview-core';

/**
 * A pending change the Applier would make to reconcile the live layout with a
 * derived target. Phase 2 is coarse (a single `replace`); the minimal
 * move-based op set lands in Phase 4.
 */
export type ReflowOp = { kind: 'replace' };

/** The serialized state of a single group (a grid leaf). */
interface GroupState {
    id: string;
    views: string[];
    activeView?: string;
    priority?: LayoutPriority;
    tabGroups?: unknown;
    [key: string]: unknown;
}

type GridNode = SerializedGridObject<GroupState>;

/** Structural deep clone — the identity-transform baseline. */
function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * The reflow priority of a group — higher survives collapse longer. Folds the
 * group's `LayoutPriority` (`Fill` outranks everything, then `High` > `Normal` >
 * `Low`) and gives the active group a tie-break bonus so the thing the user is
 * looking at survives. See `responsive-layout.md` §4.3.
 */
export function computeGroupPriority(
    group: { priority?: LayoutPriority },
    isActive: boolean
): number {
    let score: number;
    switch (group.priority) {
        case LayoutPriority.Fill:
            score = 1000;
            break;
        case LayoutPriority.High:
            score = 1;
            break;
        case LayoutPriority.Low:
            score = -1;
            break;
        case LayoutPriority.Normal:
        default:
            score = 0;
            break;
    }
    return score + (isActive ? 0.5 : 0);
}

/** Depth-first, left-to-right list of every leaf node in the grid tree. */
function collectLeafNodes(node: GridNode): GridNode[] {
    if (node.type === 'leaf') {
        return [node];
    }
    return (node.data as GridNode[]).flatMap((child) =>
        collectLeafNodes(child)
    );
}

/**
 * Fold every side-by-side group into a single tabbed group. The highest-priority
 * group is the host (its id + settings survive); the remaining groups' panels
 * become tabs after it in descending priority order (document order breaks
 * ties). The globally-active panel stays active. Mutates + returns `layout`
 * (already a private clone).
 */
function collapseToTabs(layout: SerializedDockview): SerializedDockview {
    const leaves = collectLeafNodes(layout.grid.root as GridNode).map(
        (node) => node.data as GroupState
    );

    if (leaves.length <= 1) {
        return layout; // already a single group — nothing to fold
    }

    const activeGroupId = layout.activeGroup;

    const ordered = leaves
        .map((group, index) => ({
            group,
            index,
            isActive: group.id === activeGroupId,
        }))
        .sort((a, b) => {
            const pa = computeGroupPriority(a.group, a.isActive);
            const pb = computeGroupPriority(b.group, b.isActive);
            // higher priority first; document order breaks ties (deterministic)
            return pb !== pa ? pb - pa : a.index - b.index;
        });

    const host = ordered[0].group;
    const mergedViews = ordered.flatMap((entry) => entry.group.views);
    const activeGroup = leaves.find((group) => group.id === activeGroupId);
    const activeView = activeGroup?.activeView ?? host.activeView;

    const mergedGroup: GroupState = {
        ...host,
        views: mergedViews,
        activeView,
    };
    delete mergedGroup.tabGroups;

    // Keep the root a branch (dockview's `fromJSON` requires it): a single
    // collapsed group is a branch with one leaf child filling the primary axis.
    const primary =
        layout.grid.orientation === Orientation.HORIZONTAL
            ? layout.grid.width
            : layout.grid.height;

    layout.grid = {
        ...layout.grid,
        root: {
            type: 'branch',
            data: [{ type: 'leaf', data: mergedGroup, size: primary }],
        } as unknown as SerializedDockview['grid']['root'],
    };
    layout.activeGroup = host.id;

    return layout;
}

/**
 * Flip the layout's primary axis (columns <-> rows). Nested branches alternate
 * orientation from the root, so flipping the root orientation restacks the whole
 * tree. Sizes are carried through and rescaled to fit on layout. Mutates +
 * returns `layout`.
 */
function restack(layout: SerializedDockview): SerializedDockview {
    layout.grid = {
        ...layout.grid,
        orientation:
            layout.grid.orientation === Orientation.HORIZONTAL
                ? Orientation.VERTICAL
                : Orientation.HORIZONTAL,
    };
    return layout;
}

/**
 * Park the low-priority groups by marking them `visible: false` — the group and
 * its panels survive (re-shown on widen), they are just not laid out. The
 * single highest-priority group is always kept visible so the layout is never
 * left empty. Mutates + returns `layout`.
 *
 * (An overflow affordance to reach parked groups while collapsed is a later
 * refinement; the core hide/restore is complete here.)
 */
function hide(layout: SerializedDockview): SerializedDockview {
    const leaves = collectLeafNodes(layout.grid.root as GridNode);
    if (leaves.length <= 1) {
        return layout;
    }

    const activeGroupId = layout.activeGroup;
    let top = leaves[0];
    let topScore = -Infinity;
    for (const node of leaves) {
        const group = node.data as GroupState;
        const score = computeGroupPriority(group, group.id === activeGroupId);
        if (score > topScore) {
            topScore = score;
            top = node;
        }
    }

    for (const node of leaves) {
        const group = node.data as GroupState;
        if (node !== top && group.priority === LayoutPriority.Low) {
            node.visible = false;
        }
    }
    return layout;
}

/**
 * Project the **derived** layout from the **canonical** one by applying the
 * active rule chain in array order. Pure: `(canonical, rules) ->
 * SerializedDockview`, no DOM, no side effects, never mutates `canonical`.
 *
 * With no rules the transform is the identity (a clone of canonical).
 */
export function deriveLayout(
    canonical: SerializedDockview,
    rules: readonly ReflowRule[]
): SerializedDockview {
    let layout = clone(canonical);
    for (const rule of rules) {
        switch (rule.kind) {
            case 'collapseToTabs':
                layout = collapseToTabs(layout);
                break;
            case 'restack':
                layout = restack(layout);
                break;
            case 'hide':
                layout = hide(layout);
                break;
        }
    }
    return layout;
}

/**
 * Diff the live layout against a derived target, returning the ops needed to
 * reconcile them. Reports a single `replace` when the transformed part (grid +
 * panels) differs, and — critically — **zero ops when identical** (the
 * idempotence guard). The minimal, move-based diff lands in a later phase.
 *
 * Only `grid` + `panels` are compared: floating groups, popouts and edge groups
 * are outside the reflow's scope and pass through untouched.
 */
export function diffLayouts(
    live: SerializedDockview,
    target: SerializedDockview
): ReflowOp[] {
    const identical =
        JSON.stringify(live.grid) === JSON.stringify(target.grid) &&
        JSON.stringify(live.panels) === JSON.stringify(target.panels);

    return identical ? [] : [{ kind: 'replace' }];
}
