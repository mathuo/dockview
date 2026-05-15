import { fireEvent } from '@testing-library/dom';
import { LongPressDetector } from '../../../dnd/pointer/longPress';

describe('LongPressDetector', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    function pointerInit(
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

    test('fires after the configured delay when the press is held still', () => {
        jest.useFakeTimers();
        const element = document.createElement('div');
        document.body.appendChild(element);

        const onLongPress = jest.fn();
        const cut = new LongPressDetector(element, {
            onLongPress,
            delay: 500,
        });

        fireEvent.pointerDown(element, pointerInit());
        jest.advanceTimersByTime(499);
        expect(onLongPress).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1);
        expect(onLongPress).toHaveBeenCalledTimes(1);

        cut.dispose();
        document.body.removeChild(element);
    });

    test('cancels when the pointer moves beyond tolerance', () => {
        jest.useFakeTimers();
        const element = document.createElement('div');
        document.body.appendChild(element);

        const onLongPress = jest.fn();
        const cut = new LongPressDetector(element, {
            onLongPress,
            delay: 500,
            tolerance: 8,
        });

        fireEvent.pointerDown(element, pointerInit());
        // Within tolerance — must not cancel.
        fireEvent.pointerMove(window, pointerInit({ clientX: 5 }));
        jest.advanceTimersByTime(250);
        // Beyond tolerance — must cancel.
        fireEvent.pointerMove(window, pointerInit({ clientX: 20 }));
        jest.advanceTimersByTime(500);

        expect(onLongPress).not.toHaveBeenCalled();

        cut.dispose();
        document.body.removeChild(element);
    });

    test('cancels when the pointer is released before the delay elapses', () => {
        jest.useFakeTimers();
        const element = document.createElement('div');
        document.body.appendChild(element);

        const onLongPress = jest.fn();
        const cut = new LongPressDetector(element, {
            onLongPress,
            delay: 500,
        });

        fireEvent.pointerDown(element, pointerInit());
        jest.advanceTimersByTime(200);
        fireEvent.pointerUp(window, pointerInit());
        jest.advanceTimersByTime(500);

        expect(onLongPress).not.toHaveBeenCalled();

        cut.dispose();
        document.body.removeChild(element);
    });

    test('ignores mouse pointers by default (touchOnly)', () => {
        jest.useFakeTimers();
        const element = document.createElement('div');
        document.body.appendChild(element);

        const onLongPress = jest.fn();
        const cut = new LongPressDetector(element, {
            onLongPress,
            delay: 500,
        });

        fireEvent.pointerDown(element, pointerInit({ pointerType: 'mouse' }));
        jest.advanceTimersByTime(1000);

        expect(onLongPress).not.toHaveBeenCalled();

        cut.dispose();
        document.body.removeChild(element);
    });

    test('touchOnly: false also fires for mouse', () => {
        jest.useFakeTimers();
        const element = document.createElement('div');
        document.body.appendChild(element);

        const onLongPress = jest.fn();
        const cut = new LongPressDetector(element, {
            onLongPress,
            delay: 100,
            touchOnly: false,
        });

        fireEvent.pointerDown(element, pointerInit({ pointerType: 'mouse' }));
        jest.advanceTimersByTime(100);

        expect(onLongPress).toHaveBeenCalledTimes(1);

        cut.dispose();
        document.body.removeChild(element);
    });

    test('suppresses the browser-synthesised contextmenu that follows long-press', () => {
        jest.useFakeTimers();
        const element = document.createElement('div');
        document.body.appendChild(element);

        const cut = new LongPressDetector(element, {
            onLongPress: jest.fn(),
            delay: 500,
        });

        fireEvent.pointerDown(element, pointerInit());
        jest.advanceTimersByTime(500);

        // Chrome's touch-emulator fires `contextmenu` immediately after the
        // long-press window. The guard must call preventDefault on it.
        const event = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
        });
        element.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);

        cut.dispose();
        document.body.removeChild(element);
    });

    test('contextmenu guard self-disposes after the first event', () => {
        jest.useFakeTimers();
        const element = document.createElement('div');
        document.body.appendChild(element);

        const cut = new LongPressDetector(element, {
            onLongPress: jest.fn(),
            delay: 500,
        });

        fireEvent.pointerDown(element, pointerInit());
        jest.advanceTimersByTime(500);

        const first = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
        });
        element.dispatchEvent(first);
        expect(first.defaultPrevented).toBe(true);

        // An unrelated, later right-click must not be suppressed.
        const second = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
        });
        element.dispatchEvent(second);
        expect(second.defaultPrevented).toBe(false);

        cut.dispose();
        document.body.removeChild(element);
    });
});
