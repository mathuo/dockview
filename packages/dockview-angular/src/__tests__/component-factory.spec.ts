import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, Injector, EnvironmentInjector } from '@angular/core';
import { AngularFrameworkComponentFactory } from '../lib/utils/component-factory';
import { CreateComponentOptions } from 'dockview-core';
import { ComponentRegistryService } from '../lib/utils/component-registry.service';

@Component({
    selector: 'test-dockview-component',
    template: '<div class="test-dockview">{{ data?.title || "Default" }}</div>',
})
class TestDockviewComponent {
    data?: any;
}

@Component({
    selector: 'test-gridview-component',
    template: '<div class="test-gridview">Gridview Panel</div>',
})
class TestGridviewComponent {}

@Component({
    selector: 'test-splitview-component',
    template: '<div class="test-splitview">Splitview Panel</div>',
})
class TestSplitviewComponent {}

@Component({
    selector: 'test-paneview-component',
    template: '<div class="test-paneview">Paneview Part</div>',
})
class TestPaneviewComponent {}

@Component({
    selector: 'test-tab-component',
    template: '<div class="test-tab">{{ title || "Tab" }}</div>',
})
class TestTabComponent {
    title?: string;
}

@Component({
    selector: 'test-watermark-component',
    template: '<div class="test-watermark">Watermark</div>',
})
class TestWatermarkComponent {}

@Component({
    selector: 'test-header-actions-component',
    template: '<div class="test-header-actions">Actions</div>',
})
class TestHeaderActionsComponent {}

describe('AngularFrameworkComponentFactory', () => {
    let injector: Injector;
    let environmentInjector: EnvironmentInjector;
    let factory: AngularFrameworkComponentFactory;
    let resolver: ComponentRegistryService;

    const components = {
        'dockview-test': TestDockviewComponent,
        'gridview-test': TestGridviewComponent,
        'splitview-test': TestSplitviewComponent,
        'paneview-test': TestPaneviewComponent,
    };

    const tabComponents = {
        'tab-test': TestTabComponent,
    };

    const headerActionsComponents = {
        'header-test': TestHeaderActionsComponent,
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                TestDockviewComponent,
                TestGridviewComponent,
                TestSplitviewComponent,
                TestPaneviewComponent,
                TestTabComponent,
                TestWatermarkComponent,
                TestHeaderActionsComponent,
            ],
        }).compileComponents();

        injector = TestBed.inject(Injector);
        environmentInjector = TestBed.inject(EnvironmentInjector);
        resolver = TestBed.inject(ComponentRegistryService);
        resolver.registerComponents(components);

        factory = new AngularFrameworkComponentFactory(
            resolver,
            injector,
            environmentInjector,
            tabComponents,
            TestWatermarkComponent,
            headerActionsComponents,
            TestTabComponent
        );
    });

    afterEach(() => {
        TestBed.resetTestingModule();
    });

    describe('createDockviewComponent', () => {
        it('should create dockview component successfully', () => {
            const options: CreateComponentOptions = {
                id: 'test-id',
                name: 'dockview-test',
            };

            const renderer = factory.createDockviewComponent(options);

            expect(renderer).toBeDefined();
            expect(renderer.element).toBeTruthy();
            expect(renderer.element.tagName).toBe('TEST-DOCKVIEW-COMPONENT');
        });

        it('should throw error for unknown component', () => {
            const options: CreateComponentOptions = {
                id: 'test-id',
                name: 'unknown-component',
            };

            expect(() => {
                factory.createDockviewComponent(options);
            }).toThrow(
                "Component 'unknown-component' not found in component registry"
            );
        });
    });

    describe('createGridviewComponent', () => {
        it('should create gridview component successfully', () => {
            const options: CreateComponentOptions = {
                id: 'test-id',
                name: 'gridview-test',
            };

            const panel = factory.createGridviewComponent(options);

            expect(panel).toBeDefined();
            expect(panel.id).toBe('test-id');
        });

        it('should throw error for unknown component', () => {
            const options: CreateComponentOptions = {
                id: 'test-id',
                name: 'unknown-component',
            };

            expect(() => {
                factory.createGridviewComponent(options);
            }).toThrow(
                "Component 'unknown-component' not found in component registry"
            );
        });
    });

    describe('createSplitviewComponent', () => {
        it('should create splitview component successfully', () => {
            const options: CreateComponentOptions = {
                id: 'test-id',
                name: 'splitview-test',
            };

            const panel = factory.createSplitviewComponent(options);

            expect(panel).toBeDefined();
            expect(panel.id).toBe('test-id');
        });

        it('should throw error for unknown component', () => {
            const options: CreateComponentOptions = {
                id: 'test-id',
                name: 'unknown-component',
            };

            expect(() => {
                factory.createSplitviewComponent(options);
            }).toThrow(
                "Component 'unknown-component' not found in component registry"
            );
        });
    });

    describe('createPaneviewComponent', () => {
        it('should create paneview component successfully', () => {
            const options: CreateComponentOptions = {
                id: 'test-id',
                name: 'paneview-test',
            };

            const part = factory.createPaneviewComponent(options);

            expect(part).toBeDefined();
        });

        it('should throw error for unknown component', () => {
            const options: CreateComponentOptions = {
                id: 'test-id',
                name: 'unknown-component',
            };

            expect(() => {
                factory.createPaneviewComponent(options);
            }).toThrow(
                "Component 'unknown-component' not found in component registry"
            );
        });
    });

    describe('createTabComponent', () => {
        it('should create tab component successfully', () => {
            const options: CreateComponentOptions = {
                id: 'test-id',
                name: 'tab-test',
            };

            const renderer = factory.createTabComponent(options);

            expect(renderer).toBeDefined();
            expect(renderer!.element).toBeTruthy();
            expect(renderer!.element.tagName).toBe('TEST-TAB-COMPONENT');
        });

        it('should use default tab component when specific component not found', () => {
            const options: CreateComponentOptions = {
                id: 'test-id',
                name: 'unknown-tab',
            };

            const renderer = factory.createTabComponent(options);

            expect(renderer).toBeDefined();
            expect(renderer!.element).toBeTruthy();
            expect(renderer!.element.tagName).toBe('TEST-TAB-COMPONENT');
        });

        it('should return undefined when no component and no default', () => {
            const factoryWithoutDefault = new AngularFrameworkComponentFactory(
                resolver,
                injector,
                environmentInjector,
                {}
            );

            const options: CreateComponentOptions = {
                id: 'test-id',
                name: 'unknown-tab',
            };

            const renderer = factoryWithoutDefault.createTabComponent(options);

            expect(renderer).toBeUndefined();
        });
    });

    describe('createWatermarkComponent', () => {
        it('should create watermark component successfully', () => {
            const renderer = factory.createWatermarkComponent();

            expect(renderer).toBeDefined();
            expect(renderer.element).toBeTruthy();
            expect(renderer.element.tagName).toBe('TEST-WATERMARK-COMPONENT');
        });

        it('should throw error when no watermark component provided', () => {
            const factoryWithoutWatermark =
                new AngularFrameworkComponentFactory(
                    resolver,
                    injector,
                    environmentInjector
                );

            expect(() => {
                factoryWithoutWatermark.createWatermarkComponent();
            }).toThrow('Watermark component not provided');
        });
    });

    describe('createHeaderActionsComponent', () => {
        it('should create header actions component successfully', () => {
            const renderer =
                factory.createHeaderActionsComponent('header-test');

            expect(renderer).toBeDefined();
            expect(renderer!.element).toBeTruthy();
            expect(renderer!.element.tagName).toBe(
                'TEST-HEADER-ACTIONS-COMPONENT'
            );
        });

        it('should return undefined for unknown component', () => {
            const renderer =
                factory.createHeaderActionsComponent('unknown-header');

            expect(renderer).toBeUndefined();
        });

        it('should return undefined when no header actions components provided', () => {
            const factoryWithoutHeaderActions =
                new AngularFrameworkComponentFactory(
                    resolver,
                    injector,
                    environmentInjector
                );

            const renderer =
                factoryWithoutHeaderActions.createHeaderActionsComponent(
                    'test'
                );

            expect(renderer).toBeUndefined();
        });
    });

    describe('createComponent (legacy)', () => {
        it('should delegate to createDockviewComponent', () => {
            const options: CreateComponentOptions = {
                id: 'test-id',
                name: 'dockview-test',
            };

            const renderer = factory.createComponent(options);

            expect(renderer).toBeDefined();
            expect(renderer.element).toBeTruthy();
            expect(renderer.element.tagName).toBe('TEST-DOCKVIEW-COMPONENT');
        });
    });

    describe('component initialization with data', () => {
        it('should pass options to dockview component', () => {
            const options: CreateComponentOptions = {
                id: 'test-id',
                name: 'dockview-test',
            };

            const renderer = factory.createDockviewComponent(options);

            expect(renderer).toBeDefined();
            expect(renderer.element).toBeTruthy();
        });

        it('should pass options to tab component', () => {
            const options: CreateComponentOptions = {
                id: 'test-id',
                name: 'tab-test',
            };

            const renderer = factory.createTabComponent(options);

            expect(renderer).toBeDefined();
            expect(renderer!.element).toBeTruthy();
        });
    });

    describe('disposal', () => {
        it('should dispose components correctly', () => {
            const options: CreateComponentOptions = {
                id: 'test-id',
                name: 'dockview-test',
            };

            const renderer = factory.createDockviewComponent(options);

            expect(renderer).toBeDefined();
            expect(renderer).toHaveProperty('dispose');
            expect(() => {
                (renderer as any).dispose();
            }).not.toThrow();
        });

        it('should handle multiple disposals', () => {
            const options: CreateComponentOptions = {
                id: 'test-id',
                name: 'dockview-test',
            };

            const renderer = factory.createDockviewComponent(options);

            expect(renderer).toBeDefined();
            expect(() => {
                (renderer as any).dispose();
                (renderer as any).dispose();
            }).not.toThrow();
        });
    });
});
