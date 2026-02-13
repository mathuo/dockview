import {
    calculateQuadrantAsPercentage,
    calculateQuadrantAsPixels,
    directionToPosition,
    Droptarget,
    Position,
    positionToDirection,
} from '../../dnd/droptarget';
import { fireEvent } from '@testing-library/dom';
import { createOffsetDragOverEvent } from '../__test_utils__/utils';

describe('droptarget', () => {
    let element: HTMLElement;
    let droptarget: Droptarget;

    beforeEach(() => {
        element = document.createElement('div');

        jest.spyOn(element, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(element, 'offsetWidth', 'get').mockImplementation(() => 200);
    });

    test('that dragover events are marked', () => {
        droptarget = new Droptarget(element, {
            canDisplayOverlay: () => true,
            acceptedTargetZones: ['center'],
        });

        fireEvent.dragEnter(element);
        const event = new Event('dragover');
        fireEvent(element, event);

        expect(
            (event as any)['__dockview_droptarget_event_is_used__']
        ).toBeTruthy();
    });

    test('that the drop target is removed when receiving a marked dragover event', () => {
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
            '.dv-drop-target-dropzone'
        ) as HTMLElement;
        fireEvent.drop(target);
        expect(position).toBe('center');

        const event = new Event('dragover');
        (event as any)['__dockview_droptarget_event_is_used__'] = true;
        fireEvent(element, event);
        expect(element.querySelector('.dv-drop-target-dropzone')).toBeNull();
    });

    test('directionToPosition', () => {
        expect(directionToPosition('above')).toBe('top');
        expect(directionToPosition('below')).toBe('bottom');
        expect(directionToPosition('left')).toBe('left');
        expect(directionToPosition('right')).toBe('right');
        expect(directionToPosition('within')).toBe('center');
        expect(() => directionToPosition('bad_input' as any)).toThrow(
            "invalid direction 'bad_input'"
        );
    });

    test('positionToDirection', () => {
        expect(positionToDirection('top')).toBe('above');
        expect(positionToDirection('bottom')).toBe('below');
        expect(positionToDirection('left')).toBe('left');
        expect(positionToDirection('right')).toBe('right');
        expect(positionToDirection('center')).toBe('within');
        expect(() => positionToDirection('bad_input' as any)).toThrow(
            "invalid position 'bad_input'"
        );
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
            '.dv-drop-target-dropzone'
        ) as HTMLElement;
        fireEvent.drop(target);
        expect(position).toBe('center');
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
            '.dv-drop-target-dropzone'
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
        expect(position).toBe('left');
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
            '.dv-drop-target > .dv-drop-target-dropzone > .dv-drop-target-selection'
        );
        expect(viewQuery.length).toBe(1);

        const target = element.querySelector(
            '.dv-drop-target-dropzone'
        ) as HTMLElement;

        jest.spyOn(target, 'clientHeight', 'get').mockImplementation(() => 100);
        jest.spyOn(target, 'clientWidth', 'get').mockImplementation(() => 200);

        fireEvent(
            target,
            createOffsetDragOverEvent({ clientX: 19, clientY: 0 })
        );

        function check(
            element: HTMLElement,
            box: {
                left: string;
                top: string;
                width: string;
                height: string;
            }
        ) {
            // Check positioning (back to top/left with GPU layer maintained)
            expect(element.style.top).toBe(box.top);
            expect(element.style.left).toBe(box.left);
            expect(element.style.width).toBe(box.width);
            expect(element.style.height).toBe(box.height);
            // Ensure GPU layer is maintained
            expect(element.style.transform).toBe('translate3d(0, 0, 0)');
        }

        viewQuery = element.querySelectorAll(
            '.dv-drop-target > .dv-drop-target-dropzone > .dv-drop-target-selection'
        );
        expect(viewQuery.length).toBe(1);
        expect(droptarget.state).toBe('left');
        check(
            element
                .getElementsByClassName('dv-drop-target-selection')
                .item(0) as HTMLDivElement,
            {
                top: '0px',
                left: '0px',
                width: '50%',
                height: '100%',
            }
        );

        fireEvent(
            target,
            createOffsetDragOverEvent({ clientX: 40, clientY: 19 })
        );

        viewQuery = element.querySelectorAll(
            '.dv-drop-target > .dv-drop-target-dropzone > .dv-drop-target-selection'
        );
        expect(viewQuery.length).toBe(1);
        expect(droptarget.state).toBe('top');
        check(
            element
                .getElementsByClassName('dv-drop-target-selection')
                .item(0) as HTMLDivElement,
            {
                top: '0px',
                left: '0px',
                width: '100%',
                height: '50%',
            }
        );

        fireEvent(
            target,
            createOffsetDragOverEvent({ clientX: 160, clientY: 81 })
        );

        viewQuery = element.querySelectorAll(
            '.dv-drop-target > .dv-drop-target-dropzone > .dv-drop-target-selection'
        );
        expect(viewQuery.length).toBe(1);
        expect(droptarget.state).toBe('bottom');
        check(
            element
                .getElementsByClassName('dv-drop-target-selection')
                .item(0) as HTMLDivElement,
            {
                top: '50%',
                left: '0px',
                width: '100%',
                height: '50%',
            }
        );

        fireEvent(
            target,
            createOffsetDragOverEvent({ clientX: 161, clientY: 0 })
        );

        viewQuery = element.querySelectorAll(
            '.dv-drop-target > .dv-drop-target-dropzone > .dv-drop-target-selection'
        );
        expect(viewQuery.length).toBe(1);
        expect(droptarget.state).toBe('right');
        check(
            element
                .getElementsByClassName('dv-drop-target-selection')
                .item(0) as HTMLDivElement,
            {
                top: '0px',
                left: '50%',
                width: '50%',
                height: '100%',
            }
        );
        fireEvent(
            target,
            createOffsetDragOverEvent({ clientX: 100, clientY: 50 })
        );
        expect(droptarget.state).toBe('center');
        // With GPU optimizations, elements always have a base transform layer
        expect(
            (
                element
                    .getElementsByClassName('dv-drop-target-selection')
                    .item(0) as HTMLDivElement
            ).style.transform
        ).toBe('translate3d(0, 0, 0)');

        fireEvent.dragLeave(target);
        expect(droptarget.state).toBe('center');
        viewQuery = element.querySelectorAll('.dv-drop-target');
        expect(viewQuery.length).toBe(0);
    });

    describe('calculateQuadrantAsPercentage', () => {
        test('variety of cases', () => {
            const inputs: Array<{
                directions: Position[];
                x: number;
                y: number;
                result: Position | null;
            }> = [
                { directions: ['left', 'right'], x: 19, y: 50, result: 'left' },
                {
                    directions: ['left', 'right'],
                    x: 81,
                    y: 50,
                    result: 'right',
                },
                {
                    directions: ['top', 'bottom'],
                    x: 50,
                    y: 19,
                    result: 'top',
                },
                {
                    directions: ['top', 'bottom'],
                    x: 50,
                    y: 81,
                    result: 'bottom',
                },
                {
                    directions: ['left', 'right', 'top', 'bottom', 'center'],
                    x: 50,
                    y: 50,
                    result: 'center',
                },
                {
                    directions: ['left', 'right', 'top', 'bottom'],
                    x: 50,
                    y: 50,
                    result: null,
                },
            ];

            for (const input of inputs) {
                expect(
                    calculateQuadrantAsPercentage(
                        new Set(input.directions),
                        input.x,
                        input.y,
                        100,
                        100,
                        20
                    )
                ).toBe(input.result);
            }
        });
    });

    describe('calculateQuadrantAsPixels', () => {
        test('variety of cases', () => {
            const inputs: Array<{
                directions: Position[];
                x: number;
                y: number;
                result: Position | null;
            }> = [
                { directions: ['left', 'right'], x: 19, y: 50, result: 'left' },
                {
                    directions: ['left', 'right'],
                    x: 81,
                    y: 50,
                    result: 'right',
                },
                {
                    directions: ['top', 'bottom'],
                    x: 50,
                    y: 19,
                    result: 'top',
                },
                {
                    directions: ['top', 'bottom'],
                    x: 50,
                    y: 81,
                    result: 'bottom',
                },
                {
                    directions: ['left', 'right', 'top', 'bottom', 'center'],
                    x: 50,
                    y: 50,
                    result: 'center',
                },
                {
                    directions: ['left', 'right', 'top', 'bottom'],
                    x: 50,
                    y: 50,
                    result: null,
                },
            ];

            for (const input of inputs) {
                expect(
                    calculateQuadrantAsPixels(
                        new Set(input.directions),
                        input.x,
                        input.y,
                        100,
                        100,
                        20
                    )
                ).toBe(input.result);
            }
        });
    });
});
