import {
    addStyles,
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

    describe('addStyles', () => {
        function makeTargetDocument() {
            return document.implementation.createHTMLDocument('target');
        }

        function makeStyleSheet(
            rules: string[],
            href?: string
        ): CSSStyleSheet {
            return {
                href,
                type: 'text/css',
                cssRules: rules.map((cssText) => ({ cssText })),
            } as unknown as CSSStyleSheet;
        }

        function makeStyleSheetList(sheets: CSSStyleSheet[]): StyleSheetList {
            const list: any = {
                length: sheets.length,
                [Symbol.iterator]: function* () {
                    for (const s of sheets) yield s;
                },
            };
            sheets.forEach((s, i) => (list[i] = s));
            return list as StyleSheetList;
        }

        test('applies nonce to every created <style> element', () => {
            const targetDoc = makeTargetDocument();
            const sheets = makeStyleSheetList([
                makeStyleSheet(['.a { color: red; }', '.b { color: blue; }']),
            ]);

            addStyles(targetDoc, sheets, { nonce: 'abc123' });

            const styles = targetDoc.head.querySelectorAll('style');
            expect(styles.length).toBe(2);
            expect(styles[0].getAttribute('nonce')).toBe('abc123');
            expect(styles[1].getAttribute('nonce')).toBe('abc123');
            expect(styles[0].textContent).toBe('.a { color: red; }');
            expect(styles[1].textContent).toBe('.b { color: blue; }');
        });

        test('omits nonce attribute when no nonce is supplied', () => {
            const targetDoc = makeTargetDocument();
            const sheets = makeStyleSheetList([
                makeStyleSheet(['.b { color: blue; }']),
            ]);

            addStyles(targetDoc, sheets);

            const style = targetDoc.head.querySelector('style')!;
            expect(style.hasAttribute('nonce')).toBe(false);
        });

        test('appends <link> for external stylesheet hrefs', () => {
            const targetDoc = makeTargetDocument();
            const sheets = makeStyleSheetList([
                makeStyleSheet(
                    ['.c { color: green; }'],
                    'https://example.test/main.css'
                ),
            ]);

            addStyles(targetDoc, sheets, { nonce: 'xyz' });

            const link = targetDoc.head.querySelector('link');
            expect(link).not.toBeNull();
            expect(link?.getAttribute('rel')).toBe('stylesheet');
            expect(link?.getAttribute('href')).toBe(
                'https://example.test/main.css'
            );
        });

        test('preserves source order across readable and unreadable sheets', () => {
            // Simulate a CORS-restricted sheet whose cssRules throws on access.
            const unreadable: any = {
                href: 'https://cdn.test/blocked.css',
                type: 'text/css',
                get cssRules(): CSSRuleList {
                    throw new DOMException(
                        'SecurityError',
                        'SecurityError'
                    );
                },
            };

            const targetDoc = makeTargetDocument();
            const sheets = makeStyleSheetList([
                makeStyleSheet(['.first { color: red; }']),
                unreadable,
                makeStyleSheet(['.third { color: green; }']),
            ]);

            const warn = jest
                .spyOn(console, 'warn')
                .mockImplementation(() => {});

            addStyles(targetDoc, sheets, { nonce: 'n1' });

            const appended = Array.from(targetDoc.head.children).filter(
                (el) => el.tagName === 'STYLE' || el.tagName === 'LINK'
            );
            expect(appended.length).toBe(3);
            expect(appended[0].tagName).toBe('STYLE');
            expect(appended[0].textContent).toBe('.first { color: red; }');
            expect(appended[1].tagName).toBe('LINK');
            expect(
                (appended[1] as HTMLLinkElement).getAttribute('href')
            ).toBe('https://cdn.test/blocked.css');
            expect(appended[2].tagName).toBe('STYLE');
            expect(appended[2].textContent).toBe('.third { color: green; }');

            warn.mockRestore();
        });

        test('nonce accepts a function that receives the target document', () => {
            const targetDoc = makeTargetDocument();
            const meta = targetDoc.createElement('meta');
            meta.setAttribute('name', 'csp-nonce');
            meta.setAttribute('content', 'from-popout');
            targetDoc.head.appendChild(meta);

            const sheets = makeStyleSheetList([
                makeStyleSheet(['.x { color: red; }']),
            ]);

            const nonceFn = jest.fn(
                (doc: Document) =>
                    doc
                        .querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')
                        ?.getAttribute('content') ?? undefined
            );

            addStyles(targetDoc, sheets, { nonce: nonceFn });

            expect(nonceFn).toHaveBeenCalledTimes(1);
            expect(nonceFn).toHaveBeenCalledWith(targetDoc);
            const style = targetDoc.head.querySelector('style')!;
            expect(style.getAttribute('nonce')).toBe('from-popout');
        });
    });
});
