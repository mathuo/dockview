import { DockviewComponent } from '../../dockview/dockviewComponent';
import { AllModules } from '../../dockview/allModules';
import { IContentRenderer } from '../../dockview/types';

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
 * Every module must be independently removable: with any single module filtered
 * out, the core component must still construct, run the base layout operations
 * (add / split / maximize / serialize / remove), and dispose without throwing.
 * This is the contract that makes the eventual package split a lift-and-move —
 * if removing a module breaks core, the boundary is leaking and needs fixing.
 */
describe('module removability', () => {
    const exercise = (excludedName: string | null): void => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const modules = excludedName
            ? AllModules.filter((m) => m.moduleName !== excludedName)
            : AllModules;
        const dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            // internal seam — register a subset
            modules,
        } as never);
        dockview.layout(800, 600);

        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({
            id: 'p2',
            component: 'default',
            position: { direction: 'right' },
        });
        p1.api.group.api.maximize();
        p1.api.group.api.exitMaximized();
        // panel-reference ops before serialize (fromJSON recreates panels)
        dockview.removePanel(p1);
        const json = dockview.toJSON();
        dockview.fromJSON(json);

        dockview.dispose();
        container.remove();
    };

    test('baseline — all modules present', () => {
        expect(() => exercise(null)).not.toThrow();
    });

    AllModules.forEach((module) => {
        test(`core operates with "${module.moduleName}" removed`, () => {
            expect(() => exercise(module.moduleName)).not.toThrow();
        });
    });
});
