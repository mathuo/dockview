import {
    Component,
    ElementRef,
    EventEmitter,
    Injector,
    Input,
    OnDestroy,
    OnInit,
    Output,
    Type,
    ViewChild,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChanges,
    EnvironmentInjector,
    inject,
} from '@angular/core';
import {
    GridviewApi,
    GridviewOptions,
    createGridview,
    PROPERTY_KEYS_GRIDVIEW,
    GridviewFrameworkOptions,
    GridviewComponentOptions,
} from 'dockview-core';
import { AngularFrameworkComponentFactory } from '../utils/component-factory';
import { AngularLifecycleManager } from '../utils/lifecycle-utils';
import { GridviewAngularReadyEvent } from './types';
import { ComponentRegistryService } from '../utils/component-registry.service';

export interface GridviewAngularOptions extends GridviewOptions {
    components: Record<string, Type<any>>;
}

@Component({
    selector: 'dv-gridview',
    standalone: true,
    template: '<div #gridviewContainer class="gridview-container"></div>',
    styles: [
        `
            :host {
                display: block;
                width: 100%;
                height: 100%;
            }

            .gridview-container {
                width: 100%;
                height: 100%;
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridviewAngularComponent implements OnInit, OnDestroy, OnChanges {
    private readonly componentRegistry: ComponentRegistryService = inject(ComponentRegistryService);

    @ViewChild('gridviewContainer', { static: true }) 
    private containerRef!: ElementRef<HTMLDivElement>;

    @Input() components!: Record<string, Type<any>>;

    // Core gridview options as inputs
    @Input() className?: string;
    @Input() orientation?: 'horizontal' | 'vertical';
    @Input() proportionalLayout?: boolean;
    @Input() hideBorders?: boolean;
    @Input() debug?: boolean;
    @Input() disableAutoResizing?: boolean;

    @Output() ready = new EventEmitter<GridviewAngularReadyEvent>();

    private gridviewApi?: GridviewApi;
    private lifecycleManager = new AngularLifecycleManager();
    private injector = inject(Injector);
    private environmentInjector = inject(EnvironmentInjector);

    ngOnInit(): void {
        this.initializeGridview();
    }

    ngOnDestroy(): void {
        this.lifecycleManager.destroy();
        if (this.gridviewApi) {
            this.gridviewApi.dispose();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.gridviewApi) {
            const coreChanges: Partial<GridviewOptions> = {};
            let hasChanges = false;

            // Check for changes in core gridview properties
            PROPERTY_KEYS_GRIDVIEW.forEach((key) => {
                if (changes[key] && !changes[key].isFirstChange()) {
                    (coreChanges as any)[key] = changes[key].currentValue;
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                this.gridviewApi.updateOptions(coreChanges);
            }
        }
    }

    getGridviewApi(): GridviewApi | undefined {
        return this.gridviewApi;
    }

    private initializeGridview(): void {
        if (this.components) {
            this.componentRegistry.registerComponents(this.components);
        }

        const coreOptions = this.extractCoreOptions();
        const frameworkOptions = this.createFrameworkOptions();

        this.gridviewApi = createGridview(this.containerRef.nativeElement, {
            ...coreOptions,
            ...frameworkOptions,
        });

        // Emit ready event
        this.ready.emit({ api: this.gridviewApi });
    }

    private extractCoreOptions(): GridviewOptions {
        const coreOptions: Partial<GridviewComponentOptions> = {};

        PROPERTY_KEYS_GRIDVIEW.forEach((key) => {
            const value = (this as any)[key];
            if (value !== undefined) {
                (coreOptions as any)[key] = value;
            }
        });

        return coreOptions as GridviewOptions;
    }

    private createFrameworkOptions(): GridviewFrameworkOptions {
        const componentFactory = new AngularFrameworkComponentFactory(
            this.componentRegistry,
            this.injector,
            this.environmentInjector
        );

        return {
            createComponent: (options) => {
                return componentFactory.createGridviewComponent(options);
            },
        };
    }
}
