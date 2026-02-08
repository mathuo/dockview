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
    inject
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
    DockviewComponentOptions
} from 'dockview-core';
import { AngularFrameworkComponentFactory } from '../utils/component-factory';
import { AngularLifecycleManager } from '../utils/lifecycle-utils';

export interface DockviewAngularOptions extends DockviewOptions {
    components: Record<string, Type<unknown>>;
    tabComponents?: Record<string, Type<unknown>>;
    watermarkComponent?: Type<unknown>;
    defaultTabComponent?: Type<unknown>;
    leftHeaderActionsComponent?: Type<unknown>;
    rightHeaderActionsComponent?: Type<unknown>;
    prefixHeaderActionsComponent?: Type<unknown>;
}

@Component({
    selector: 'dv-dockview',
    standalone: true,
    template: '<div #dockviewContainer class="dockview-container"></div>',
    styles: [`
        :host {
            display: block;
            width: 100%;
            height: 100%;
        }

        .dockview-container {
            width: 100%;
            height: 100%;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DockviewAngularComponent implements OnInit, OnDestroy, OnChanges {
    @ViewChild('dockviewContainer', { static: true }) 
    private containerRef!: ElementRef<HTMLDivElement>;

    @Input() components!: Record<string, Type<unknown>>;
    @Input() tabComponents?: Record<string, Type<unknown>>;
    @Input() watermarkComponent?: Type<unknown>;
    @Input() defaultTabComponent?: Type<unknown>;
    @Input() leftHeaderActionsComponent?: Type<unknown>;
    @Input() rightHeaderActionsComponent?: Type<unknown>;
    @Input() prefixHeaderActionsComponent?: Type<unknown>;

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
            PROPERTY_KEYS_DOCKVIEW.forEach(key => {
                if (changes[key] && !changes[key].isFirstChange()) {
                    (coreChanges as Record<string, unknown>)[key] = changes[key].currentValue;
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
            throw new Error('DockviewAngularComponent: components input is required');
        }

        const coreOptions = this.extractCoreOptions();
        const frameworkOptions = this.createFrameworkOptions();

        this.dockviewApi = createDockview(
            this.containerRef.nativeElement,
            {
                ...coreOptions,
                ...frameworkOptions
            }
        );

        // Set up event listeners
        this.setupEventListeners();

        // Emit ready event
        this.ready.emit({ api: this.dockviewApi });
    }

    private extractCoreOptions(): DockviewOptions {
        const coreOptions: Partial<DockviewComponentOptions> = {};

        PROPERTY_KEYS_DOCKVIEW.forEach(key => {
            const value = (this as unknown as Record<string, unknown>)[key];
            if (value !== undefined) {
                (coreOptions as Record<string, unknown>)[key] = value;
            }
        });

        return coreOptions as DockviewOptions;
    }

    private createFrameworkOptions(): DockviewFrameworkOptions {
        const headerActionsComponents: Record<string, Type<unknown>> = {};
        if (this.leftHeaderActionsComponent) {
            headerActionsComponents['left'] = this.leftHeaderActionsComponent;
        }
        if (this.rightHeaderActionsComponent) {
            headerActionsComponents['right'] = this.rightHeaderActionsComponent;
        }
        if (this.prefixHeaderActionsComponent) {
            headerActionsComponents['prefix'] = this.prefixHeaderActionsComponent;
        }

        const componentFactory = new AngularFrameworkComponentFactory(
            this.components,
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
                ? (_group) => {
                    return componentFactory.createHeaderActionsComponent('left')!;
                }
                : undefined,
            createRightHeaderActionComponent: this.rightHeaderActionsComponent
                ? (_group) => {
                    return componentFactory.createHeaderActionsComponent('right')!;
                }
                : undefined,
            createPrefixHeaderActionComponent: this.prefixHeaderActionsComponent
                ? (_group) => {
                    return componentFactory.createHeaderActionsComponent('prefix')!;
                }
                : undefined
        };
    }

    private setupEventListeners(): void {
        if (!this.dockviewApi) {
            return;
        }

        // Set up event subscriptions using lifecycle manager
        const api = this.dockviewApi;

        if (this.didDrop.observers.length > 0) {
            const disposable = api.onDidDrop(event => {
                this.didDrop.emit(event);
            });
            this.lifecycleManager.addDisposable(disposable);
        }

        if (this.willDrop.observers.length > 0) {
            const disposable = api.onWillDrop(event => {
                this.willDrop.emit(event);
            });
            this.lifecycleManager.addDisposable(disposable);
        }
    }
}