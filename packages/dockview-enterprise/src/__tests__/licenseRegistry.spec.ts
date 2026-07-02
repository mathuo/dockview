import { LicenseManager, LicenseRegistry } from '../licenseRegistry';

describe('LicenseRegistry / LicenseManager', () => {
    afterEach(() => LicenseRegistry._reset());

    describe('key resolution (static-only)', () => {
        test('missing (undefined) until a key is set', () => {
            expect(LicenseRegistry.key).toBeUndefined();
        });

        test('setLicenseKey makes the key readable process-wide', () => {
            LicenseManager.setLicenseKey('KEY-A');
            expect(LicenseRegistry.key).toBe('KEY-A');
        });

        test('a later setLicenseKey overrides the earlier one', () => {
            LicenseManager.setLicenseKey('KEY-A');
            LicenseManager.setLicenseKey('KEY-B');
            expect(LicenseRegistry.key).toBe('KEY-B');
        });

        test('_clearLicenseKey resets to missing', () => {
            LicenseManager.setLicenseKey('KEY-A');
            LicenseManager._clearLicenseKey();
            expect(LicenseRegistry.key).toBeUndefined();
        });

        test('whitespace-only / empty keys resolve to missing', () => {
            LicenseManager.setLicenseKey('   ');
            expect(LicenseRegistry.key).toBeUndefined();
            LicenseManager.setLicenseKey('');
            expect(LicenseRegistry.key).toBeUndefined();
        });
    });

    describe('onDidChangeKey', () => {
        test('fires when the key changes', () => {
            const fired: number[] = [];
            const sub = LicenseRegistry.onDidChangeKey(() => fired.push(1));
            LicenseManager.setLicenseKey('KEY-A');
            LicenseManager.setLicenseKey('KEY-B');
            LicenseManager._clearLicenseKey();
            sub.dispose();
            expect(fired).toHaveLength(3);
        });

        test('does not fire when the key is set to the same value', () => {
            LicenseManager.setLicenseKey('KEY-A');
            const fired: number[] = [];
            const sub = LicenseRegistry.onDidChangeKey(() => fired.push(1));
            LicenseManager.setLicenseKey('KEY-A');
            sub.dispose();
            expect(fired).toHaveLength(0);
        });
    });

    describe('warnOnce (per-process de-dup)', () => {
        test('logs exactly once per dedupe key, regardless of call count', () => {
            const spy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {});
            for (let i = 0; i < 5; i++) {
                LicenseRegistry.warnOnce('missing', 'no key', 'error');
            }
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith('no key');
            spy.mockRestore();
        });

        test('distinct dedupe keys each log once', () => {
            const err = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {});
            const info = jest
                .spyOn(console, 'info')
                .mockImplementation(() => {});
            LicenseRegistry.warnOnce('invalid', 'bad', 'error');
            LicenseRegistry.warnOnce('invalid', 'bad', 'error');
            LicenseRegistry.warnOnce('expired-support', 'fyi', 'info');
            expect(err).toHaveBeenCalledTimes(1);
            expect(info).toHaveBeenCalledTimes(1);
            err.mockRestore();
            info.mockRestore();
        });

        test('_reset clears the de-dup flags so a warning can fire again', () => {
            const spy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {});
            LicenseRegistry.warnOnce('missing', 'no key');
            LicenseRegistry._reset();
            LicenseRegistry.warnOnce('missing', 'no key');
            expect(spy).toHaveBeenCalledTimes(2);
            spy.mockRestore();
        });
    });
});
