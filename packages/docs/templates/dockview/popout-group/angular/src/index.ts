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
import 'dockview-angular/dist/styles/dockview.css';

const STORAGE_KEY = 'popout.layout';
let panelCount = 0;

@Component({
    selector: 'default-panel',
    template: `
        <div
            style="height: 100%; padding: 20px; background: var(--dv-group-view-background-color);">
            <button (click)="logWindow()">Print</button>
            <span style="margin-left: 8px;">{{ api?.title }}</span>
        </div>
    `,
})
export class DefaultPanelComponent {
    @Input() api!: DockviewPanelApi;

    logWindow() {
        console.log(this.api.getWindow());
    }
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
        const id = (++panelCount).toString();
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
                [title]="popout ? 'Dock' : 'Popout'"
                style="display: flex; align-items: center; justify-content: center; width: 30px; height: 100%; cursor: pointer; font-size: 18px;">
                <span class="material-symbols-outlined">
                    {{ popout ? 'jump_to_element' : 'back_to_tab' }}
                </span>
            </div>
        </div>
    `,
})
export class RightHeaderActionsComponent implements OnInit, OnDestroy {
    @Input() api!: DockviewGroupPanelApi;
    @Input() containerApi!: DockviewApi;
    @Input() group!: DockviewGroupPanel;

    popout = false;
    private disposable?: { dispose(): void };

    constructor(private cd: ChangeDetectorRef) {}

    ngOnInit() {
        this.popout = this.api.location.type === 'popout';
        this.disposable = this.group.api.onDidLocationChange((event) => {
            this.popout = event.location.type === 'popout';
            this.cd.markForCheck();
        });
    }

    ngOnDestroy() {
        this.disposable?.dispose();
    }

    toggle() {
        if (this.popout) {
            const group = this.containerApi.addGroup();
            this.group.api.moveTo({ group });
        } else {
            this.containerApi.addPopoutGroup(this.group, {
                popoutUrl: '/popout/index.html',
            });
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
        this.api.addPanel({ id: 'panel_1', component: 'default' });
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
