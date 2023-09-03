import * as React from 'react';

export function setMockRefElement(node: Partial<HTMLElement>): void {
    const mockRef = {
        get current() {
            return node;
        },
        set current(_value) {
            //noop
        },
    };

    jest.spyOn(React, 'useRef').mockReturnValueOnce(mockRef);
}

export function createOffsetDragOverEvent(params: {
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
