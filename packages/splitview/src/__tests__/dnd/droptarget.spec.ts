import { Droptarget, Position } from '../../dnd/droptarget';
import { fireEvent } from '@testing-library/dom';

function createOffsetDragOverEvent(params: {
    offsetX: number;
    offsetY: number;
}): Event {
    const event = new Event('dragover', {
        bubbles: true,
        cancelable: true,
    });
    Object.defineProperty(event, 'offsetX', { get: () => params.offsetX });
    Object.defineProperty(event, 'offsetY', { get: () => params.offsetY });
    return event;
}

describe('droptarget', () => {
    let element: HTMLElement;
    let droptarget: Droptarget;

    beforeEach(() => {
        element = document.createElement('div');
    });

    test('default', () => {
        droptarget = new Droptarget(element, {
            isDisabled: () => false,
            isDirectional: true,
            id: 'test-dnd',
            enableExternalDragEvents: true,
        });
        expect(droptarget.state).toBeUndefined();

        fireEvent.dragEnter(element);

        let viewQuery = element.querySelectorAll(
            '.drop-target > .drop-target-dropzone > .drop-target-selection'
        );
        expect(viewQuery.length).toBe(1);

        const target = element.querySelector(
            '.drop-target-dropzone'
        ) as HTMLElement;

        jest.spyOn(target, 'clientHeight', 'get').mockImplementation(() => 100);
        jest.spyOn(target, 'clientWidth', 'get').mockImplementation(() => 200);

        fireEvent(
            target,
            createOffsetDragOverEvent({ offsetX: 19, offsetY: 0 })
        );

        viewQuery = element.querySelectorAll(
            '.drop-target > .drop-target-dropzone > .drop-target-selection.left'
        );
        expect(viewQuery.length).toBe(1);
        expect(droptarget.state).toBe(Position.Left);

        fireEvent(
            target,
            createOffsetDragOverEvent({ offsetX: 40, offsetY: 19 })
        );

        viewQuery = element.querySelectorAll(
            '.drop-target > .drop-target-dropzone > .drop-target-selection.top'
        );
        expect(viewQuery.length).toBe(1);
        expect(droptarget.state).toBe(Position.Top);

        fireEvent(
            target,
            createOffsetDragOverEvent({ offsetX: 160, offsetY: 81 })
        );

        viewQuery = element.querySelectorAll(
            '.drop-target > .drop-target-dropzone > .drop-target-selection.bottom'
        );
        expect(viewQuery.length).toBe(1);
        expect(droptarget.state).toBe(Position.Bottom);

        fireEvent(
            target,
            createOffsetDragOverEvent({ offsetX: 161, offsetY: 0 })
        );

        viewQuery = element.querySelectorAll(
            '.drop-target > .drop-target-dropzone > .drop-target-selection.right'
        );
        expect(viewQuery.length).toBe(1);
        expect(droptarget.state).toBe(Position.Right);

        fireEvent(
            target,
            createOffsetDragOverEvent({ offsetX: 100, offsetY: 50 })
        );
        expect(droptarget.state).toBe(Position.Center);

        fireEvent.dragLeave(target);

        expect(droptarget.state).toBeUndefined();
        viewQuery = element.querySelectorAll('.drop-target');
        expect(viewQuery.length).toBe(0);
    });
});
