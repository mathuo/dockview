import { fireEvent } from '@testing-library/dom';
import { PointerDragSource } from '../../../dnd/pointer/pointerDragSource';
import { PointerDragController } from '../../../dnd/pointer/pointerDragController';
import { IDisposable } from '../../../lifecycle';

describe('PointerDragSource', () => {
    afterEach(() => {
        // Defensive: ensure no drag leaks across tests via the singleton.
        PointerDragController.getInstance().cancel();
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

    test('a touch pointerdown with movement past threshold begins a drag', () => {
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
        // Below threshold (default 5px) — must NOT start
        fireEvent.pointerMove(window, pointerEventInit({ clientX: 3 }));
        expect(onDragStart).not.toHaveBeenCalled();

        // Cross the threshold — must start exactly once
        fireEvent.pointerMove(window, pointerEventInit({ clientX: 10 }));
        expect(onDragStart).toHaveBeenCalledTimes(1);
        expect(getData).toHaveBeenCalledTimes(1);

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

    test('touchOnly: false also handles mouse', () => {
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
