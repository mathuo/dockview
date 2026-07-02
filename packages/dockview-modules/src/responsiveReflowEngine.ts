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

/** Depth-first, left-to-right list of every leaf group in the grid tree. */
function collectLeaves(node: GridNode): GroupState[] {
    if (node.type === 'leaf') {
        return [node.data as GroupState];
    }
    const children = node.data as GridNode[];
    return children.flatMap((child) => collectLeaves(child));
}

/**
 * Fold every side-by-side group in the grid into a single tabbed group. The
 * highest-priority group is the host (its id + settings survive); the remaining
 * groups' panels become tabs after it, in descending priority order (document
 * order breaks ties). The globally-active panel stays active, so collapsing
 * keeps the user on the same tab.
 *
 * Pure and non-destructive: `canonical` is cloned, never mutated — which is why
 * widening (re-deriving with no collapse rule) reproduces it byte-for-byte.
 */
function collapseToTabs(canonical: SerializedDockview): SerializedDockview {
    const result = clone(canonical);
    const leaves = collectLeaves(result.grid.root as GridNode);

    if (leaves.length <= 1) {
        return result; // already a single group — nothing to fold
    }

    const activeGroupId = canonical.activeGroup;

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
    // keep the user on the panel they were looking at
    const activeGroup = leaves.find((group) => group.id === activeGroupId);
    const activeView = activeGroup?.activeView ?? host.activeView;

    const mergedGroup: GroupState = {
        ...host,
        views: mergedViews,
        activeView,
    };
    // per-group tab-group chips reference only the host's panels; drop them
    // rather than carry a stale reference through the merge (v1).
    delete mergedGroup.tabGroups;

    // The grid root must stay a branch (dockview's `fromJSON` requires it); a
    // single collapsed group is a branch with one leaf child that fills the
    // primary axis.
    const primary =
        result.grid.orientation === Orientation.HORIZONTAL
            ? result.grid.width
            : result.grid.height;

    result.grid = {
        ...result.grid,
        root: {
            type: 'branch',
            data: [{ type: 'leaf', data: mergedGroup, size: primary }],
        } as unknown as SerializedDockview['grid']['root'],
    };
    result.activeGroup = host.id;

    return result;
}

/**
 * Project the **derived** layout from the **canonical** one by applying the
 * active rule chain. Pure: `(canonical, rules) -> SerializedDockview`, no DOM,
 * no side effects, never mutates `canonical`.
 *
 * Phase 3 implements `collapseToTabs`; `restack` / `hide` land in later phases.
 * With no matching rule the transform is the identity (a clone of canonical).
 */
export function deriveLayout(
    canonical: SerializedDockview,
    rules: readonly ReflowRule[]
): SerializedDockview {
    if (rules.some((rule) => rule.kind === 'collapseToTabs')) {
        return collapseToTabs(canonical);
    }
    return clone(canonical);
}

/**
 * Diff the live layout against a derived target, returning the ops needed to
 * reconcile them. Phase 2/3 report a single `replace` when the transformed part
 * (grid + panels) differs, and — critically — **zero ops when they are
 * identical**, which is the idempotence guard for the identity / top-breakpoint
 * case. The minimal, move-based diff lands in Phase 4.
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
