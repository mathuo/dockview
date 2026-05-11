import {
    disableIframePointEvents,
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

    test('disableIframePointEvents', () => {
        const el1 = document.createElement('iframe');
        const el2 = document.createElement('iframe');
        const el3 = document.createElement('webview');
        const el4 = document.createElement('webview');

        document.body.appendChild(el1);
        document.body.appendChild(el2);
        document.body.appendChild(el3);
        document.body.appendChild(el4);

        el1.style.pointerEvents = 'inherit';
        el3.style.pointerEvents = 'inherit';

        expect(el1.style.pointerEvents).toBe('inherit');
        expect(el2.style.pointerEvents).toBe('');
        expect(el3.style.pointerEvents).toBe('inherit');
        expect(el4.style.pointerEvents).toBe('');

        const f = disableIframePointEvents();

        expect(el1.style.pointerEvents).toBe('none');
        expect(el2.style.pointerEvents).toBe('none');
        expect(el3.style.pointerEvents).toBe('none');
        expect(el4.style.pointerEvents).toBe('none');

        f.release();

        expect(el1.style.pointerEvents).toBe('inherit');
        expect(el2.style.pointerEvents).toBe('');
        expect(el3.style.pointerEvents).toBe('inherit');
        expect(el4.style.pointerEvents).toBe('');
    });

    test('disableIframePointEvents respects the rootNode parameter', () => {
        // Iframes in a popout document must be shieldable independently
        // of the main document. The rootNode parameter previously was
        // ignored — the function always walked the main document.
        const main = document.createElement('iframe');
        document.body.appendChild(main);

        // Simulate a popout window via a detached document.
        const popoutDoc = document.implementation.createHTMLDocument('popout');
        const popoutIframe = popoutDoc.createElement('iframe');
        popoutDoc.body.appendChild(popoutIframe);

        const f = disableIframePointEvents(popoutDoc);

        expect(popoutIframe.style.pointerEvents).toBe('none');
        // Main document's iframe must NOT have been shielded — the caller
        // asked to shield only the popout.
        expect(main.style.pointerEvents).toBe('');

        f.release();
        expect(popoutIframe.style.pointerEvents).toBe('');
    });
});
