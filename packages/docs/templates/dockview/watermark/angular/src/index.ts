import 'zone.js';
import '@angular/compiler';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Component, Type, NgModule, Input } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DockviewAngularModule, DockviewApi, DockviewReadyEvent, Orientation } from 'dockview-angular';
import 'dockview-core/dist/styles/dockview.css';

// Default panel component
@Component({
    selector: 'default-panel',
    template: `
        <div style="height: 100%; padding: 20px;">
            {{ title }}
        </div>
    `
})
export class DefaultPanelComponent {
    @Input() api: any;
    @Input() params: any;
    
    get title() {
        return this.params?.title || this.api?.title || this.api?.id || 'Panel';
    }

    constructor() {}
}

// Watermark component
@Component({
    selector: 'watermark-panel',
    template: `
        <div style="height: 100%; display: flex; justify-content: center; align-items: center; color: white;">
            <div style="display: flex; flex-direction: column;">
                <span>This is a custom watermark. You can change this content.</span>
                <span>
                    <button (click)="addPanel()" style="margin: 10px;">Add New Panel</button>
                </span>
                <span *ngIf="isGroup">
                    <button (click)="closeGroup()" style="margin: 10px;">Close Group</button>
                </span>
            </div>
        </div>
    `
})
export class WatermarkComponent {
    @Input() containerApi: DockviewApi;
    @Input() group: any;

    get isGroup(): boolean {
        return this.containerApi?.groups.length > 0;
    }

    addPanel() {
        this.containerApi.addPanel({
            id: Date.now().toString(),
            component: 'default',
            params: { title: 'New Panel' }
        });
    }

    closeGroup() {
        this.group?.api.close();
    }
}

// Main app component  
@Component({
    selector: 'app-root',
    template: `
        <div style="height: 100vh; display: flex; flex-direction: column;">
            <div>
                <button (click)="addEmptyGroup()" style="margin: 10px;">Add Empty Group</button>
            </div>
            <dv-dockview
                [components]="components"
                [watermarkComponent]="watermarkComponent"
                className="dockview-theme-abyss"
                (ready)="onReady($event)"
                style="flex: 1;">
            </dv-dockview>
        </div>
    `
})
export class AppComponent {
    components: Record<string, Type<any>>;
    watermarkComponent = WatermarkComponent;
    api: DockviewApi;

    constructor() {
        this.components = {
            default: DefaultPanelComponent,
        };
    }

    onReady(event: DockviewReadyEvent) {
        this.api = event.api;

        // Start with empty layout to show watermark
        event.api.fromJSON({
            grid: {
                orientation: Orientation.HORIZONTAL,
                root: { type: 'branch', data: [] },
                height: 100,
                width: 100,
            },
            panels: {},
        });
    }

    addEmptyGroup() {
        if (this.api) {
            this.api.addGroup();
        }
    }
}

// App module
@NgModule({
    declarations: [AppComponent, DefaultPanelComponent, WatermarkComponent],
    imports: [BrowserModule, DockviewAngularModule],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }

// Bootstrap the application
platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err));