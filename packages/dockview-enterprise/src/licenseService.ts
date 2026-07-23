/**
 * `LicenseService`: per-`DockviewComponent` license gate (the enterprise module).
 *
 * The whole package is enterprise, so its mere presence means enterprise is in
 * use: this service validates the key on construction and, unless a valid key
 * is set, renders a small inline-styled corner watermark and logs one console
 * warning. Features are never disabled; the watermark is the enforcement.
 *
 * Zero core footprint: the `ServiceCollection` slot is declaration-merged onto
 * `dockview` (never declared in `dockview-core`), the watermark anchors to the
 * existing generic `rootElement`, the watermark is styled inline (no core SCSS),
 * and all contracts live in this package.
 */

import { defineModule, DockviewIDisposable as IDisposable } from 'dockview';
import {
    LicenseState,
    isValidLicense,
    validateLicense,
} from './licenseValidator';
import { LicenseRegistry } from './licenseRegistry';
import { DOCKVIEW_RELEASE_DATE } from './releaseDate';

// The `ServiceCollection` slot is added here, not in core, so core never names
// `licenseService`. Augmenting `dockview` (which re-exports core's
// `ServiceCollection`) keeps the package free of any `dockview-core` reference.
// Compile-time only; the module system stores/reads services by string key at
// runtime.
declare module 'dockview' {
    interface ServiceCollection {
        licenseService?: ILicenseService;
    }
}

/** Narrow host surface, satisfied structurally by `DockviewComponent`. */
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
     * the build's publish date, not the current wall-clock time.
     */
    releaseDate?: () => Date;
}

// Neutral enterprise info link surfaced in the watermark caption.
const INFO_URL = 'https://dockview.dev/enterprise';

// The dockview brand lockup (mark + "dockview" wordmark), monotone. Every shape
// inherits `fill:currentColor` from the <svg>, so the container's `color` alone
// drives the grey tint. No <title>, since the whole watermark is decorative
// (aria-hidden). Vectors lifted from the brand kit's `dockview-lockup-mono.svg`.
const LOCKUP_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 730.3 174" width="100%" height="100%" fill="currentColor" aria-hidden="true">' +
    '<g transform="translate(12,12) scale(0.75)">' +
    '<path d="M28 8 H74 A10 10 0 0 1 84 18 V182 A10 10 0 0 1 74 192 H28 A20 20 0 0 1 8 172 V28 A20 20 0 0 1 28 8 Z"/>' +
    '<path d="M112 8 H148 A44 44 0 0 1 192 52 V76 A12 12 0 0 1 180 88 H112 A12 12 0 0 1 100 76 V20 A12 12 0 0 1 112 8 Z"/>' +
    '<rect x="100" y="104" width="40" height="88" rx="12"/>' +
    '<path d="M164 104 H180 A12 12 0 0 1 192 116 V148 A44 44 0 0 1 148 192 H164 A12 12 0 0 1 152 180 V116 A12 12 0 0 1 164 104 Z"/>' +
    '</g>' +
    '<path transform="translate(196,127.48) scale(0.116,-0.116)" d="M82 0V698H336Q427 698 495.0 659.0Q563 620 600.0 542.5Q637 465 637 349Q637 233 600.0 155.5Q563 78 495.0 39.0Q427 0 336 0ZM214 117H336Q385 117 421.0 136.5Q457 156 477.0 195.5Q497 235 497 294V404Q497 464 477.0 503.0Q457 542 421.0 561.5Q385 581 336 581H214ZM970 -12Q896 -12 841.5 21.5Q787 55 757.5 116.5Q728 178 728 262Q728 346 757.5 406.5Q787 467 841.5 500.5Q896 534 970 534Q1045 534 1099.5 500.5Q1154 467 1183.5 406.5Q1213 346 1213 262Q1213 178 1183.5 116.5Q1154 55 1099.5 21.5Q1045 -12 970 -12ZM970 91Q1021 91 1050.0 122.5Q1079 154 1079 213V310Q1079 369 1050.0 400.0Q1021 431 970 431Q921 431 891.5 400.0Q862 369 862 310V213Q862 154 891.5 122.5Q921 91 970 91ZM1532 -12Q1416 -12 1353.5 62.0Q1291 136 1291 262Q1291 387 1353.5 460.5Q1416 534 1532 534Q1611 534 1662.5 499.0Q1714 464 1737 402L1632 355Q1623 388 1598.0 409.5Q1573 431 1532 431Q1479 431 1452.0 397.5Q1425 364 1425 308V213Q1425 159 1452.0 125.0Q1479 91 1532 91Q1577 91 1602.5 114.5Q1628 138 1642 173L1740 126Q1715 57 1661.5 22.5Q1608 -12 1532 -12ZM1839 0V740H1967V400V294H1972L2041 388L2158 522H2303L2123 320L2322 0H2170L2036 234L1967 159V0ZM2665 0H2513L2339 522H2465L2538 297L2589 111H2596L2647 297L2718 522H2840ZM2989 598Q2950 598 2932.0 616.5Q2914 635 2914 662V682Q2914 710 2932.0 728.0Q2950 746 2989 746Q3028 746 3046.0 728.0Q3064 710 3064 682V662Q3064 635 3046.0 616.5Q3028 598 2989 598ZM2925 0V522H3053V0ZM3411 -12Q3334 -12 3279.0 21.5Q3224 55 3194.5 116.5Q3165 178 3165 262Q3165 344 3194.0 405.5Q3223 467 3277.0 500.5Q3331 534 3407 534Q3489 534 3541.5 498.0Q3594 462 3619.5 402.5Q3645 343 3645 271V229H3298V216Q3298 160 3330.0 125.0Q3362 90 3425 90Q3472 90 3503.0 110.5Q3534 131 3558 161L3627 84Q3595 41 3539.5 14.5Q3484 -12 3411 -12ZM3409 438Q3375 438 3350.0 422.5Q3325 407 3311.5 379.5Q3298 352 3298 316V308H3512V317Q3512 354 3500.0 380.5Q3488 407 3465.0 422.5Q3442 438 3409 438ZM3851 0 3707 522H3830L3883 307L3924 128H3928L3976 307L4037 522H4153L4216 307L4265 128H4269L4310 307L4362 522H4481L4338 0H4200L4133 230L4094 372H4091L4053 230L3987 0Z"/>' +
    '</svg>';

export class LicenseService implements ILicenseService {
    private _state: LicenseState = 'missing';
    private _watermark: HTMLElement | undefined;
    private _caption: HTMLElement | undefined;

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

    private evaluate(): void {
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
            return 'Invalid License';
        }
        if (this._state === 'expired') {
            return 'License Expired';
        }
        return 'Unlicensed';
    }

    private renderWatermark(): void {
        if (!this._watermark) {
            const el = document.createElement('div');
            el.className = 'dv-license-watermark';
            el.setAttribute('aria-hidden', 'true');
            // Styled inline (never core SCSS). pointer-events:none is mandatory:
            // it must never intercept clicks on the user's panels. A discreet,
            // monotone-grey brand lockup at moderate opacity: professional, not loud.
            el.style.cssText = [
                'position:absolute',
                'bottom:10px',
                'right:12px',
                'display:flex',
                'flex-direction:column',
                'align-items:flex-end',
                'gap:3px',
                'color:#808080',
                'opacity:0.5',
                'pointer-events:none',
                'user-select:none',
                'z-index:9999',
            ].join(';');

            const logo = document.createElement('div');
            logo.style.cssText = 'width:112px;height:27px;line-height:0';
            logo.innerHTML = LOCKUP_SVG;
            el.appendChild(logo);

            const caption = document.createElement('span');
            caption.style.cssText = [
                "font:600 8.5px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
                'letter-spacing:0.14em',
                'text-transform:uppercase',
            ].join(';');
            el.appendChild(caption);

            this.host.rootElement.appendChild(el);
            this._watermark = el;
            this._caption = caption;
        }
        this._caption!.textContent = this.watermarkText();
    }

    private removeWatermark(): void {
        this._watermark?.remove();
        this._watermark = undefined;
        this._caption = undefined;
    }
}

export const LicenseModule = defineModule<'licenseService', ILicenseHost>({
    name: 'License',
    serviceKey: 'licenseService',
    // No dependsOn: license must not require any feature module.
    create: (host) => new LicenseService(host),
    init: (_host, service): IDisposable => {
        service.refresh(); // re-evaluate once fully constructed
        // The only external trigger is a late setLicenseKey().
        return LicenseRegistry.onDidChangeKey(() => service.refresh());
    },
});
