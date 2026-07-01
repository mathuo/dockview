import { LicenseModule, LicenseService } from '../licenseService';
import type { ILicenseHost, ILicenseService } from '../licenseService';
import { LicenseManager, LicenseRegistry } from '../licenseRegistry';
import { fnv1a } from '../licenseValidator';

const GOLDEN_KEY =
    '[KeyId:MR27GM5Z9RCLP1]_[Company:Acme_Trading_Ltd]_[Plan:team]_[AppName:Acme_Terminal]_[Email:ops@acme.com]_[ValidFrom:01_Jul_2026]_[ValidUntil:01_Jul_2027]__5220d8253176bad4';
const INVALID_KEY = GOLDEN_KEY.replace(/.$/, '0');
const IN_WINDOW = new Date(Date.UTC(2026, 11, 1)); // 2026-12-01
const AFTER_WINDOW = new Date(Date.UTC(2028, 0, 1)); // past ValidUntil

/** Mint a checksum-valid key with an arbitrary window (clock-independent tests). */
function makeKey(validUntil: string, validFrom = '01_Jan_2020'): string {
    const body = `[KeyId:T]_[Company:C]_[Plan:team]_[AppName:A]_[Email:e@x.com]_[ValidFrom:${validFrom}]_[ValidUntil:${validUntil}]`;
    return `${body}__${fnv1a(body)}`;
}

function makeHost(): { host: ILicenseHost; root: HTMLElement } {
    const root = document.createElement('div');
    document.body.appendChild(root);
    return { host: { rootElement: root }, root };
}

const watermark = (root: HTMLElement) =>
    root.querySelector('.dv-license-watermark') as HTMLElement | null;

// Off-localhost by default so the watermark isn't auto-suppressed.
const REMOTE = { hostname: () => 'app.acme.com' };

describe('LicenseService', () => {
    let errSpy: jest.SpyInstance;
    let infoSpy: jest.SpyInstance;

    beforeEach(() => {
        errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    });
    afterEach(() => {
        errSpy.mockRestore();
        infoSpy.mockRestore();
        LicenseRegistry._reset();
        document.body.innerHTML = '';
    });

    test('no key → watermark + one console.error (package presence = enterprise use)', () => {
        const { host, root } = makeHost();
        new LicenseService(host, { releaseDate: () => IN_WINDOW, ...REMOTE });
        expect(watermark(root)?.textContent).toBe('dockview — Unlicensed');
        expect(errSpy).toHaveBeenCalledTimes(1);
    });

    test('valid key → no watermark, no warning', () => {
        LicenseManager.setLicenseKey(GOLDEN_KEY);
        const { host, root } = makeHost();
        const svc = new LicenseService(host, {
            releaseDate: () => IN_WINDOW,
            ...REMOTE,
        });
        expect(svc.state).toBe('valid');
        expect(watermark(root)).toBeNull();
        expect(errSpy).not.toHaveBeenCalled();
    });

    test('invalid key → "Invalid License" watermark + console.error', () => {
        LicenseManager.setLicenseKey(INVALID_KEY);
        const { host, root } = makeHost();
        const svc = new LicenseService(host, {
            releaseDate: () => IN_WINDOW,
            ...REMOTE,
        });
        expect(svc.state).toBe('invalid');
        expect(watermark(root)?.textContent).toBe('dockview — Invalid License');
        expect(errSpy).toHaveBeenCalledTimes(1);
    });

    test('expired (build released after ValidUntil) → "License Expired" watermark + console.error', () => {
        LicenseManager.setLicenseKey(GOLDEN_KEY);
        const { host, root } = makeHost();
        const svc = new LicenseService(host, {
            releaseDate: () => AFTER_WINDOW,
            ...REMOTE,
        });
        expect(svc.state).toBe('expired');
        expect(watermark(root)?.textContent).toBe('dockview — License Expired');
        expect(errSpy).toHaveBeenCalledTimes(1);
    });

    test('localhost fully suppresses the watermark AND the warning', () => {
        const { host, root } = makeHost();
        const svc = new LicenseService(host, {
            releaseDate: () => IN_WINDOW,
            hostname: () => 'localhost',
        });
        expect(svc.state).toBe('missing');
        expect(watermark(root)).toBeNull();
        expect(errSpy).not.toHaveBeenCalled();
    });

    test('watermark is click-through (pointer-events: none)', () => {
        const { host, root } = makeHost();
        new LicenseService(host, { releaseDate: () => IN_WINDOW, ...REMOTE });
        expect(watermark(root)!.style.pointerEvents).toBe('none');
    });

    test('refresh does not duplicate the watermark, and logs once (de-dup)', () => {
        const { host, root } = makeHost();
        const svc = new LicenseService(host, {
            releaseDate: () => IN_WINDOW,
            ...REMOTE,
        });
        svc.refresh();
        svc.refresh();
        expect(root.querySelectorAll('.dv-license-watermark')).toHaveLength(1);
        expect(errSpy).toHaveBeenCalledTimes(1);
    });

    test('setting a valid key after the watermark shows removes it (refresh)', () => {
        const { host, root } = makeHost();
        const svc = new LicenseService(host, {
            releaseDate: () => IN_WINDOW,
            ...REMOTE,
        });
        expect(watermark(root)).not.toBeNull();

        LicenseManager.setLicenseKey(GOLDEN_KEY);
        svc.refresh();
        expect(watermark(root)).toBeNull();
    });

    test('dispose removes the watermark from the DOM', () => {
        const { host, root } = makeHost();
        const svc = new LicenseService(host, {
            releaseDate: () => IN_WINDOW,
            ...REMOTE,
        });
        expect(watermark(root)).not.toBeNull();
        svc.dispose();
        expect(watermark(root)).toBeNull();
    });
});

describe('LicenseModule', () => {
    afterEach(() => LicenseRegistry._reset());

    const create = (host: ILicenseHost): ILicenseService =>
        (
            LicenseModule.services!.licenseService as (
                h: ILicenseHost
            ) => ILicenseService
        )(host);

    test('registers under the licenseService slot with no dependencies', () => {
        expect(LicenseModule.moduleName).toBe('License');
        expect(LicenseModule.services!.licenseService).toBeInstanceOf(Function);
        expect(LicenseModule.dependsOn).toBeUndefined();
    });

    test('create returns a working ILicenseService', () => {
        const { host } = makeHost();
        const svc = create(host);
        expect(svc).toBeInstanceOf(LicenseService);
        expect(typeof svc.refresh).toBe('function');
    });

    test('init evaluates immediately and re-evaluates on a late setLicenseKey', () => {
        const { host } = makeHost();
        const svc = create(host); // registry empty → missing
        LicenseManager.setLicenseKey(makeKey('01_Jul_2999')); // valid for any clock
        const disposable = LicenseModule.init!(host, {
            licenseService: svc,
        } as never);
        expect(svc.state).toBe('valid'); // init() called refresh()

        LicenseManager._clearLicenseKey(); // fires onDidChangeKey → refresh()
        expect(svc.state).toBe('missing');
        disposable.dispose();
    });
});
