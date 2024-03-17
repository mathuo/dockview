import React from 'react';

/**
 * useful utility type to erase readonly signatures for testing purposes
 *
 * @see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#readonly-mapped-type-modifiers-and-readonly-arrays
 */
export type Writable<T> = T extends object
    ? { -readonly [K in keyof T]: Writable<T[K]> }
    : T;

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

/**
 * `jest.runAllTicks` doesn't seem to exhaust all events in the micro-task queue so
 * as a **hacky** alternative we'll wait for an empty Promise to complete which runs
 * on the micro-task queue so will force a run-to-completion emptying the queue
 * of any pending micro-task
 */
export function exhaustMicrotaskQueue(): Promise<void> {
    return new Promise<void>((resolve) => resolve());
}
