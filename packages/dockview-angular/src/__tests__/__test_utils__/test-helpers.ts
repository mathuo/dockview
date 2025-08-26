import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, Type, Injector, EnvironmentInjector } from '@angular/core';
import { DockviewAngularModule } from '../../lib/dockview-angular.module';

// Simple test component for testing
@Component({
    selector: 'test-panel',
    template: '<div class="test-panel">Test Panel Content</div>',
})
export class TestPanelComponent {
    data?: any;
}

@Component({
    selector: 'test-tab',
    template: '<div class="test-tab">Test Tab</div>',
})
export class TestTabComponent {
    title?: string;
}

@Component({
    selector: 'test-watermark',
    template: '<div class="test-watermark">Test Watermark</div>',
})
export class TestWatermarkComponent {}

export function setupTestBed() {
    TestBed.configureTestingModule({
        imports: [DockviewAngularModule],
        declarations: [
            TestPanelComponent,
            TestTabComponent,
            TestWatermarkComponent,
        ],
    });
}

export function createComponentFixture<T>(component: Type<T>): ComponentFixture<T> {
    return TestBed.createComponent(component);
}

export function getTestComponents() {
    return {
        'test-panel': TestPanelComponent,
        'test-tab': TestTabComponent,
        'test-watermark': TestWatermarkComponent,
    };
}

export function waitForAsync(fn: () => void): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            fn();
            resolve();
        }, 0);
    });
}