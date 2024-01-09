import {
    isInDocument,
    quasiDefaultPrevented,
    quasiPreventDefault,
} from '../dom';

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

    test('isInDocument: DOM element', () => {
        const el = document.createElement('div');

        expect(isInDocument(el)).toBeFalsy();

        document.body.appendChild(el);
        expect(isInDocument(el)).toBeTruthy();
    });

    test('isInDocument: Shadow DOM element', () => {
        const el = document.createElement('div');
        document.body.appendChild(el);

        const shadow = el.attachShadow({ mode: 'open' });

        const el2 = document.createElement('div');
        expect(isInDocument(el2)).toBeFalsy();

        shadow.appendChild(el2);

        expect(isInDocument(el2)).toBeTruthy();
    });
});
