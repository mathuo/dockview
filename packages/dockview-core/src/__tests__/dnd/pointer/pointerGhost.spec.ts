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
        // Position is animated via `transform` so the browser can composite
        // updates on the GPU without re-running layout per pointermove.
        expect(ghostEl.style.transform).toBe('translate3d(100px, 50px, 0)');

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
        expect(ghostEl.style.transform).toBe('translate3d(200px, 75px, 0)');

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
        expect(ghostEl.style.transform).toBe('translate3d(70px, 110px, 0)');

        ghost.update(150, 150);
        expect(ghostEl.style.transform).toBe('translate3d(120px, 160px, 0)');

        ghost.dispose();
    });

    test('attaches into the owner element’s document body when `owner` is provided', () => {
        // Build a detached document so the test doesn't rely on iframes.
        const otherDoc = document.implementation.createHTMLDocument('popout');
        const owner = otherDoc.createElement('div');
        otherDoc.body.appendChild(owner);

        const ghostEl = document.createElement('div');
        const ghost = new PointerGhost({
            element: ghostEl,
            initialX: 0,
            initialY: 0,
            owner,
        });

        // Ghost lands in the OTHER document, not the main one.
        expect(ghostEl.parentElement).toBe(otherDoc.body);
        expect(ghostEl.parentElement).not.toBe(document.body);

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

        const initialTransform = ghostEl.style.transform;
        ghost.dispose();
        ghost.update(500, 500);
        // Transform must not change after dispose.
        expect(ghostEl.style.transform).toBe(initialTransform);
    });
});
