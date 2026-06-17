import * as dockview from '..';
import { DockviewEmitter } from 'dockview-core';

describe('dockview', () => {
    test('re-exports the dockview-core public API', () => {
        // `dockview` is a thin re-export of `dockview-core`; assert that the
        // public surface is forwarded so consumers can import either package.
        expect(dockview.DockviewEmitter).toBe(DockviewEmitter);
    });
});
