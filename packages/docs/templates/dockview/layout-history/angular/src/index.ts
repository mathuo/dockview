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
    DockviewPanelApi,
    DockviewReadyEvent,
} from 'dockview-angular';
import 'dockview-angular/dist/styles/dockview.css';

@Component({
    selector: 'default-panel',
    template: `
        <div
            style="height: 100%; padding: 20px; background: var(--dv-group-view-background-color);"
        >
            {{ api?.title }}
        </div>
    `,
})
export class DefaultPanelComponent {
    @Input() api!: DockviewPanelApi;
    @Input() params!: { title: string };
}

@Component({
    selector: 'app-root',
    template: `
        <div style="height: 100%; display: flex; flex-direction: column;">
            <div style="height: 25px; display: flex; gap: 4px;">
                <button [disabled]="!canUndo" (click)="undo()">Undo</button>
                <button [disabled]="!canRedo" (click)="redo()">Redo</button>
                <button (click)="addPanel()">Add Panel</button>
            </div>
            <div style="flex-grow: 1;">
                <dv-dockview
                    [components]="components"
                    [layoutHistory]="{
                        enabled: true,
                        undoableProgrammaticMutations: true,
                    }"
                    className="dockview-theme-abyss"
                    (ready)="onReady($event)"
                >
                </dv-dockview>
            </div>
        </div>
    `,
})
export class AppComponent implements OnInit, OnDestroy {
    components: Record<string, Type<any>> = {
        default: DefaultPanelComponent,
    };

    canUndo = false;
    canRedo = false;

    private api?: DockviewApi;
    private disposable?: { dispose(): void };
    private panelCount = 5;

    constructor(private cd: ChangeDetectorRef) {}

    ngOnInit() {}

    ngOnDestroy() {
        this.disposable?.dispose();
    }

    onReady(event: DockviewReadyEvent) {
        this.api = event.api;

        event.api.addPanel({
            id: 'panel_1',
            component: 'default',
            title: 'Panel 1',
        });
        event.api.addPanel({
            id: 'panel_2',
            component: 'default',
            title: 'Panel 2',
        });
        event.api.addPanel({
            id: 'panel_3',
            component: 'default',
            title: 'Panel 3',
        });
        event.api.addPanel({
            id: 'panel_4',
            component: 'default',
            title: 'Panel 4',
            position: { direction: 'right' },
        });
        event.api.addPanel({
            id: 'panel_5',
            component: 'default',
            title: 'Panel 5',
        });

        // The seed layout shouldn't be undoable — start with a clean history.
        event.api.clearHistory();

        this.canUndo = event.api.canUndo;
        this.canRedo = event.api.canRedo;
        this.disposable = event.api.onDidChangeHistory((e) => {
            this.canUndo = e.canUndo;
            this.canRedo = e.canRedo;
            this.cd.markForCheck();
        });
    }

    undo() {
        this.api?.undo();
    }

    redo() {
        this.api?.redo();
    }

    addPanel() {
        this.api?.addPanel({
            id: `panel_${++this.panelCount}`,
            component: 'default',
            title: `Panel ${this.panelCount}`,
        });
    }
}

@NgModule({
    declarations: [AppComponent, DefaultPanelComponent],
    imports: [BrowserModule, DockviewAngularModule],
    bootstrap: [AppComponent],
})
export class AppModule {}

platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));
