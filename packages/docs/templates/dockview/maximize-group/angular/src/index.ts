import 'zone.js';
import '@angular/compiler';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import {
    Component,
    NgModule,
    Input,
    Type,
    OnInit,
    OnDestroy,
    ChangeDetectorRef,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
    DockviewAngularModule,
    DockviewApi,
    DockviewGroupPanel,
    DockviewGroupPanelApi,
    DockviewPanelApi,
    DockviewReadyEvent,
    SerializedDockview,
} from 'dockview-angular';
import 'dockview-core/dist/styles/dockview.css';

const STORAGE_KEY = 'maximize.layout';

@Component({
    selector: 'default-panel',
    template: `
        <div
            style="height: 100%; padding: 20px; background: var(--dv-group-view-background-color);">
            {{ params?.title }}
        </div>
    `,
})
export class DefaultPanelComponent {
    @Input() api!: DockviewPanelApi;
    @Input() params!: { title: string };
}

@Component({
    selector: 'watermark-panel',
    template: `<div style="color: white; padding: 8px;">watermark</div>`,
})
export class WatermarkComponent {}

@Component({
    selector: 'left-header-actions',
    template: `
        <div style="height: 100%; color: white; padding: 0px 4px;">
            <div
                (click)="addPanel()"
                title="Add Panel"
                style="display: flex; align-items: center; justify-content: center; width: 30px; height: 100%; cursor: pointer; font-size: 18px;">
                <span class="material-symbols-outlined">add</span>
            </div>
        </div>
    `,
})
export class LeftHeaderActionsComponent {
    @Input() containerApi!: DockviewApi;
    @Input() group!: DockviewGroupPanel;

    addPanel() {
        const id = Date.now().toString();
        this.containerApi.addPanel({
            id,
            title: `Tab ${id}`,
            component: 'default',
            position: { referenceGroup: this.group },
        });
    }
}

@Component({
    selector: 'right-header-actions',
    template: `
        <div style="height: 100%; color: white; padding: 0px 4px;">
            <div
                (click)="toggle()"
                [title]="maximized ? 'Exit maximize' : 'Maximize'"
                style="display: flex; align-items: center; justify-content: center; width: 30px; height: 100%; cursor: pointer; font-size: 18px;">
                <span class="material-symbols-outlined">
                    {{ maximized ? 'jump_to_element' : 'back_to_tab' }}
                </span>
            </div>
        </div>
    `,
})
export class RightHeaderActionsComponent implements OnInit, OnDestroy {
    @Input() api!: DockviewGroupPanelApi;
    @Input() containerApi!: DockviewApi;

    maximized = false;
    private disposable?: { dispose(): void };

    constructor(private cd: ChangeDetectorRef) {}

    ngOnInit() {
        this.maximized = this.api.isMaximized();
        this.disposable = this.containerApi.onDidMaximizedGroupChange(() => {
            this.maximized = this.api.isMaximized();
            this.cd.markForCheck();
        });
    }

    ngOnDestroy() {
        this.disposable?.dispose();
    }

    toggle() {
        if (this.maximized) {
            this.api.exitMaximized();
        } else {
            this.api.maximize();
        }
    }
}

@Component({
    selector: 'app-root',
    template: `
        <div style="height: 100%; display: flex; flex-direction: column;">
            <div style="height: 25px;">
                <button (click)="save()">Save</button>
                <button (click)="load()">Load</button>
                <button (click)="clear()">Clear</button>
            </div>
            <div style="flex-grow: 1;">
                <dv-dockview
                    [components]="components"
                    [watermarkComponent]="watermarkComponent"
                    [leftHeaderActionsComponent]="leftHeaderActionsComponent"
                    [rightHeaderActionsComponent]="rightHeaderActionsComponent"
                    className="dockview-theme-abyss"
                    (ready)="onReady($event)">
                </dv-dockview>
            </div>
        </div>
    `,
})
export class AppComponent {
    components: Record<string, Type<any>> = {
        default: DefaultPanelComponent,
    };
    watermarkComponent = WatermarkComponent;
    leftHeaderActionsComponent = LeftHeaderActionsComponent;
    rightHeaderActionsComponent = RightHeaderActionsComponent;

    private api?: DockviewApi;
    private layout: SerializedDockview | null = null;

    constructor() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                this.layout = JSON.parse(stored);
            } catch {
                this.layout = null;
            }
        }
    }

    onReady(event: DockviewReadyEvent) {
        this.api = event.api;
        this.loadLayout();
    }

    save() {
        if (!this.api) {
            return;
        }
        this.layout = this.api.toJSON();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.layout));
    }

    load() {
        if (this.api) {
            this.loadLayout();
        }
    }

    clear() {
        this.api?.clear();
        this.layout = null;
        localStorage.removeItem(STORAGE_KEY);
    }

    private loadLayout() {
        if (!this.api) {
            return;
        }
        this.api.clear();
        if (this.layout) {
            try {
                this.api.fromJSON(this.layout);
                return;
            } catch (err) {
                console.error(err);
                this.api.clear();
            }
        }
        this.loadDefaultLayout();
    }

    private loadDefaultLayout() {
        if (!this.api) {
            return;
        }
        this.api.addPanel({ id: 'panel_1', component: 'default', params: { title: 'Panel 1' } });
        this.api.addPanel({ id: 'panel_2', component: 'default', params: { title: 'Panel 2' } });
        this.api.addPanel({ id: 'panel_3', component: 'default', params: { title: 'Panel 3' } });
        this.api.addPanel({ id: 'panel_4', component: 'default', params: { title: 'Panel 4' } });
        this.api.addPanel({
            id: 'panel_5',
            component: 'default',
            params: { title: 'Panel 5' },
            position: { direction: 'right' },
        });
        this.api.addPanel({ id: 'panel_6', component: 'default', params: { title: 'Panel 6' } });
    }
}

@NgModule({
    declarations: [
        AppComponent,
        DefaultPanelComponent,
        WatermarkComponent,
        LeftHeaderActionsComponent,
        RightHeaderActionsComponent,
    ],
    imports: [BrowserModule, DockviewAngularModule],
    bootstrap: [AppComponent],
})
export class AppModule {}

platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));
