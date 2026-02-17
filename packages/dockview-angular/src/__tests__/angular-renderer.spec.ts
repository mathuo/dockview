import { TestBed } from '@angular/core/testing';
import {
    ApplicationRef,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EnvironmentInjector,
    inject,
    Injector,
} from '@angular/core';
import { AngularRenderer } from '../lib/utils/angular-renderer';

@Component({
    selector: 'test-component',
    template:
        '<div class="test-component">{{ params?.title }} - {{ params?.value }}</div>',
})
class TestComponent {
    params: { title?: string; value?: string } = {};
    api: any = undefined;
    containerApi: any = undefined;
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

describe('AngularRenderer', () => {
    let injector: Injector;
    let environmentInjector: EnvironmentInjector;
    let application: ApplicationRef;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TestComponent, TestUpdateComponent],
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
        const renderer = new AngularRenderer<TestComponent>({
            component: TestComponent,
            injector,
            environmentInjector,
        });

        renderer.init({
            params: { title: 'Updated Title', value: 'test-value' },
            api: {},
            containerApi: {},
        });
        application.tick(); // trigger change detection

        expect(renderer.element).toBeTruthy();
        expect(renderer.element.tagName).toBe('TEST-COMPONENT');
        expect(renderer.element.innerHTML).toContain(
            'Updated Title - test-value'
        );
    });

    it('should update component properties', () => {
        const renderer = new AngularRenderer<TestComponent>({
            component: TestComponent,
            injector,
            environmentInjector,
        });

        renderer.init({
            params: { title: 'Initial Title' },
            api: {},
            containerApi: {},
        });
        renderer.update({
            params: { title: 'Updated Title', value: 'new-value' },
        });
        application.tick(); // trigger change detection

        expect(renderer.element).toBeTruthy();
        expect(renderer.element.innerHTML).toContain(
            'Updated Title - new-value'
        );
    });

    it('should dispose correctly', () => {
        const renderer = new AngularRenderer<TestComponent>({
            component: TestComponent,
            injector,
            environmentInjector,
        });

        renderer.init({ params: { title: 'Test Title' } });
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
        const renderer = new AngularRenderer<TestComponent>({
            component: TestComponent,
            injector,
            environmentInjector,
        });

        renderer.init({ params: { title: 'Test Title' } });
        renderer.dispose();

        expect(() => {
            renderer.update({ params: { title: 'Updated Title' } });
        }).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
        const renderer = new AngularRenderer<TestComponent>({
            component: TestComponent,
            injector,
            environmentInjector,
        });

        renderer.init({ params: { title: 'Test Title' } });

        expect(() => {
            renderer.dispose();
            renderer.dispose();
            renderer.dispose();
        }).not.toThrow();
    });

    it('should render when component is marked for change detection', () => {
        const renderer = new AngularRenderer<TestUpdateComponent>({
            component: TestUpdateComponent,
            injector,
            environmentInjector,
        });

        renderer.init({});
        application.tick(); // trigger change detection

        expect(renderer.element.innerHTML).toContain('Counter: 0');
        renderer.component!.instance.updateCounter();
        application.tick();
        expect(renderer.element.innerHTML).toContain('Counter: 1');
    });

    it('should only forward params, api, and containerApi from init', () => {
        const renderer = new AngularRenderer<TestComponent>({
            component: TestComponent,
            injector,
            environmentInjector,
        });

        renderer.init({
            params: { title: 'Hello' },
            api: { mockApi: true },
            containerApi: { mockContainerApi: true },
            title: 'should-be-filtered',
        });
        application.tick();

        const instance = renderer.component!.instance;
        expect(instance.params).toEqual({ title: 'Hello' });
        expect(instance.api).toEqual({ mockApi: true });
        expect(instance.containerApi).toEqual({ mockContainerApi: true });
        expect((instance as any).title).toBeUndefined();
    });
});
