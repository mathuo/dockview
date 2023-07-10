import { quasiDefaultPrevented, quasiPreventDefault } from '../dom';

describe('dom', () => {
    test('quasiPreventDefault', () => {
        const event = new Event('myevent');
        expect((event as any)['dv-quasiPreventDefault']).toBeUndefined();
        quasiPreventDefault(event);
        expect((event as any)['dv-quasiPreventDefault']).toBe(true);
    });

    test('quasiDefaultPrevented', () => {
        const event = new Event('myevent');
        expect(quasiDefaultPrevented(event)).toBeFalsy();

        (event as any)['dv-quasiPreventDefault'] = false;
        expect(quasiDefaultPrevented(event)).toBeFalsy();

        (event as any)['dv-quasiPreventDefault'] = true;
        expect(quasiDefaultPrevented(event)).toBeTruthy();
    });
});
