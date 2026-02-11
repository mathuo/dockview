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
    DockviewApi,
    DockviewOptions,
    DockviewReadyEvent,
    DockviewDidDropEvent,
    DockviewWillDropEvent,
    createDockview,
    PROPERTY_KEYS_DOCKVIEW,
    DockviewFrameworkOptions,
    DockviewComponentOptions,
} from 'dockview-core';
import { AngularFrameworkComponentFactory } from '../utils/component-factory';
import { AngularLifecycleManager } from '../utils/lifecycle-utils';
import { ComponentRegistryService } from '../utils/component-registry.service';

export interface DockviewAngularOptions extends DockviewOptions {
    components: Record<string, Type<any>>;
    tabComponents?: Record<string, Type<any>>;
    watermarkComponent?: Type<any>;
    defaultTabComponent?: Type<any>;
    leftHeaderActionsComponent?: Type<any>;
    rightHeaderActionsComponent?: Type<any>;
    prefixHeaderActionsComponent?: Type<any>;
}

@Component({
    selector: 'dv-dockview',
    standalone: true,
    template: '<div #dockviewContainer class="dockview-container"></div>',
    styles: [
        `
            :host {
                display: block;
                width: 100%;
                height: 100%;
            }

            .dockview-container {
                width: 100%;
                height: 100%;
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DockviewAngularComponent implements OnInit, OnDestroy, OnChanges {
    private readonly componentRegistry: ComponentRegistryService = inject(ComponentRegistryService);

    @ViewChild('dockviewContainer', { static: true }) 
    private containerRef!: ElementRef<HTMLDivElement>;

    @Input() components!: Record<string, Type<any>>;
    @Input() tabComponents?: Record<string, Type<any>>;
    @Input() watermarkComponent?: Type<any>;
    @Input() defaultTabComponent?: Type<any>;
    @Input() leftHeaderActionsComponent?: Type<any>;
    @Input() rightHeaderActionsComponent?: Type<any>;
    @Input() prefixHeaderActionsComponent?: Type<any>;

    // Core dockview options as inputs
    @Input() className?: string;
    @Input() orientation?: 'horizontal' | 'vertical';
    @Input() hideBorders?: boolean;
    @Input() rootOverlayModel?: 'always' | 'never';
    @Input() defaultTabComponent_?: string;
    @Input() tabHeight?: number;
    @Input() disableFloatingGroups?: boolean;
    @Input() floatingGroupBounds?: 'boundedWithinViewport';
    @Input() popoutUrl?: string;
    @Input() debug?: boolean;
    @Input() locked?: boolean;
    @Input() disableAutoResizing?: boolean;
    @Input() singleTabMode?: 'fullwidth' | 'default';

    @Output() ready = new EventEmitter<DockviewReadyEvent>();
    @Output() didDrop = new EventEmitter<DockviewDidDropEvent>();
    @Output() willDrop = new EventEmitter<DockviewWillDropEvent>();

    private dockviewApi?: DockviewApi;
    private lifecycleManager = new AngularLifecycleManager();
    private injector = inject(Injector);
    private environmentInjector = inject(EnvironmentInjector);

    ngOnInit(): void {
        this.initializeDockview();
    }

    ngOnDestroy(): void {
        this.lifecycleManager.destroy();
        if (this.dockviewApi) {
            this.dockviewApi.dispose();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.dockviewApi) {
            const coreChanges: Partial<DockviewOptions> = {};
            let hasChanges = false;

            // Check for changes in core dockview properties
            PROPERTY_KEYS_DOCKVIEW.forEach((key) => {
                if (changes[key] && !changes[key].isFirstChange()) {
                    (coreChanges as any)[key] = changes[key].currentValue;
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                this.dockviewApi.updateOptions(coreChanges);
            }
        }
    }

    getDockviewApi(): DockviewApi | undefined {
        return this.dockviewApi;
    }

    private initializeDockview(): void {
        if (!this.components) {
            throw new Error(
                'DockviewAngularComponent: components input is required'
            );
        }

        const coreOptions = this.extractCoreOptions();
        const frameworkOptions = this.createFrameworkOptions();

        this.dockviewApi = createDockview(this.containerRef.nativeElement, {
            ...coreOptions,
            ...frameworkOptions,
        });

        // Set up event listeners
        this.setupEventListeners();

        // Emit ready event
        this.ready.emit({ api: this.dockviewApi });
    }

    private extractCoreOptions(): DockviewOptions {
        const coreOptions: Partial<DockviewComponentOptions> = {};

        PROPERTY_KEYS_DOCKVIEW.forEach((key) => {
            const value = (this as any)[key];
            if (value !== undefined) {
                (coreOptions as any)[key] = value;
            }
        });

        return coreOptions as DockviewOptions;
    }

    private createFrameworkOptions(): DockviewFrameworkOptions {
        const headerActionsComponents: Record<string, Type<any>> = {};
        if (this.leftHeaderActionsComponent) {
            headerActionsComponents['left'] = this.leftHeaderActionsComponent;
        }
        if (this.rightHeaderActionsComponent) {
            headerActionsComponents['right'] = this.rightHeaderActionsComponent;
        }
        if (this.prefixHeaderActionsComponent) {
            headerActionsComponents['prefix'] =
                this.prefixHeaderActionsComponent;
        }

        const componentFactory = new AngularFrameworkComponentFactory(
            this.componentRegistry,
            this.injector,
            this.environmentInjector,
            this.tabComponents,
            this.watermarkComponent,
            headerActionsComponents,
            this.defaultTabComponent
        );

        return {
            createComponent: (options) => {
                return componentFactory.createDockviewComponent(options);
            },
            createTabComponent: (options) => {
                return componentFactory.createTabComponent(options);
            },
            createWatermarkComponent: this.watermarkComponent
                ? () => {
                      return componentFactory.createWatermarkComponent();
                  }
                : undefined,
            createLeftHeaderActionComponent: this.leftHeaderActionsComponent
                ? (group) => {
                      return componentFactory.createHeaderActionsComponent(
                          'left'
                      )!;
                  }
                : undefined,
            createRightHeaderActionComponent: this.rightHeaderActionsComponent
                ? (group) => {
                      return componentFactory.createHeaderActionsComponent(
                          'right'
                      )!;
                  }
                : undefined,
            createPrefixHeaderActionComponent: this.prefixHeaderActionsComponent
                ? (group) => {
                      return componentFactory.createHeaderActionsComponent(
                          'prefix'
                      )!;
                  }
                : undefined,
        };
    }

    private setupEventListeners(): void {
        if (!this.dockviewApi) {
            return;
        }

        // Set up event subscriptions using lifecycle manager
        const api = this.dockviewApi;

        if (this.didDrop.observers.length > 0) {
            const disposable = api.onDidDrop((event) => {
                this.didDrop.emit(event);
            });
            this.lifecycleManager.addDisposable(disposable);
        }

        if (this.willDrop.observers.length > 0) {
            const disposable = api.onWillDrop((event) => {
                this.willDrop.emit(event);
            });
            this.lifecycleManager.addDisposable(disposable);
        }
    }
}
