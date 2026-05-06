import { PopoutWindow } from '../popoutWindow';

describe('PopoutWindow', () => {
    function makeFakeExternalWindow() {
        const externalDoc =
            document.implementation.createHTMLDocument('popout');
        const listeners: Record<string, EventListener[]> = {};

        const externalWindow: any = {
            document: externalDoc,
            close: jest.fn(),
            addEventListener: (type: string, fn: EventListener) => {
                (listeners[type] ||= []).push(fn);
            },
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        };

        const fireLoad = () => {
            for (const fn of listeners['load'] ?? []) {
                fn(new Event('load'));
            }
        };

        return { externalWindow, externalDoc, fireLoad };
    }

    function withParentStyleSheet<T>(cssText: string, fn: () => T): T {
        const styleEl = document.createElement('style');
        styleEl.appendChild(document.createTextNode(cssText));
        document.head.appendChild(styleEl);
        try {
            return fn();
        } finally {
            styleEl.remove();
        }
    }

    test('forwards nonce from options through addStyles into the popout document', async () => {
        const { externalWindow, externalDoc, fireLoad } =
            makeFakeExternalWindow();
        const openSpy = jest
            .spyOn(window, 'open')
            .mockReturnValue(externalWindow as Window);

        try {
            await withParentStyleSheet('.dv { color: red; }', async () => {
                const popout = new PopoutWindow('target-id', 'dv-test-class', {
                    url: 'about:blank',
                    top: 0,
                    left: 0,
                    width: 100,
                    height: 100,
                    nonce: 'popout-nonce-123',
                });

                const opened = popout.open();
                fireLoad();
                await opened;

                const styles = externalDoc.head.querySelectorAll('style');
                expect(styles.length).toBeGreaterThan(0);
                styles.forEach((s) => {
                    expect(s.getAttribute('nonce')).toBe('popout-nonce-123');
                });

                popout.dispose();
            });
        } finally {
            openSpy.mockRestore();
        }
    });

    test('resolves nonce function against the popout document', async () => {
        const { externalWindow, externalDoc, fireLoad } =
            makeFakeExternalWindow();
        const meta = externalDoc.createElement('meta');
        meta.setAttribute('name', 'csp-nonce');
        meta.setAttribute('content', 'from-popout-meta');
        externalDoc.head.appendChild(meta);

        const openSpy = jest
            .spyOn(window, 'open')
            .mockReturnValue(externalWindow as Window);

        try {
            await withParentStyleSheet('.dv { color: red; }', async () => {
                const nonceFn = jest.fn(
                    (doc: Document) =>
                        doc
                            .querySelector<HTMLMetaElement>(
                                'meta[name="csp-nonce"]'
                            )
                            ?.getAttribute('content') ?? undefined
                );

                const popout = new PopoutWindow('target-id', 'dv-test-class', {
                    url: 'about:blank',
                    top: 0,
                    left: 0,
                    width: 100,
                    height: 100,
                    nonce: nonceFn,
                });

                const opened = popout.open();
                fireLoad();
                await opened;

                expect(nonceFn).toHaveBeenCalledWith(externalDoc);
                const styles = externalDoc.head.querySelectorAll('style');
                expect(styles.length).toBeGreaterThan(0);
                styles.forEach((s) => {
                    expect(s.getAttribute('nonce')).toBe('from-popout-meta');
                });

                popout.dispose();
            });
        } finally {
            openSpy.mockRestore();
        }
    });

    test('does not set a nonce attribute when no nonce option is supplied', async () => {
        const { externalWindow, externalDoc, fireLoad } =
            makeFakeExternalWindow();
        const openSpy = jest
            .spyOn(window, 'open')
            .mockReturnValue(externalWindow as Window);

        try {
            await withParentStyleSheet('.dv { color: red; }', async () => {
                const popout = new PopoutWindow('target-id', 'dv-test-class', {
                    url: 'about:blank',
                    top: 0,
                    left: 0,
                    width: 100,
                    height: 100,
                });

                const opened = popout.open();
                fireLoad();
                await opened;

                const styles = externalDoc.head.querySelectorAll('style');
                expect(styles.length).toBeGreaterThan(0);
                styles.forEach((s) => {
                    expect(s.hasAttribute('nonce')).toBe(false);
                });

                popout.dispose();
            });
        } finally {
            openSpy.mockRestore();
        }
    });
});
