import { Droptarget, Position } from '../../dnd/droptarget';
import { fireEvent } from '@testing-library/dom';

function createOffsetDragOverEvent(params: {
    clientX: number;
    clientY: number;
}): Event {
    const event = new Event('dragover', {
        bubbles: true,
        cancelable: true,
    });
    Object.defineProperty(event, 'clientX', { get: () => params.clientX });
    Object.defineProperty(event, 'clientY', { get: () => params.clientY });
    return event;
}

describe('droptarget', () => {
    let element: HTMLElement;
    let droptarget: Droptarget;

    beforeEach(() => {
        element = document.createElement('div');

        jest.spyOn(element, 'clientHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(element, 'clientWidth', 'get').mockImplementation(() => 200);
    });

    test('non-directional', () => {
        let position: Position | undefined = undefined;

        droptarget = new Droptarget(element, {
            canDisplayOverlay: () => true,
            acceptedTargetZones: ['center'],
        });

        droptarget.onDrop((event) => {
            position = event.position;
        });

        fireEvent.dragEnter(element);
        fireEvent.dragOver(element);

        const target = element.querySelector(
            '.drop-target-dropzone'
        ) as HTMLElement;
        fireEvent.drop(target);
        expect(position).toBe(Position.Center);
    });

    test('drop', () => {
        let position: Position | undefined = undefined;

        droptarget = new Droptarget(element, {
            canDisplayOverlay: () => true,
            acceptedTargetZones: ['top', 'left', 'right', 'bottom', 'center'],
        });

        droptarget.onDrop((event) => {
            position = event.position;
        });

        fireEvent.dragEnter(element);
        fireEvent.dragOver(element);

        const target = element.querySelector(
            '.drop-target-dropzone'
        ) as HTMLElement;

        jest.spyOn(target, 'clientHeight', 'get').mockImplementation(() => 100);
        jest.spyOn(target, 'clientWidth', 'get').mockImplementation(() => 200);

        fireEvent(
            target,
            createOffsetDragOverEvent({
                clientX: 19,
                clientY: 0,
            })
        );

        expect(position).toBeUndefined();
        fireEvent.drop(target);
        expect(position).toBe(Position.Left);
    });

    test('default', () => {
        droptarget = new Droptarget(element, {
            canDisplayOverlay: () => true,
            acceptedTargetZones: ['top', 'left', 'right', 'bottom', 'center'],
        });

        expect(droptarget.state).toBeUndefined();

        fireEvent.dragEnter(element);
        fireEvent.dragOver(element);

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
            createOffsetDragOverEvent({ clientX: 19, clientY: 0 })
        );

        viewQuery = element.querySelectorAll(
            '.drop-target > .drop-target-dropzone > .drop-target-selection'
        );
        expect(viewQuery.length).toBe(1);
        expect(droptarget.state).toBe(Position.Left);
        expect(
            (
                element
                    .getElementsByClassName('drop-target-selection')
                    .item(0) as HTMLDivElement
            ).style.transform
        ).toBe('translateX(-25%) scaleX(0.5)');

        fireEvent(
            target,
            createOffsetDragOverEvent({ clientX: 40, clientY: 19 })
        );

        viewQuery = element.querySelectorAll(
            '.drop-target > .drop-target-dropzone > .drop-target-selection'
        );
        expect(viewQuery.length).toBe(1);
        expect(droptarget.state).toBe(Position.Top);
        expect(
            (
                element
                    .getElementsByClassName('drop-target-selection')
                    .item(0) as HTMLDivElement
            ).style.transform
        ).toBe('translateY(-25%) scaleY(0.5)');

        fireEvent(
            target,
            createOffsetDragOverEvent({ clientX: 160, clientY: 81 })
        );

        viewQuery = element.querySelectorAll(
            '.drop-target > .drop-target-dropzone > .drop-target-selection'
        );
        expect(viewQuery.length).toBe(1);
        expect(droptarget.state).toBe(Position.Bottom);
        expect(
            (
                element
                    .getElementsByClassName('drop-target-selection')
                    .item(0) as HTMLDivElement
            ).style.transform
        ).toBe('translateY(25%) scaleY(0.5)');

        fireEvent(
            target,
            createOffsetDragOverEvent({ clientX: 161, clientY: 0 })
        );

        viewQuery = element.querySelectorAll(
            '.drop-target > .drop-target-dropzone > .drop-target-selection'
        );
        expect(viewQuery.length).toBe(1);
        expect(droptarget.state).toBe(Position.Right);
        expect(
            (
                element
                    .getElementsByClassName('drop-target-selection')
                    .item(0) as HTMLDivElement
            ).style.transform
        ).toBe('translateX(25%) scaleX(0.5)');

        fireEvent(
            target,
            createOffsetDragOverEvent({ clientX: 100, clientY: 50 })
        );
        expect(droptarget.state).toBe(Position.Center);
        expect(
            (
                element
                    .getElementsByClassName('drop-target-selection')
                    .item(0) as HTMLDivElement
            ).style.transform
        ).toBe('');

        fireEvent.dragLeave(target);
        expect(droptarget.state).toBe(Position.Center);
        viewQuery = element.querySelectorAll('.drop-target');
        expect(viewQuery.length).toBe(0);
    });
});
