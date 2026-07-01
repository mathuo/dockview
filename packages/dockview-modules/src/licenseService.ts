/**
 * `LicenseService` — per-`DockviewComponent` license gate (the enterprise module).
 *
 * The whole package is enterprise, so its mere presence means enterprise is in
 * use: this service validates the key on construction and — unless a valid key
 * is set (or we're on localhost) — renders a small inline-styled corner
 * watermark and logs one console warning. Features are NEVER disabled; the
 * watermark is the enforcement.
 *
 * ZERO core footprint: the `ServiceCollection` slot is declaration-merged from
 * here (not declared in core), the watermark anchors to the existing generic
 * `rootElement`, the watermark is styled INLINE (no core SCSS), and all
 * contracts live in this package. See `enterprise-modules/license.md`.
 */

import {
    defineModule,
    DockviewIDisposable as IDisposable,
} from 'dockview-core';
import {
    LicenseState,
    isLocalhostHostname,
    isValidLicense,
    validateLicense,
} from './licenseValidator';
import { LicenseRegistry } from './licenseRegistry';
import { DOCKVIEW_RELEASE_DATE } from './releaseDate';

// The `ServiceCollection` slot is added HERE, not in core — so `dockview-core`
// never names `licenseService`. Compile-time only; the module system stores /
// reads services by string key at runtime.
declare module 'dockview-core' {
    interface ServiceCollection {
        licenseService?: ILicenseService;
    }
}

/** Narrow host surface — satisfied structurally by `DockviewComponent`. */
export interface ILicenseHost {
    /** Generic shell-element anchor (DockviewComponent's existing `rootElement`). */
    readonly rootElement: HTMLElement;
}

export interface ILicenseService extends IDisposable {
    readonly state: LicenseState;
    readonly isValid: boolean;
    /** Re-read the key + re-evaluate the watermark (after a late setLicenseKey). */
    refresh(): void;
}

export interface LicenseServiceOptions {
    /**
     * Injectable dockview release date for deterministic tests. Defaults to the
     * baked-in `DOCKVIEW_RELEASE_DATE`. Enforcement is version-based, so this is
     * the build's publish date, NOT the current wall-clock time.
     */
    releaseDate?: () => Date;
    /** Injectable origin for tests. Defaults to `location.hostname`. */
    hostname?: () => string;
}

// TODO(§11 / no-pro-in-public): confirm final copy + URL. Neutral wording only.
const INFO_URL = 'https://dockview.dev/enterprise';

export class LicenseService implements ILicenseService {
    private _state: LicenseState = 'missing';
    private _watermark: HTMLElement | undefined;

    constructor(
        private readonly host: ILicenseHost,
        private readonly options: LicenseServiceOptions = {}
    ) {
        this.refresh();
    }

    get state(): LicenseState {
        return this._state;
    }

    get isValid(): boolean {
        return isValidLicense(this._state);
    }

    refresh(): void {
        this._state = validateLicense(LicenseRegistry.key, this.releaseDate());
        this.evaluate();
    }

    dispose(): void {
        this.removeWatermark();
    }

    // --- internals ---

    private releaseDate(): Date {
        return this.options.releaseDate
            ? this.options.releaseDate()
            : DOCKVIEW_RELEASE_DATE;
    }

    private hostname(): string {
        if (this.options.hostname) {
            return this.options.hostname();
        }
        return typeof location !== 'undefined' ? location.hostname : '';
    }

    private evaluate(): void {
        // Full suppression on localhost — a dev environment is never watermarked
        // or nagged.
        if (isLocalhostHostname(this.hostname())) {
            this.removeWatermark();
            return;
        }
        if (this.isValid) {
            this.removeWatermark();
            return;
        }
        this.renderWatermark();
        this.warnBadState();
    }

    private warnBadState(): void {
        if (this._state === 'invalid') {
            LicenseRegistry.warnOnce(
                'license:invalid',
                `dockview: the license key could not be verified (it may be malformed or corrupted). ${INFO_URL}`,
                'error'
            );
        } else if (this._state === 'expired') {
            LicenseRegistry.warnOnce(
                'license:expired',
                `dockview: this license key does not cover this version of dockview (released after the license's window). dockview keeps working, but a watermark is shown. Renew at ${INFO_URL}`,
                'error'
            );
        } else {
            LicenseRegistry.warnOnce(
                'license:missing',
                `dockview: no valid license key found. dockview keeps working, but a watermark is shown. Set a key with LicenseManager.setLicenseKey("..."). ${INFO_URL}`,
                'error'
            );
        }
    }

    private watermarkText(): string {
        if (this._state === 'invalid') {
            return 'dockview — Invalid License';
        }
        if (this._state === 'expired') {
            return 'dockview — License Expired';
        }
        return 'dockview — Unlicensed';
    }

    private renderWatermark(): void {
        if (!this._watermark) {
            const el = document.createElement('div');
            el.className = 'dv-license-watermark';
            // Styled INLINE (never core SCSS). pointer-events:none is mandatory —
            // it must never intercept clicks on the user's panels.
            el.style.cssText = [
                'position:absolute',
                'bottom:8px',
                'right:8px',
                'padding:2px 6px',
                'font:11px/1.4 sans-serif',
                'color:rgba(0,0,0,0.5)',
                'background:rgba(255,255,255,0.6)',
                'border-radius:3px',
                'pointer-events:none',
                'user-select:none',
                'z-index:9999',
            ].join(';');
            this.host.rootElement.appendChild(el);
            this._watermark = el;
        }
        this._watermark.textContent = this.watermarkText();
    }

    private removeWatermark(): void {
        this._watermark?.remove();
        this._watermark = undefined;
    }
}

export const LicenseModule = defineModule<'licenseService', ILicenseHost>({
    name: 'License',
    serviceKey: 'licenseService',
    // No dependsOn — license must not require any feature module.
    create: (host) => new LicenseService(host),
    init: (_host, service): IDisposable => {
        service.refresh(); // re-evaluate once fully constructed
        // The only external trigger is a late setLicenseKey().
        return LicenseRegistry.onDidChangeKey(() => service.refresh());
    },
});
