import { TestBed } from '@angular/core/testing';
import {
    ApplicationRef,
    Component,
    EnvironmentInjector,
    Injector,
} from '@angular/core';
import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewApi, ITabGroup } from 'dockview-core';
import { AngularTabGroupChipRenderer } from '../lib/dockview/angular-tab-group-chip-renderer';

@Component({
    standalone: false,
    selector: 'test-chip',
    template:
        '<span class="test-chip">{{ tabGroup?.label }} - {{ tabGroup?.color }}</span>',
})
class TestChipComponent {
    tabGroup: ITabGroup | undefined;
    api: DockviewApi | undefined;
}

describe('AngularTabGroupChipRenderer', () => {
    let injector: Injector;
    let environmentInjector: EnvironmentInjector;
    let application: ApplicationRef;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TestChipComponent],
        }).compileComponents();

        injector = TestBed.inject(Injector);
        environmentInjector = TestBed.inject(EnvironmentInjector);
        application = TestBed.inject(ApplicationRef);
    });

    afterEach(() => {
        TestBed.resetTestingModule();
    });

    test('element has correct class and display style', () => {
        const renderer = new AngularTabGroupChipRenderer(
            TestChipComponent,
            injector,
            environmentInjector
        );

        expect(renderer.element.className).toBe('dv-angular-part');
        expect(renderer.element.style.display).toBe('inline-flex');
    });

    test('init renders the component with tabGroup and api', () => {
        const renderer = new AngularTabGroupChipRenderer(
            TestChipComponent,
            injector,
            environmentInjector
        );

        const tabGroup = fromPartial<ITabGroup>({
            label: 'Feature',
            color: 'blue',
        });

        renderer.init({
            tabGroup,
            api: fromPartial<DockviewApi>({}),
        });
        application.tick();

        expect(renderer.element.innerHTML).toContain('Feature - blue');
    });

    test('update changes the tabGroup property', () => {
        const renderer = new AngularTabGroupChipRenderer(
            TestChipComponent,
            injector,
            environmentInjector
        );

        renderer.init({
            tabGroup: fromPartial<ITabGroup>({
                label: 'Old',
                color: 'grey',
            }),
            api: fromPartial<DockviewApi>({}),
        });
        application.tick();

        renderer.update({
            tabGroup: fromPartial<ITabGroup>({
                label: 'New',
                color: 'red',
            }),
        });
        application.tick();

        expect(renderer.element.innerHTML).toContain('New - red');
    });

    test('update before init does not throw', () => {
        const renderer = new AngularTabGroupChipRenderer(
            TestChipComponent,
            injector,
            environmentInjector
        );

        expect(() =>
            renderer.update({
                tabGroup: fromPartial<ITabGroup>({
                    label: 'Test',
                    color: 'blue',
                }),
            })
        ).not.toThrow();
    });

    test('dispose destroys the component', () => {
        const renderer = new AngularTabGroupChipRenderer(
            TestChipComponent,
            injector,
            environmentInjector
        );

        renderer.init({
            tabGroup: fromPartial<ITabGroup>({
                label: 'Test',
                color: 'grey',
            }),
            api: fromPartial<DockviewApi>({}),
        });

        expect(() => renderer.dispose()).not.toThrow();
    });

    test('dispose before init does not throw', () => {
        const renderer = new AngularTabGroupChipRenderer(
            TestChipComponent,
            injector,
            environmentInjector
        );

        expect(() => renderer.dispose()).not.toThrow();
    });
});
