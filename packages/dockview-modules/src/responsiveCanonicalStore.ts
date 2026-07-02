import { SerializedDockview } from 'dockview-core';

/**
 * Holds the **canonical** ("wide") layout — the source of truth from which the
 * derived (possibly collapsed) layout is projected, and the only thing that is
 * persisted. Widening re-derives from canonical rather than reversing
 * operations, so the wide arrangement is reproduced exactly.
 *
 * Phase 2 introduces the store and the identity projection; later phases keep it
 * in sync with user edits (rebase) and derive genuinely collapsed layouts.
 */
export class CanonicalStore {
    private _canonical: SerializedDockview | undefined;

    has(): boolean {
        return this._canonical !== undefined;
    }

    set(layout: SerializedDockview): void {
        this._canonical = layout;
    }

    get(): SerializedDockview {
        if (this._canonical === undefined) {
            throw new Error('dockview: canonical layout has not been set');
        }
        return this._canonical;
    }

    clear(): void {
        this._canonical = undefined;
    }
}
