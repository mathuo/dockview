import {
    DockviewComponent,
    DockviewModule,
    IContentRenderer,
    clearRegisteredModules,
    registerModules,
} from 'dockview-core';
import { Modules } from '..';

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
 * Companion to dockview-core's own `module removability` spec, which proves the
 * built-in (core) modules are each independently removable. This proves the
 * same for the *extracted* modules in this package: with any one of them
 * absent, the core component must still construct, run the base layout
 * operations (add / split / maximize / serialize / remove) and dispose without
 * throwing. That is the contract that keeps the package boundary a
 * lift-and-move: if removing a module breaks core, the boundary is leaking.
 *
 * Modules are wired through the process-global registry exactly how `dockview`
 * ships them (`registerModules(Modules)`); the component is then constructed
 * with no explicit `modules` option so it picks up the full realistic stack:
 * core built-ins + whatever is registered here.
 *
 * `register()` recursively pulls in a module's `dependsOn`, so dropping a
 * depended-on module while a dependent is still present would silently re-add
 * it. To remove a module *genuinely* we also drop its (transitive) dependents.
 */
describe('extracted module removability', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
        // restore the baseline global registration for any later test
        clearRegisteredModules();
        registerModules(Modules);
    });

    const transitiveDependents = (
        target: DockviewModule<any>
    ): Set<DockviewModule<any>> => {
        const dependents = new Set<DockviewModule<any>>();
        let changed = true;
        while (changed) {
            changed = false;
            for (const m of Modules) {
                if (m === target || dependents.has(m)) {
                    continue;
                }
                const deps = m.dependsOn ?? [];
                if (
                    deps.includes(target) ||
                    deps.some((d) => dependents.has(d))
                ) {
                    dependents.add(m);
                    changed = true;
                }
            }
        }
        return dependents;
    };

    const exercise = (excluded: DockviewModule<any> | null): void => {
        const drop = excluded
            ? new Set([excluded, ...transitiveDependents(excluded)])
            : new Set<DockviewModule<any>>();
        clearRegisteredModules();
        registerModules(Modules.filter((m) => !drop.has(m)));

        const dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
        });
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
    };

    test('baseline: all extracted modules present', () => {
        expect(() => exercise(null)).not.toThrow();
    });

    Modules.forEach((module) => {
        test(`core operates with "${module.moduleName}" removed`, () => {
            expect(() => exercise(module)).not.toThrow();
        });
    });
});
