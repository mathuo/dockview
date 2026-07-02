import { ReflowRule, SerializedDockview } from 'dockview-core';

/**
 * A pending change the Applier would make to reconcile the live layout with a
 * derived target. Phase 2 is coarse (a single `replace`); the minimal
 * move-based op set lands in Phase 4.
 */
export type ReflowOp = { kind: 'replace' };

/** Structural deep clone — the identity-transform baseline. */
function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Project the **derived** layout from the **canonical** one by applying the
 * active rule chain. Pure: `(canonical, rules) -> SerializedDockview`, no DOM,
 * no side effects.
 *
 * Phase 2 ships only the identity transform — it returns a structural clone of
 * canonical, so the derived layout is byte-identical to the wide one (the
 * top-breakpoint case). Collapse / restack / hide passes land in later phases;
 * `rules` is accepted now so the signature is stable.
 */
export function deriveLayout(
    canonical: SerializedDockview,
    rules: readonly ReflowRule[]
): SerializedDockview {
    void rules; // identity transform — rules are honoured from Phase 3
    return clone(canonical);
}

/**
 * Diff the live layout against a derived target, returning the ops needed to
 * reconcile them. Phase 2 reports a single `replace` when the transformed part
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
