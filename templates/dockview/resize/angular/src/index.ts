import 'zone.js';
import '@angular/compiler';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Component, NgModule, Input, Type } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
    DockviewAngularModule,
    DockviewApi,
    DockviewPanelApi,
    DockviewReadyEvent,
} from 'dockview-angular';
import 'dockview-core/dist/styles/dockview.css';

@Component({
    selector: 'default-panel',
    template: `
        <div style="height: 100%; padding: 8px; color: white;">
            <div style="height: 25px;">{{ api?.title }}</div>
            <div style="display: flex; gap: 4px; align-items: center; margin-bottom: 4px;">
                <span>Width:</span>
                <input
                    type="number"
                    min="50"
                    step="1"
                    [value]="width"
                    (input)="width = +$any($event.target).value" />
                <button style="width: 100px;" (click)="resizeGroupWidth()">
                    Resize Group
                </button>
                <button style="width: 100px;" (click)="resizePanelWidth()">
                    Resize panel
                </button>
            </div>
            <div style="display: flex; gap: 4px; align-items: center;">
                <span>Height:</span>
                <input
                    type="number"
                    min="50"
                    step="1"
                    [value]="height"
                    (input)="height = +$any($event.target).value" />
                <button style="width: 100px;" (click)="resizeGroupHeight()">
                    Resize Group
                </button>
                <button style="width: 100px;" (click)="resizePanelHeight()">
                    Resize Panel
                </button>
            </div>
        </div>
    `,
})
export class DefaultPanelComponent {
    @Input() api!: DockviewPanelApi;

    width = 100;
    height = 100;

    resizeGroupWidth() {
        this.api.group.api.setSize({ width: this.width });
    }
    resizePanelWidth() {
        this.api.setSize({ width: this.width });
    }
    resizeGroupHeight() {
        this.api.group.api.setSize({ height: this.height });
    }
    resizePanelHeight() {
        this.api.setSize({ height: this.height });
    }
}

@Component({
    selector: 'app-root',
    template: `
        <div style="height: 100%;">
            <dv-dockview
                [components]="components"
                className="dockview-theme-abyss"
                (ready)="onReady($event)">
            </dv-dockview>
        </div>
    `,
})
export class AppComponent {
    components: Record<string, Type<any>> = {
        default: DefaultPanelComponent,
    };

    onReady(event: DockviewReadyEvent) {
        const api: DockviewApi = event.api;
        api.addPanel({ id: 'panel_1', component: 'default' });
        api.addPanel({
            id: 'panel_2',
            component: 'default',
            position: { direction: 'right', referencePanel: 'panel_1' },
        });
        api.addPanel({
            id: 'panel_3',
            component: 'default',
            position: { direction: 'below', referencePanel: 'panel_1' },
        });
        api.addPanel({ id: 'panel_4', component: 'default' });
        api.addPanel({ id: 'panel_5', component: 'default' });
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
