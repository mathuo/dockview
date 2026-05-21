import '@testing-library/jest-dom';
import { PointerDragController } from './packages/dockview-core/src/dnd/pointer/pointerDragController';

// `PointerDragController` is a module-level singleton — state leaks across
// test files unless explicitly reset. Tests that drive a pointer drag end
// to end already call `cancel()` in their own beforeEach, but a global
// afterEach makes the cleanup automatic so newly-added tests can't
// accidentally inherit a half-finished drag.
afterEach(() => {
    PointerDragController.getInstance().cancel();
});
