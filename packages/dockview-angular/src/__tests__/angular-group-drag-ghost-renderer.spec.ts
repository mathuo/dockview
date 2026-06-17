import { TestBed } from '@angular/core/testing';
import {
    ApplicationRef,
    Component,
    EnvironmentInjector,
    Injector,
} from '@angular/core';
import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewApi, IDockviewGroupPanel } from 'dockview';
import { AngularGroupDragGhostRenderer } from '../lib/dockview/angular-group-drag-ghost-renderer';

@Component({
    standalone: false,
    selector: 'test-ghost',
    template: '<span class="test-ghost">{{ group?.id }}</span>',
})
class TestGhostComponent {
    group: IDockviewGroupPanel | undefined;
    api: DockviewApi | undefined;
}

describe('AngularGroupDragGhostRenderer', () => {
    let injector: Injector;
    let environmentInjector: EnvironmentInjector;
    let application: ApplicationRef;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TestGhostComponent],
        }).compileComponents();

        injector = TestBed.inject(Injector);
        environmentInjector = TestBed.inject(EnvironmentInjector);
        application = TestBed.inject(ApplicationRef);
    });

    afterEach(() => {
        TestBed.resetTestingModule();
    });

    test('element has correct class and display style', () => {
        const renderer = new AngularGroupDragGhostRenderer(
            TestGhostComponent,
            injector,
            environmentInjector
        );

        expect(renderer.element.className).toBe('dv-angular-part');
        expect(renderer.element.style.display).toBe('inline-flex');
    });

    test('init renders the component with group and api', () => {
        const renderer = new AngularGroupDragGhostRenderer(
            TestGhostComponent,
            injector,
            environmentInjector
        );

        const group = fromPartial<IDockviewGroupPanel>({ id: 'group-1' });

        renderer.init({
            group,
            api: fromPartial<DockviewApi>({}),
        });
        application.tick();

        expect(renderer.element.innerHTML).toContain('group-1');
    });

    test('dispose destroys the component', () => {
        const renderer = new AngularGroupDragGhostRenderer(
            TestGhostComponent,
            injector,
            environmentInjector
        );

        renderer.init({
            group: fromPartial<IDockviewGroupPanel>({ id: 'g' }),
            api: fromPartial<DockviewApi>({}),
        });

        expect(() => renderer.dispose()).not.toThrow();
    });

    test('dispose before init does not throw', () => {
        const renderer = new AngularGroupDragGhostRenderer(
            TestGhostComponent,
            injector,
            environmentInjector
        );

        expect(() => renderer.dispose()).not.toThrow();
    });
});
