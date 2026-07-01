/**
 * Module-level license registry + the static `LicenseManager`.
 *
 * `LicenseRegistry` is a single per-bundle instance — call
 * `LicenseManager.setLicenseKey()` once at app boot and every dock sees it. It
 * holds the statically-set key, notifies on change, and owns the once-per-
 * process console de-dup (modelled on core's `_warnedMissingModule`).
 *
 * Static-only by design — there is no per-instance key. Effective key
 * resolution is simply: registry key → missing. See `enterprise-modules/
 * license.md` §5.
 */

import { DockviewEmitter, DockviewEvent } from 'dockview-core';

class LicenseRegistryImpl {
    private _key: string | undefined;
    private readonly _warned = new Set<string>();
    private readonly _onDidChangeKey = new DockviewEmitter<void>();

    /** Fires when the statically-set key changes (e.g. a late `setLicenseKey`). */
    readonly onDidChangeKey: DockviewEvent<void> = this._onDidChangeKey.event;

    /** The effective key, or `undefined` if none has been set. */
    get key(): string | undefined {
        return this._key;
    }

    /** Set (or clear, with `undefined`) the process-wide key. Fires on change. */
    setKey(key: string | undefined): void {
        const next = key?.trim() ? key.trim() : undefined;
        if (next === this._key) {
            return;
        }
        this._key = next;
        this._onDidChangeKey.fire();
    }

    /**
     * Log `message` at most once per process for a given `dedupeKey`. N docks on
     * a page therefore produce ONE warning, not N — the flag lives here (module
     * scope), never on the per-component service.
     */
    warnOnce(
        dedupeKey: string,
        message: string,
        severity: 'error' | 'warn' | 'info' = 'error'
    ): void {
        if (this._warned.has(dedupeKey)) {
            return;
        }
        this._warned.add(dedupeKey);
        // eslint-disable-next-line no-console
        console[severity](message);
    }

    /** Tests only — reset key + de-dup state. */
    _reset(): void {
        this._key = undefined;
        this._warned.clear();
    }
}

/** The single per-bundle registry instance. */
export const LicenseRegistry = new LicenseRegistryImpl();

/**
 * Static entry point — the ONLY way to set a key (static-only, no per-instance
 * option). Set once at app boot; every `DockviewComponent` created afterwards
 * sees it.
 */
export class LicenseManager {
    static setLicenseKey(key: string): void {
        LicenseRegistry.setKey(key);
    }

    /** Test/teardown helper. */
    static _clearLicenseKey(): void {
        LicenseRegistry.setKey(undefined);
    }
}
