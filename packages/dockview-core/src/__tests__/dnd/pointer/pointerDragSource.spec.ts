import { fireEvent } from '@testing-library/dom';
import { PointerDragSource } from '../../../dnd/pointer/pointerDragSource';
import { PointerDragController } from '../../../dnd/pointer/pointerDragController';
import { IDisposable } from '../../../lifecycle';

describe('PointerDragSource', () => {
    afterEach(() => {
        // Defensive: ensure no drag leaks across tests via the singleton.
        PointerDragController.getInstance().cancel();
        jest.useRealTimers();
    });

    function pointerEventInit(
        overrides: Partial<PointerEventInit> = {}
    ): PointerEventInit {
        return {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 0,
            clientY: 0,
            bubbles: true,
            cancelable: true,
            ...overrides,
        };
    }

    test('a touch pointerdown promoted to drag after the long-press initiation', () => {
        jest.useFakeTimers();
        const element = document.createElement('div');
        document.body.appendChild(element);

        const getData = jest.fn<IDisposable, []>(() => ({
            dispose: jest.fn(),
        }));
        const onDragStart = jest.fn();

        const source = new PointerDragSource(element, {
            getData,
            onDragStart,
        });

        fireEvent.pointerDown(element, pointerEventInit());
        // Hold past the 250ms initiation delay so the drag is armed.
        jest.advanceTimersByTime(300);
        // Movement past the threshold (5px) now starts the drag.
        fireEvent.pointerMove(window, pointerEventInit({ clientX: 10 }));
        expect(onDragStart).toHaveBeenCalledTimes(1);
        expect(getData).toHaveBeenCalledTimes(1);

        source.dispose();
    });

    test('movement during the initiation delay cancels the press (lets the browser scroll)', () => {
        jest.useFakeTimers();
        const element = document.createElement('div');
        document.body.appendChild(element);

        const getData = jest.fn<IDisposable, []>(() => ({
            dispose: jest.fn(),
        }));
        const onDragStart = jest.fn();

        const source = new PointerDragSource(element, {
            getData,
            onDragStart,
        });

        fireEvent.pointerDown(element, pointerEventInit());
        // Movement past pressTolerance (default 8px) before the timer fires
        // means the user is scrolling, not pressing. Cancel.
        fireEvent.pointerMove(window, pointerEventInit({ clientX: 50 }));
        jest.advanceTimersByTime(500);
        // Even further movement after timer would have fired — must NOT
        // promote since the press was cancelled.
        fireEvent.pointerMove(window, pointerEventInit({ clientX: 100 }));

        expect(onDragStart).not.toHaveBeenCalled();
        expect(getData).not.toHaveBeenCalled();

        source.dispose();
    });

    test('cancelPending() dismisses an in-flight press (used by long-press context menu)', () => {
        jest.useFakeTimers();
        const element = document.createElement('div');
        document.body.appendChild(element);

        const getData = jest.fn<IDisposable, []>(() => ({
            dispose: jest.fn(),
        }));
        const onDragStart = jest.fn();

        const source = new PointerDragSource(element, {
            getData,
            onDragStart,
        });

        fireEvent.pointerDown(element, pointerEventInit());
        jest.advanceTimersByTime(300);
        source.cancelPending();
        // After cancellation, even a qualifying move must not start a drag.
        fireEvent.pointerMove(window, pointerEventInit({ clientX: 50 }));

        expect(onDragStart).not.toHaveBeenCalled();

        source.dispose();
    });

    test('a mouse pointerdown is ignored by default (touchOnly)', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);

        const getData = jest.fn<IDisposable, []>(() => ({
            dispose: jest.fn(),
        }));
        const onDragStart = jest.fn();

        const source = new PointerDragSource(element, {
            getData,
            onDragStart,
        });

        fireEvent.pointerDown(
            element,
            pointerEventInit({ pointerType: 'mouse' })
        );
        fireEvent.pointerMove(
            window,
            pointerEventInit({ pointerType: 'mouse', clientX: 50 })
        );

        expect(onDragStart).not.toHaveBeenCalled();
        expect(getData).not.toHaveBeenCalled();

        source.dispose();
    });

    test('touchOnly: false also handles mouse with no initiation delay', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);

        const onDragStart = jest.fn();
        const source = new PointerDragSource(element, {
            getData: () => ({ dispose: jest.fn() }),
            onDragStart,
            touchOnly: false,
        });

        fireEvent.pointerDown(
            element,
            pointerEventInit({ pointerType: 'mouse' })
        );
        // Mouse arms immediately — no need to advance timers.
        fireEvent.pointerMove(
            window,
            pointerEventInit({ pointerType: 'mouse', clientX: 10 })
        );

        expect(onDragStart).toHaveBeenCalledTimes(1);

        source.dispose();
    });

    test('a pointerup before threshold cancels the pending gesture', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);

        const getData = jest.fn<IDisposable, []>(() => ({
            dispose: jest.fn(),
        }));
        const source = new PointerDragSource(element, { getData });

        fireEvent.pointerDown(element, pointerEventInit());
        fireEvent.pointerUp(window, pointerEventInit());
        expect(getData).not.toHaveBeenCalled();

        // After cancellation, subsequent moves must not promote.
        fireEvent.pointerMove(window, pointerEventInit({ clientX: 100 }));
        expect(getData).not.toHaveBeenCalled();

        source.dispose();
    });

    test('disabled source ignores pointerdown', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);

        const getData = jest.fn<IDisposable, []>(() => ({
            dispose: jest.fn(),
        }));
        const source = new PointerDragSource(element, { getData });
        source.setDisabled(true);

        fireEvent.pointerDown(element, pointerEventInit());
        fireEvent.pointerMove(window, pointerEventInit({ clientX: 10 }));

        expect(getData).not.toHaveBeenCalled();

        source.dispose();
    });

    test('isCancelled callback can suppress the drag at pointerdown time', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);

        const getData = jest.fn<IDisposable, []>(() => ({
            dispose: jest.fn(),
        }));
        const isCancelled = jest.fn(() => true);
        const source = new PointerDragSource(element, { getData, isCancelled });

        fireEvent.pointerDown(element, pointerEventInit());
        fireEvent.pointerMove(window, pointerEventInit({ clientX: 10 }));

        expect(isCancelled).toHaveBeenCalled();
        expect(getData).not.toHaveBeenCalled();

        source.dispose();
    });
});
