import { PointerDragController } from '../../../dnd/pointer/pointerDragController';
import { PointerDropTarget } from '../../../dnd/pointer/pointerDropTarget';
import { PointerDragEvent } from '../../../dnd/pointer/types';

describe('PointerDropTarget', () => {
    afterEach(() => {
        PointerDragController.getInstance().cancel();
    });

    function makeDragEvent(clientX: number, clientY: number): PointerDragEvent {
        return {
            clientX,
            clientY,
            pointerEvent: new PointerEvent('pointermove', {
                clientX,
                clientY,
                pointerId: 1,
                pointerType: 'touch',
            }),
        };
    }

    test('renders an overlay on drag-over within an accepted zone', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);

        jest.spyOn(element, 'offsetWidth', 'get').mockReturnValue(100);
        jest.spyOn(element, 'offsetHeight', 'get').mockReturnValue(40);
        jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
            top: 0,
            left: 0,
            right: 100,
            bottom: 40,
            width: 100,
            height: 40,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });

        const target = new PointerDropTarget(element, {
            acceptedTargetZones: ['left', 'right'],
            canDisplayOverlay: () => true,
        });

        // Simulate the controller routing a drag-over to us.
        (target as any)._onDragOver(makeDragEvent(10, 20));

        const dropzones = element.getElementsByClassName(
            'dv-drop-target-dropzone'
        );
        expect(dropzones).toHaveLength(1);
        expect(target.state).toBe('left');

        target.dispose();
        document.body.removeChild(element);
    });

    test('does not render an overlay when canDisplayOverlay returns false', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);

        jest.spyOn(element, 'offsetWidth', 'get').mockReturnValue(100);
        jest.spyOn(element, 'offsetHeight', 'get').mockReturnValue(40);
        jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
            top: 0,
            left: 0,
            right: 100,
            bottom: 40,
            width: 100,
            height: 40,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });

        const target = new PointerDropTarget(element, {
            acceptedTargetZones: ['left', 'right'],
            canDisplayOverlay: () => false,
        });

        (target as any)._onDragOver(makeDragEvent(10, 20));

        expect(
            element.getElementsByClassName('dv-drop-target-dropzone')
        ).toHaveLength(0);

        target.dispose();
        document.body.removeChild(element);
    });

    test('drag-leave removes the overlay', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);

        jest.spyOn(element, 'offsetWidth', 'get').mockReturnValue(100);
        jest.spyOn(element, 'offsetHeight', 'get').mockReturnValue(40);
        jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
            top: 0,
            left: 0,
            right: 100,
            bottom: 40,
            width: 100,
            height: 40,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });

        const target = new PointerDropTarget(element, {
            acceptedTargetZones: ['left', 'right'],
            canDisplayOverlay: () => true,
        });

        (target as any)._onDragOver(makeDragEvent(10, 20));
        expect(
            element.getElementsByClassName('dv-drop-target-dropzone')
        ).toHaveLength(1);

        (target as any)._removeOverlay();
        expect(
            element.getElementsByClassName('dv-drop-target-dropzone')
        ).toHaveLength(0);

        target.dispose();
        document.body.removeChild(element);
    });

    test('drop fires onDrop with the latched position and removes the overlay', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);

        jest.spyOn(element, 'offsetWidth', 'get').mockReturnValue(100);
        jest.spyOn(element, 'offsetHeight', 'get').mockReturnValue(40);
        jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
            top: 0,
            left: 0,
            right: 100,
            bottom: 40,
            width: 100,
            height: 40,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });

        const target = new PointerDropTarget(element, {
            acceptedTargetZones: ['left', 'right'],
            canDisplayOverlay: () => true,
        });

        const onDrop = jest.fn();
        target.onDrop(onDrop);

        // Right-side drag-over.
        (target as any)._onDragOver(makeDragEvent(90, 20));
        expect(target.state).toBe('right');

        (target as any)._onDropEvent(makeDragEvent(90, 20));

        expect(onDrop).toHaveBeenCalledTimes(1);
        expect(onDrop).toHaveBeenCalledWith(
            expect.objectContaining({ position: 'right' })
        );
        expect(
            element.getElementsByClassName('dv-drop-target-dropzone')
        ).toHaveLength(0);

        target.dispose();
        document.body.removeChild(element);
    });

    test('disabling clears any active overlay and ignores subsequent drag-overs', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);

        jest.spyOn(element, 'offsetWidth', 'get').mockReturnValue(100);
        jest.spyOn(element, 'offsetHeight', 'get').mockReturnValue(40);
        jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
            top: 0,
            left: 0,
            right: 100,
            bottom: 40,
            width: 100,
            height: 40,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });

        const target = new PointerDropTarget(element, {
            acceptedTargetZones: ['left', 'right'],
            canDisplayOverlay: () => true,
        });

        (target as any)._onDragOver(makeDragEvent(10, 20));
        expect(
            element.getElementsByClassName('dv-drop-target-dropzone')
        ).toHaveLength(1);

        target.disabled = true;
        expect(
            element.getElementsByClassName('dv-drop-target-dropzone')
        ).toHaveLength(0);

        (target as any)._onDragOver(makeDragEvent(10, 20));
        expect(
            element.getElementsByClassName('dv-drop-target-dropzone')
        ).toHaveLength(0);

        target.dispose();
        document.body.removeChild(element);
    });
});
