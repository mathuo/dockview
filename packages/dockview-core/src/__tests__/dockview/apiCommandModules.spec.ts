import { DockviewComponent } from '../../dockview/dockviewComponent';
import { AllModules } from '../../dockview/allModules';
import { IContentRenderer } from '../../dockview/types';
import { DockviewComponentOptions } from '../../dockview/options';
import { _resetMissingModuleWarnings } from '../../dockview/modules';

class TestPanel implements IContentRenderer {
    element = document.createElement('div');
    init(): void {
        // noop
    }
    layout(): void {
        // noop
    }
    dispose(): void {
        // noop
    }
}

/**
 * The API half of the missing-module diagnostic. `optionsModules.spec.ts` covers
 * options; this covers commands.
 *
 * A command that touches an enterprise service and is reachable *without* its
 * gating option must report the missing module itself, because no option rule
 * will have run. `api.pinEdgeGroup()` is the case that motivated this: edge
 * groups are free, so a build can hold one and call the auto-hide commands
 * having never set `autoHideEdgeGroups`. Queries stay silent: `false` from
 * `canUndo` is a truthful answer, not a misconfiguration.
 *
 * `AllModules` is core-only, so every component here is a free build; the
 * enterprise modules only register on import of `dockview-enterprise`, which
 * this package never imports.
 *
 * This is coverage by enumeration, the same hand-maintained kind the options
 * side has: it locks in the commands that guard today, but adding a new gated
 * command means adding it here too, and nothing will remind you.
 */
describe('enterprise API commands report the missing module on a free build', () => {
    let consoleError: jest.SpyInstance;
    const built: DockviewComponent[] = [];

    function freeDockview(
        options: Partial<DockviewComponentOptions> = {}
    ): DockviewComponent {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const dv = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            modules: AllModules,
            ...options,
        } as never);
        dv.layout(1000, 800);
        built.push(dv);
        return dv;
    }

    beforeEach(() => {
        // Dedup is page-global and outlives a test, so reset it or only the
        // first component in this file would log.
        _resetMissingModuleWarnings();
        consoleError = jest
            .spyOn(console, 'error')
            .mockImplementation(() => undefined);
    });

    afterEach(() => {
        for (const dv of built.splice(0)) {
            dv.dispose();
        }
        jest.restoreAllMocks();
    });

    /** The single string console.error was last called with. */
    function lastMessage(): string {
        expect(consoleError).toHaveBeenCalled();
        return consoleError.mock.calls[consoleError.mock.calls.length - 1][0];
    }

    describe.each([
        ['pinEdgeGroup', (dv: DockviewComponent) => dv.pinEdgeGroup('left')],
        [
            'autoHideEdgeGroup',
            (dv: DockviewComponent) => dv.autoHideEdgeGroup('left'),
        ],
        [
            'peekEdgeGroup',
            (dv: DockviewComponent) => dv.peekEdgeGroup('left', true),
        ],
    ])('AutoHideEdgeGroup command %s', (name, call) => {
        test('reports AutoHideEdgeGroup and names the package', () => {
            call(freeDockview());

            const message = lastMessage();
            expect(message).toContain('AutoHideEdgeGroup');
            expect(message).toContain('dockview-enterprise');
            expect(message).toContain(`api.${name}`);
        });

        test('degrades to a no-op rather than throwing', () => {
            expect(() => call(freeDockview())).not.toThrow();
        });
    });

    describe.each([
        ['undo', (dv: DockviewComponent) => dv.undo()],
        ['redo', (dv: DockviewComponent) => dv.redo()],
    ])('LayoutHistory command %s', (name, call) => {
        test('reports LayoutHistory and names the package', () => {
            call(freeDockview());

            const message = lastMessage();
            expect(message).toContain('LayoutHistory');
            expect(message).toContain('dockview-enterprise');
            expect(message).toContain(`api.${name}`);
        });
    });

    test('queries stay silent: canUndo/canRedo answer without logging', () => {
        const dv = freeDockview();

        expect(dv.canUndo).toBe(false);
        expect(dv.canRedo).toBe(false);
        expect(consoleError).not.toHaveBeenCalled();
    });

    test('a command dedups: calling it twice on one build logs once', () => {
        const dv = freeDockview();

        dv.pinEdgeGroup('left');
        dv.pinEdgeGroup('right');

        expect(consoleError).toHaveBeenCalledTimes(1);
    });
});
