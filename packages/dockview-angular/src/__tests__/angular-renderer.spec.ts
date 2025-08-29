import { TestBed } from '@angular/core/testing';
import { Component, Injector, EnvironmentInjector } from '@angular/core';
import { AngularRenderer } from '../lib/utils/angular-renderer';

@Component({
    selector: 'test-component',
    template: '<div class="test-component">{{ title || "Test" }} - {{ value || "default" }}</div>',
})
class TestComponent {
    title?: string;
    value?: string;
}

describe('AngularRenderer', () => {
    let injector: Injector;
    let environmentInjector: EnvironmentInjector;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TestComponent]
        }).compileComponents();
        
        injector = TestBed.inject(Injector);
        environmentInjector = TestBed.inject(EnvironmentInjector);
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
            environmentInjector
        });

        const parameters = { title: 'Updated Title', value: 'test-value' };
        renderer.init(parameters);

        expect(renderer.element).toBeTruthy();
        expect(renderer.element.tagName).toBe('TEST-COMPONENT');
    });

    it('should update component properties', () => {
        const renderer = new AngularRenderer({
            component: TestComponent,
            injector,
            environmentInjector
        });

        renderer.init({ title: 'Initial Title' });
        renderer.update({ title: 'Updated Title', value: 'new-value' });

        expect(renderer.element).toBeTruthy();
    });

    it('should dispose correctly', () => {
        const renderer = new AngularRenderer({
            component: TestComponent,
            injector,
            environmentInjector
        });

        renderer.init({ title: 'Test Title' });
        const element = renderer.element;
        
        expect(element).toBeTruthy();
        
        renderer.dispose();
        
        expect(() => renderer.element).toThrow('Angular renderer not initialized');
    });

    it('should handle component creation errors gracefully', () => {
        const renderer = new AngularRenderer({
            component: null as any,
            injector,
            environmentInjector
        });

        expect(() => {
            renderer.init({});
        }).toThrow();
    });

    it('should not throw when updating after dispose', () => {
        const renderer = new AngularRenderer({
            component: TestComponent,
            injector,
            environmentInjector
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
            environmentInjector
        });

        renderer.init({ title: 'Test Title' });
        
        expect(() => {
            renderer.dispose();
            renderer.dispose();
            renderer.dispose();
        }).not.toThrow();
    });
});