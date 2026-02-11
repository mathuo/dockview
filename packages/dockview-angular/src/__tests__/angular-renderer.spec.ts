import { TestBed } from '@angular/core/testing';
import {
    ApplicationRef,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EnvironmentInjector,
    inject,
    Injector,
    TemplateRef,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import { AngularRenderer } from '../lib/utils/angular-renderer';

@Component({
    selector: 'test-component',
    template: '<div class="test-component">{{ title }} - {{ value }}</div>',
})
class TestComponent {
    // default values are required to ensure these properties are created on the component instance
    title: string = 'Test';
    value: string = 'default';
}

@Component({
    selector: 'test-update-component',
    template: '<div class="test-update-component">Counter: {{ counter }}</div>',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestUpdateComponent {
    private readonly cd: ChangeDetectorRef = inject(ChangeDetectorRef);
    protected counter: number = 0;

    public updateCounter() {
        // use typical OnPush change handling
        this.counter++;
        this.cd.markForCheck();
    }
}

@Component({
    selector: 'test-template-holder-component',
    template: `
        <ng-template #template>
            <test-update-component />
        </ng-template>
    `,
})
class TemplateHolderComponent {
    @ViewChild('template', { static: true })
    public template?: TemplateRef<any>;
}

describe('AngularRenderer', () => {
    let injector: Injector;
    let environmentInjector: EnvironmentInjector;
    let application: ApplicationRef;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                TestComponent,
                TestUpdateComponent,
                TemplateHolderComponent,
            ],
        }).compileComponents();

        injector = TestBed.inject(Injector);
        environmentInjector = TestBed.inject(EnvironmentInjector);
        application = TestBed.inject(ApplicationRef);
    });

    afterEach(() => {
        TestBed.resetTestingModule();
    });

    it('should be testable when Angular dependencies are available', () => {
        expect(true).toBe(true);
    });

    it('should initialize and render component', () => {
        const renderer = new AngularRenderer({
            component: TestComponent,
            injector,
            environmentInjector,
        });

        renderer.init({ title: 'Updated Title', value: 'test-value' });
        application.tick(); // trigger change detection

        expect(renderer.element).toBeTruthy();
        expect(renderer.element.tagName).toBe('TEST-COMPONENT');
        expect(renderer.element.innerHTML).toContain(
            'Updated Title - test-value'
        );
    });

    it('should update component properties', () => {
        const renderer = new AngularRenderer({
            component: TestComponent,
            injector,
            environmentInjector,
        });

        renderer.init({ title: 'Initial Title' });
        renderer.update({ title: 'Updated Title', value: 'new-value' });
        application.tick(); // trigger change detection

        expect(renderer.element).toBeTruthy();
        expect(renderer.element.innerHTML).toContain(
            'Updated Title - new-value'
        );
    });

    it('should dispose correctly', () => {
        const renderer = new AngularRenderer({
            component: TestComponent,
            injector,
            environmentInjector,
        });

        renderer.init({ title: 'Test Title' });
        const element = renderer.element;

        expect(element).toBeTruthy();

        renderer.dispose();

        expect(() => renderer.element).toThrow(
            'Angular renderer not initialized'
        );
    });

    it('should handle component creation errors gracefully', () => {
        jest.spyOn(console, 'error').mockImplementation();

        const renderer = new AngularRenderer({
            component: null as any,
            injector,
            environmentInjector,
        });

        expect(() => {
            renderer.init({});
        }).toThrow();
    });

    it('should not throw when updating after dispose', () => {
        const renderer = new AngularRenderer({
            component: TestComponent,
            injector,
            environmentInjector,
        });

        renderer.init({ title: 'Test Title' });
        renderer.dispose();

        expect(() => {
            renderer.update({ title: 'Updated Title' });
        }).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
        const renderer = new AngularRenderer({
            component: TestComponent,
            injector,
            environmentInjector,
        });

        renderer.init({ title: 'Test Title' });

        expect(() => {
            renderer.dispose();
            renderer.dispose();
            renderer.dispose();
        }).not.toThrow();
    });

    it('should render when component is marked for change detection', () => {
        const renderer = new AngularRenderer({
            component: TestUpdateComponent,
            injector,
            environmentInjector,
        });

        renderer.init({});
        application.tick(); // trigger change detection

        expect(renderer.element.innerHTML).toContain('Counter: 0');
        (renderer.component.instance as TestUpdateComponent).updateCounter();
        application.tick();
        expect(renderer.element.innerHTML).toContain('Counter: 1');
    });

    it('should render view from template', () => {
        // Create component with template
        const templateRenderer = new AngularRenderer({
            component: TemplateHolderComponent,
            injector,
        });
        templateRenderer.init({});
        const template = (
            templateRenderer.component.instance as TemplateHolderComponent
        ).template;

        expect(template).toBeDefined();

        // Create view from template
        const renderer = new AngularRenderer({
            component: template,
            injector: templateRenderer.component.injector, // use container injector to ensure we have a view
        });
        renderer.init({});
        application.tick();

        expect(renderer.element.innerHTML).toContain('Counter: 0');
    });
});
