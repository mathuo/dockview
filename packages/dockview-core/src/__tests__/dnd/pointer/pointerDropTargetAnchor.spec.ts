import { PointerDragController } from '../../../dnd/pointer/pointerDragController';
import { PointerDropTarget } from '../../../dnd/pointer/pointerDropTarget';
import { DropTargetTargetModel } from '../../../dnd/droptarget';

/**
 * Verifies the anchor-container ("override target") rendering path that
 * floating groups, popout groups, and the layout root rely on. The path
 * doesn't append a dropzone to the drop element. Instead it renders into
 * an external anchor container's overlay.
 */
describe('PointerDropTarget: anchor / override target path', () => {
    afterEach(() => {
        PointerDragController.getInstance().cancel();
    });

    function makeAnchorTarget() {
        const root = document.createElement('div');
        document.body.appendChild(root);
        const overlay = document.createElement('div');
        root.appendChild(overlay);

        // Pretend the anchor container occupies the whole page so the
        // outline-element-relative box math is well-defined.
        jest.spyOn(root, 'getBoundingClientRect').mockReturnValue({
            top: 0,
            left: 0,
            right: 1000,
            bottom: 1000,
            width: 1000,
            height: 1000,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });

        const clear = jest.fn();
        const targetModel: DropTargetTargetModel = {
            getElements: jest.fn(() => ({
                root,
                overlay,
                changed: false,
            })),
            exists: jest.fn(() => true),
            clear,
        };
        return { root, overlay, targetModel, clear };
    }

    test('drag-over via the anchor path positions the EXTERNAL overlay, never appends to the drop element', () => {
        const dropEl = document.createElement('div');
        document.body.appendChild(dropEl);
        jest.spyOn(dropEl, 'offsetWidth', 'get').mockReturnValue(200);
        jest.spyOn(dropEl, 'offsetHeight', 'get').mockReturnValue(100);
        jest.spyOn(dropEl, 'getBoundingClientRect').mockReturnValue({
            top: 100,
            left: 100,
            right: 300,
            bottom: 200,
            width: 200,
            height: 100,
            x: 100,
            y: 100,
            toJSON: () => ({}),
        });

        const { overlay, targetModel } = makeAnchorTarget();

        const target = new PointerDropTarget(dropEl, {
            acceptedTargetZones: ['top', 'bottom', 'left', 'right', 'center'],
            canDisplayOverlay: () => true,
            getOverrideTarget: () => targetModel,
        });

        // Drag over the right-hand quadrant of the drop element.
        (target as any)._onDragOver({
            clientX: 280,
            clientY: 150,
            pointerEvent: new PointerEvent('pointermove', {
                clientX: 280,
                clientY: 150,
                pointerId: 1,
                pointerType: 'touch',
            }),
        });

        // No in-place dropzone should have been added to the drop element.
        expect(
            dropEl.getElementsByClassName('dv-drop-target-dropzone')
        ).toHaveLength(0);
        // The anchor overlay should have been positioned (any non-empty
        // dimensions are fine; this confirms the anchor path ran).
        expect(overlay.style.width).not.toBe('');
        expect(overlay.style.height).not.toBe('');
        expect(target.state).toBe('right');

        target.dispose();
        document.body.removeChild(dropEl);
    });

    test('pointerup over a target with an anchor calls clear() and fires onDrop with the latched position', () => {
        const dropEl = document.createElement('div');
        document.body.appendChild(dropEl);
        jest.spyOn(dropEl, 'offsetWidth', 'get').mockReturnValue(200);
        jest.spyOn(dropEl, 'offsetHeight', 'get').mockReturnValue(100);
        jest.spyOn(dropEl, 'getBoundingClientRect').mockReturnValue({
            top: 0,
            left: 0,
            right: 200,
            bottom: 100,
            width: 200,
            height: 100,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });

        const { targetModel, clear } = makeAnchorTarget();

        const target = new PointerDropTarget(dropEl, {
            acceptedTargetZones: ['left', 'right'],
            canDisplayOverlay: () => true,
            getOverrideTarget: () => targetModel,
        });

        const onDrop = jest.fn();
        target.onDrop(onDrop);

        const dragEvent = {
            clientX: 10,
            clientY: 50,
            pointerEvent: new PointerEvent('pointermove', {
                clientX: 10,
                clientY: 50,
                pointerId: 1,
                pointerType: 'touch',
            }),
        };
        (target as any)._onDragOver(dragEvent);
        (target as any)._onDropEvent(dragEvent);

        expect(onDrop).toHaveBeenCalledTimes(1);
        expect(onDrop).toHaveBeenCalledWith(
            expect.objectContaining({ position: 'left' })
        );
        expect(clear).toHaveBeenCalled();

        target.dispose();
        document.body.removeChild(dropEl);
    });
});
