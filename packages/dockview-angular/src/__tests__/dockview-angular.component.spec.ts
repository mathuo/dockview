import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { DockviewAngularComponent } from '../lib/dockview/dockview-angular.component';
import { DockviewApi } from 'dockview-core';
import { setupTestBed, getTestComponents } from './__test_utils__/test-helpers';

describe('DockviewAngularComponent', () => {
    let component: DockviewAngularComponent;
    let fixture: ComponentFixture<DockviewAngularComponent>;
    let debugElement: DebugElement;

    beforeEach(async () => {
        setupTestBed();
        await TestBed.compileComponents();

        fixture = TestBed.createComponent(DockviewAngularComponent);
        component = fixture.componentInstance;
        debugElement = fixture.debugElement;

        component.components = getTestComponents();
    });

    afterEach(() => {
        if (component && component.getDockviewApi()) {
            component.getDockviewApi()?.dispose();
        }
        fixture?.destroy();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize dockview api on ngOnInit', () => {
        component.ngOnInit();

        expect(component.getDockviewApi()).toBeDefined();
        expect(component.getDockviewApi()).toBeInstanceOf(Object);
    });

    it('should emit ready event with api', (done) => {
        component.ready.subscribe((event) => {
            expect(event.api).toBeDefined();
            expect(event.api).toBeInstanceOf(Object);
            done();
        });

        component.ngOnInit();
    });

    it('should render container element', () => {
        fixture.detectChanges();

        const containerElement = debugElement.query(
            By.css('.dockview-container')
        );
        expect(containerElement).toBeTruthy();
        expect(containerElement.nativeElement.tagName).toBe('DIV');
    });

    it('should dispose api on ngOnDestroy', () => {
        component.ngOnInit();
        const api = component.getDockviewApi();
        const disposeSpy = jest.spyOn(api!, 'dispose');

        component.ngOnDestroy();

        expect(disposeSpy).toHaveBeenCalled();
    });

    it('should handle input changes', () => {
        component.ngOnInit();
        const api = component.getDockviewApi();
        const updateOptionsSpy = jest.spyOn(api!, 'updateOptions');

        component.className = 'test-class';
        component.ngOnChanges({
            className: {
                currentValue: 'test-class',
                previousValue: undefined,
                firstChange: false,
                isFirstChange: () => false,
            },
        });

        expect(updateOptionsSpy).toHaveBeenCalledWith({
            className: 'test-class',
        });
    });

    it('should set up component registry correctly', () => {
        expect(component.components).toEqual(getTestComponents());

        component.ngOnInit();

        expect(component.getDockviewApi()).toBeDefined();
    });
});

@Component({
    template: `
        <dv-dockview
            [components]="components"
            [className]="className"
            [debug]="debug"
            (ready)="onReady($event)"
        >
        </dv-dockview>
    `,
})
class TestHostComponent {
    components = getTestComponents();
    className = 'test-host';
    debug = false;
    api?: DockviewApi;

    onReady(event: { api: DockviewApi }) {
        this.api = event.api;
    }
}

describe('DockviewAngularComponent Integration', () => {
    let hostComponent: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        setupTestBed();

        TestBed.configureTestingModule({
            declarations: [TestHostComponent],
        });

        await TestBed.compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        hostComponent = fixture.componentInstance;
    });

    afterEach(() => {
        hostComponent.api?.dispose();
        fixture?.destroy();
    });

    it('should create and initialize through template', () => {
        fixture.detectChanges();

        expect(hostComponent).toBeTruthy();
        expect(hostComponent.api).toBeDefined();
    });

    it('should pass properties correctly', () => {
        hostComponent.className = 'custom-class';
        hostComponent.debug = true;

        fixture.detectChanges();

        expect(hostComponent.api).toBeDefined();
    });
});
