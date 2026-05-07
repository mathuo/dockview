import { fireEvent } from '@testing-library/dom';
import { PointerDragController } from '../../../dnd/pointer/pointerDragController';
import {
    IPointerDropTargetHandle,
    PointerDragEvent,
} from '../../../dnd/pointer/types';

describe('PointerDragController', () => {
    afterEach(() => {
        // Clear any in-flight drag so it doesn't leak between tests.
        PointerDragController.getInstance().cancel();
        // Restore real timers in case a test used fake ones.
        jest.useRealTimers();
    });

    function makeTarget(element: HTMLElement): {
        target: IPointerDropTargetHandle;
        handleDragOver: jest.Mock;
        handleDragLeave: jest.Mock;
        handleDrop: jest.Mock;
    } {
        const handleDragOver = jest.fn();
        const handleDragLeave = jest.fn();
        const handleDrop = jest.fn();
        const target: IPointerDropTargetHandle = {
            element,
            handleDragOver,
            handleDragLeave,
            handleDrop,
        };
        return { target, handleDragOver, handleDragLeave, handleDrop };
    }

    function makePointerEvent(
        type: 'pointermove' | 'pointerup' | 'pointercancel',
        opts: {
            pointerId?: number;
            clientX?: number;
            clientY?: number;
        } = {}
    ): PointerEvent {
        return new PointerEvent(type, {
            pointerId: opts.pointerId ?? 1,
            pointerType: 'touch',
            clientX: opts.clientX ?? 0,
            clientY: opts.clientY ?? 0,
            bubbles: true,
            cancelable: true,
        });
    }

    test('beginDrag fires onDragStart and installs window listeners', () => {
        const controller = PointerDragController.getInstance();
        const onDragStart = jest.fn();
        const dispose = controller.onDragStart(onDragStart);

        const source = document.createElement('div');
        controller.beginDrag({
            pointerEvent: makePointerEvent('pointermove', {
                clientX: 5,
                clientY: 5,
            }),
            source,
            getData: () => ({ dispose: jest.fn() }),
        });

        expect(onDragStart).toHaveBeenCalledTimes(1);
        expect(controller.active).toBeDefined();

        controller.cancel();
        dispose.dispose();
    });

    test('hit-tests the registered drop target under the pointer on move', () => {
        // The default jsdom implementation of elementsFromPoint returns []
        // so we stub it to deterministically return our target element.
        const controller = PointerDragController.getInstance();

        const targetEl = document.createElement('div');
        document.body.appendChild(targetEl);

        const elementsFromPointSpy = jest
            .spyOn(document, 'elementsFromPoint')
            .mockReturnValue([targetEl]);

        const { target, handleDragOver } = makeTarget(targetEl);
        const reg = controller.registerTarget(target);

        controller.beginDrag({
            pointerEvent: makePointerEvent('pointermove', {
                clientX: 0,
                clientY: 0,
            }),
            source: document.createElement('div'),
            getData: () => ({ dispose: jest.fn() }),
        });

        window.dispatchEvent(
            makePointerEvent('pointermove', { clientX: 50, clientY: 50 })
        );

        expect(handleDragOver).toHaveBeenCalledTimes(1);

        controller.cancel();
        reg.dispose();
        elementsFromPointSpy.mockRestore();
        document.body.removeChild(targetEl);
    });

    test('drag-leave fires when the pointer moves off the target', () => {
        const controller = PointerDragController.getInstance();

        const targetEl = document.createElement('div');
        document.body.appendChild(targetEl);

        const spy = jest.spyOn(document, 'elementsFromPoint');

        const { target, handleDragLeave } = makeTarget(targetEl);
        const reg = controller.registerTarget(target);

        controller.beginDrag({
            pointerEvent: makePointerEvent('pointermove'),
            source: document.createElement('div'),
            getData: () => ({ dispose: jest.fn() }),
        });

        // First move — pointer is over the target.
        spy.mockReturnValue([targetEl]);
        window.dispatchEvent(
            makePointerEvent('pointermove', { clientX: 10, clientY: 10 })
        );

        // Second move — pointer is off-target.
        spy.mockReturnValue([]);
        window.dispatchEvent(
            makePointerEvent('pointermove', { clientX: 500, clientY: 500 })
        );

        expect(handleDragLeave).toHaveBeenCalledTimes(1);

        controller.cancel();
        reg.dispose();
        spy.mockRestore();
        document.body.removeChild(targetEl);
    });

    test('pointerup over a target fires drop and disposes payload after the current tick', () => {
        jest.useFakeTimers();
        const controller = PointerDragController.getInstance();

        const targetEl = document.createElement('div');
        document.body.appendChild(targetEl);

        const spy = jest
            .spyOn(document, 'elementsFromPoint')
            .mockReturnValue([targetEl]);

        const { target, handleDrop } = makeTarget(targetEl);
        const reg = controller.registerTarget(target);

        const dataDispose = jest.fn();
        controller.beginDrag({
            pointerEvent: makePointerEvent('pointermove'),
            source: document.createElement('div'),
            getData: () => ({ dispose: dataDispose }),
        });

        window.dispatchEvent(
            makePointerEvent('pointermove', { clientX: 10, clientY: 10 })
        );
        window.dispatchEvent(
            makePointerEvent('pointerup', { clientX: 10, clientY: 10 })
        );

        expect(handleDrop).toHaveBeenCalledTimes(1);
        // Disposal is deferred so consumers can still read transfer data
        // during their drop handlers.
        expect(dataDispose).not.toHaveBeenCalled();
        jest.runAllTimers();
        expect(dataDispose).toHaveBeenCalledTimes(1);

        reg.dispose();
        spy.mockRestore();
        document.body.removeChild(targetEl);
    });

    test('pointercancel triggers drag-leave (no drop) and tears down the drag', () => {
        const controller = PointerDragController.getInstance();

        const targetEl = document.createElement('div');
        document.body.appendChild(targetEl);

        const spy = jest
            .spyOn(document, 'elementsFromPoint')
            .mockReturnValue([targetEl]);

        const { target, handleDragLeave, handleDrop } = makeTarget(targetEl);
        const reg = controller.registerTarget(target);

        controller.beginDrag({
            pointerEvent: makePointerEvent('pointermove'),
            source: document.createElement('div'),
            getData: () => ({ dispose: jest.fn() }),
        });

        window.dispatchEvent(
            makePointerEvent('pointermove', { clientX: 10, clientY: 10 })
        );
        window.dispatchEvent(makePointerEvent('pointercancel'));

        expect(handleDrop).not.toHaveBeenCalled();
        expect(handleDragLeave).toHaveBeenCalled();
        expect(controller.active).toBeUndefined();

        reg.dispose();
        spy.mockRestore();
        document.body.removeChild(targetEl);
    });

    test('events with a different pointerId are ignored mid-drag', () => {
        const controller = PointerDragController.getInstance();

        const targetEl = document.createElement('div');
        document.body.appendChild(targetEl);
        const spy = jest
            .spyOn(document, 'elementsFromPoint')
            .mockReturnValue([targetEl]);

        const { target, handleDragOver } = makeTarget(targetEl);
        const reg = controller.registerTarget(target);

        controller.beginDrag({
            pointerEvent: makePointerEvent('pointermove', { pointerId: 1 }),
            source: document.createElement('div'),
            getData: () => ({ dispose: jest.fn() }),
        });

        // Different pointerId — must NOT route through the target.
        window.dispatchEvent(
            makePointerEvent('pointermove', {
                pointerId: 2,
                clientX: 10,
                clientY: 10,
            })
        );

        expect(handleDragOver).not.toHaveBeenCalled();

        controller.cancel();
        reg.dispose();
        spy.mockRestore();
        document.body.removeChild(targetEl);
    });

    test('hit-testing prefers the inner / more-specific target when nested targets overlap', () => {
        // Regression: previously `_findTargetUnder` accepted ANY registered
        // target whose element contains the cursor element. Because the
        // layout-root drop target is registered first AND contains every
        // tab, it always won the race and per-tab targets were unreachable.
        const controller = PointerDragController.getInstance();

        const root = document.createElement('div');
        const inner = document.createElement('div');
        root.appendChild(inner);
        document.body.appendChild(root);

        // Order matters: register OUTER first to recreate the original bug.
        const rootHandle = makeTarget(root);
        const innerHandle = makeTarget(inner);
        const r1 = controller.registerTarget(rootHandle.target);
        const r2 = controller.registerTarget(innerHandle.target);

        const spy = jest
            .spyOn(document, 'elementsFromPoint')
            .mockReturnValue([inner, root]);

        controller.beginDrag({
            pointerEvent: makePointerEvent('pointermove'),
            source: document.createElement('div'),
            getData: () => ({ dispose: jest.fn() }),
        });

        window.dispatchEvent(
            makePointerEvent('pointermove', { clientX: 10, clientY: 10 })
        );

        // Inner target should have received the drag-over; root must NOT
        // have received it (it'd have eclipsed inner under the old logic).
        expect(innerHandle.handleDragOver).toHaveBeenCalled();
        expect(rootHandle.handleDragOver).not.toHaveBeenCalled();

        controller.cancel();
        r1.dispose();
        r2.dispose();
        spy.mockRestore();
        document.body.removeChild(root);
    });
});
