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
    TemplateRef,
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
    CspNonceProvider,
    GetTabContextMenuItemsParams,
    GetTabGroupChipContextMenuItemsParams,
    BuiltInChipContextMenuItem,
    ContextMenuItemConfig,
    ContextMenuItem,
    DockviewTabGroupColorEntry,
    DockviewHeaderPosition,
    DockviewDndStrategy,
    DockviewPanelRenderer,
    DockviewTheme,
    DroptargetOverlayModel,
} from 'dockview-core';
import { AngularFrameworkComponentFactory } from '../utils/component-factory';
import { AngularRenderer } from '../utils/angular-renderer';
import { AngularLifecycleManager } from '../utils/lifecycle-utils';
import { AngularTabGroupChipRenderer } from './angular-tab-group-chip-renderer';
import { AngularGroupDragGhostRenderer } from './angular-group-drag-ghost-renderer';

export interface DockviewAngularOptions extends DockviewOptions {
    components: Record<string, Type<any>>;
    tabComponents?: Record<string, Type<any>>;
    watermarkComponent?: Type<any>;
    defaultTabComponent?: Type<any>;
    leftHeaderActionsComponent?: Type<any>;
    rightHeaderActionsComponent?: Type<any>;
    prefixHeaderActionsComponent?: Type<any>;
    getTabContextMenuItems?: (
        params: GetTabContextMenuItemsParams
    ) => (ContextMenuItem | { component: Type<any> })[];
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
    @ViewChild('dockviewContainer', { static: true })
    private containerRef!: ElementRef<HTMLDivElement>;

    @Input() components!: Record<string, Type<any> | TemplateRef<any>>;
    @Input() tabComponents?: Record<string, Type<any> | TemplateRef<any>>;
    @Input() watermarkComponent?: Type<any> | TemplateRef<any>;
    @Input() defaultTabComponent?: Type<any> | TemplateRef<any>;
    @Input() leftHeaderActionsComponent?: Type<any> | TemplateRef<any>;
    @Input() rightHeaderActionsComponent?: Type<any> | TemplateRef<any>;
    @Input() prefixHeaderActionsComponent?: Type<any> | TemplateRef<any>;
    @Input() tabGroupChipComponent?: Type<any>;
    @Input() groupDragGhostComponent?: Type<any>;

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
    @Input() nonce?: CspNonceProvider;
    @Input() debug?: boolean;
    @Input() locked?: boolean;
    @Input() disableAutoResizing?: boolean;
    @Input() singleTabMode?: 'fullwidth' | 'default';
    @Input() theme?: DockviewTheme;
    @Input() scrollbars?: 'native' | 'custom';
    @Input() disableTabsOverflowList?: boolean;
    @Input() defaultRenderer?: DockviewPanelRenderer;
    @Input() defaultHeaderPosition?: DockviewHeaderPosition;
    @Input() disableDnd?: boolean;
    @Input() dndStrategy?: DockviewDndStrategy;
    @Input() dndEdges?: false | DroptargetOverlayModel;
    @Input() noPanelsOverlay?: 'emptyGroup' | 'watermark';
    @Input() getTabContextMenuItems?: (
        params: GetTabContextMenuItemsParams
    ) => (ContextMenuItem | { component: Type<any> | TemplateRef<any> })[];
    @Input() getTabGroupChipContextMenuItems?: (
        params: GetTabGroupChipContextMenuItemsParams
    ) => (
        | BuiltInChipContextMenuItem
        | ContextMenuItemConfig
        | { component: Type<any> | TemplateRef<any> }
    )[];
    @Input() tabGroupColors?: DockviewTabGroupColorEntry[];
    @Input() tabGroupAccent?: 'palette' | 'off';

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

            // Handle tabGroupChipComponent → createTabGroupChipComponent mapping
            if (
                changes['tabGroupChipComponent'] &&
                !changes['tabGroupChipComponent'].isFirstChange()
            ) {
                const chipComponent =
                    changes['tabGroupChipComponent'].currentValue;
                coreChanges.createTabGroupChipComponent = chipComponent
                    ? () =>
                          new AngularTabGroupChipRenderer(
                              chipComponent,
                              this.injector,
                              this.environmentInjector
                          )
                    : undefined;
                hasChanges = true;
            }

            // Handle groupDragGhostComponent → createGroupDragGhostComponent mapping
            if (
                changes['groupDragGhostComponent'] &&
                !changes['groupDragGhostComponent'].isFirstChange()
            ) {
                const ghostComponent =
                    changes['groupDragGhostComponent'].currentValue;
                coreChanges.createGroupDragGhostComponent = ghostComponent
                    ? () =>
                          new AngularGroupDragGhostRenderer(
                              ghostComponent,
                              this.injector,
                              this.environmentInjector
                          )
                    : undefined;
                hasChanges = true;
            }

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

        if (this.tabGroupChipComponent) {
            const chipComponent = this.tabGroupChipComponent;
            coreOptions.createTabGroupChipComponent = () => {
                return new AngularTabGroupChipRenderer(
                    chipComponent,
                    this.injector,
                    this.environmentInjector
                );
            };
        }

        if (this.groupDragGhostComponent) {
            const ghostComponent = this.groupDragGhostComponent;
            coreOptions.createGroupDragGhostComponent = () => {
                return new AngularGroupDragGhostRenderer(
                    ghostComponent,
                    this.injector,
                    this.environmentInjector
                );
            };
        }

        return coreOptions as DockviewOptions;
    }

    private createFrameworkOptions(): DockviewFrameworkOptions {
        const headerActionsComponents: Record<
            string,
            Type<any> | TemplateRef<any>
        > = {};
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
                ? (group) => {
                      return componentFactory.createHeaderActionsComponent(
                          'left',
                          group
                      )!;
                  }
                : undefined,
            createRightHeaderActionComponent: this.rightHeaderActionsComponent
                ? (group) => {
                      return componentFactory.createHeaderActionsComponent(
                          'right',
                          group
                      )!;
                  }
                : undefined,
            createPrefixHeaderActionComponent: this.prefixHeaderActionsComponent
                ? (group) => {
                      return componentFactory.createHeaderActionsComponent(
                          'prefix',
                          group
                      )!;
                  }
                : undefined,
            createContextMenuItemComponent: (options) => {
                if (!options.component) {
                    return undefined;
                }
                const renderer = new AngularRenderer({
                    component: options.component as
                        | Type<any>
                        | TemplateRef<any>,
                    injector: this.injector,
                    environmentInjector: this.environmentInjector,
                });
                return renderer;
            },
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
