import { fireEvent } from '@testing-library/dom';
import { DragHandler } from '../../dnd/abstractDragHandler';
import { IDisposable } from '../../lifecycle';

describe('abstractDragHandler', () => {
    test('that className dv-dragged is added to element after dragstart event', () => {
        jest.useFakeTimers();

        const element = document.createElement('div');

        const handler = new (class TestClass extends DragHandler {
            constructor(el: HTMLElement) {
                super(el);
            }

            getData(): IDisposable {
                return {
                    dispose: () => {
                        // /
                    },
                };
            }
        })(element);

        expect(element.classList.contains('dv-dragged')).toBeFalsy();

        fireEvent.dragStart(element);
        expect(element.classList.contains('dv-dragged')).toBeTruthy();

        jest.runAllTimers();
        expect(element.classList.contains('dv-dragged')).toBeFalsy();

        handler.dispose();
    });

    test('that iframes and webviews have pointerEvents=none set whilst drag action is in process', () => {
        jest.useFakeTimers();

        const element = document.createElement('div');
        const iframe = document.createElement('iframe');
        const webview = document.createElement('webview');
        const span = document.createElement('span');

        document.body.appendChild(element);
        document.body.appendChild(iframe);
        document.body.appendChild(webview);
        document.body.appendChild(span);

        const handler = new (class TestClass extends DragHandler {
            constructor(el: HTMLElement) {
                super(el);
            }

            getData(): IDisposable {
                return {
                    dispose: () => {
                        // /
                    },
                };
            }
        })(element);

        expect(iframe.style.pointerEvents).toBeFalsy();
        expect(webview.style.pointerEvents).toBeFalsy();
        expect(span.style.pointerEvents).toBeFalsy();

        fireEvent.dragStart(element);
        expect(iframe.style.pointerEvents).toBe('none');
        expect(webview.style.pointerEvents).toBe('none');
        expect(span.style.pointerEvents).toBeFalsy();

        fireEvent.dragEnd(element);
        expect(iframe.style.pointerEvents).toBe('auto');
        expect(webview.style.pointerEvents).toBe('auto');
        expect(span.style.pointerEvents).toBeFalsy();

        handler.dispose();
    });

    test('that the disabling of pointerEvents is restored on a premature disposal of the handler', () => {
        jest.useFakeTimers();

        const element = document.createElement('div');
        const iframe = document.createElement('iframe');
        const webview = document.createElement('webview');
        const span = document.createElement('span');

        document.body.appendChild(element);
        document.body.appendChild(iframe);
        document.body.appendChild(webview);
        document.body.appendChild(span);

        const handler = new (class TestClass extends DragHandler {
            constructor(el: HTMLElement) {
                super(el);
            }

            getData(): IDisposable {
                return {
                    dispose: () => {
                        // /
                    },
                };
            }
        })(element);

        expect(iframe.style.pointerEvents).toBeFalsy();
        expect(webview.style.pointerEvents).toBeFalsy();
        expect(span.style.pointerEvents).toBeFalsy();

        fireEvent.dragStart(element);
        expect(iframe.style.pointerEvents).toBe('none');
        expect(webview.style.pointerEvents).toBe('none');
        expect(span.style.pointerEvents).toBeFalsy();

        handler.dispose();
        expect(iframe.style.pointerEvents).toBe('auto');
        expect(webview.style.pointerEvents).toBe('auto');
        expect(span.style.pointerEvents).toBeFalsy();
    });
});
