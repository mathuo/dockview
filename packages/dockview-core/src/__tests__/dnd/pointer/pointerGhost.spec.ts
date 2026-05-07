import { PointerGhost } from '../../../dnd/pointer/pointerGhost';

describe('PointerGhost', () => {
    test('attaches the element to body with fixed positioning at the initial pointer', () => {
        const ghostEl = document.createElement('div');
        ghostEl.textContent = 'ghost';

        const ghost = new PointerGhost({
            element: ghostEl,
            initialX: 100,
            initialY: 50,
        });

        expect(ghostEl.parentElement).toBe(document.body);
        expect(ghostEl.style.position).toBe('fixed');
        expect(ghostEl.style.pointerEvents).toBe('none');
        expect(ghostEl.style.left).toBe('100px');
        expect(ghostEl.style.top).toBe('50px');

        ghost.dispose();
    });

    test('update() repositions to the new pointer location', () => {
        const ghostEl = document.createElement('div');
        const ghost = new PointerGhost({
            element: ghostEl,
            initialX: 0,
            initialY: 0,
        });

        ghost.update(200, 75);
        expect(ghostEl.style.left).toBe('200px');
        expect(ghostEl.style.top).toBe('75px');

        ghost.dispose();
    });

    test('honours the offset so the pointer sits inside the ghost', () => {
        const ghostEl = document.createElement('div');
        const ghost = new PointerGhost({
            element: ghostEl,
            initialX: 100,
            initialY: 100,
            offsetX: 30,
            offsetY: -10,
        });

        // The pointer at (100, 100) with a 30/-10 offset means the ghost's
        // top-left should be (70, 110): pointer is 30px in from left, 10px
        // below the top.
        expect(ghostEl.style.left).toBe('70px');
        expect(ghostEl.style.top).toBe('110px');

        ghost.update(150, 150);
        expect(ghostEl.style.left).toBe('120px');
        expect(ghostEl.style.top).toBe('160px');

        ghost.dispose();
    });

    test('dispose() removes the element and is idempotent', () => {
        const ghostEl = document.createElement('div');
        const ghost = new PointerGhost({
            element: ghostEl,
            initialX: 0,
            initialY: 0,
        });

        expect(ghostEl.parentElement).toBe(document.body);

        ghost.dispose();
        expect(ghostEl.parentElement).toBeNull();

        // Second dispose must be a no-op (no throw).
        expect(() => ghost.dispose()).not.toThrow();
    });

    test('update() after dispose is a no-op', () => {
        const ghostEl = document.createElement('div');
        const ghost = new PointerGhost({
            element: ghostEl,
            initialX: 0,
            initialY: 0,
        });

        ghost.dispose();
        ghost.update(500, 500);
        // Element is detached and we don't write to its style afterwards.
        expect(ghostEl.style.left).toBe('0px');
    });
});
