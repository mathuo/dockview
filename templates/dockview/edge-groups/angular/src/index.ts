import 'zone.js';
import '@angular/compiler';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Component, Type, NgModule, Input } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DockviewAngularModule } from 'dockview-angular';
import 'dockview-core/dist/styles/dockview.css';

// Default panel component
@Component({
    selector: 'default-panel',
    template: `<div style="padding: 10px;">{{ title || 'Panel' }}</div>`
})
export class DefaultPanelComponent {
    @Input() api: any;

    get title() {
        return this.api?.title || this.api?.id || 'Panel';
    }

    constructor() {}
}

// Main app component
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
    `
})
export class AppComponent {
    components: Record<string, Type<any>>;

    constructor() {
        this.components = {
            default: DefaultPanelComponent,
        };
    }

    onReady(event: any) {
        const api = event.api;

        api.addEdgeGroup('left', {
            id: 'left',
            initialSize: 220,
            minimumSize: 150,
        });

        api.addEdgeGroup('bottom', {
            id: 'bottom',
            initialSize: 180,
            minimumSize: 100,
        });

        api.addEdgeGroup('right', {
            id: 'right',
            initialSize: 220,
            minimumSize: 150,
            collapsed: true,
        });

        api.addPanel({
            id: 'explorer',
            component: 'default',
            title: 'Explorer',
            position: { referenceGroup: 'left' },
        });

        api.addPanel({
            id: 'search',
            component: 'default',
            title: 'Search',
            position: { referenceGroup: 'left' },
        });

        api.addPanel({
            id: 'terminal',
            component: 'default',
            title: 'Terminal',
            position: { referenceGroup: 'bottom' },
        });

        api.addPanel({
            id: 'output',
            component: 'default',
            title: 'Output',
            position: { referenceGroup: 'bottom' },
        });

        api.addPanel({
            id: 'outline',
            component: 'default',
            title: 'Outline',
            position: { referenceGroup: 'right' },
        });

        api.addPanel({
            id: 'panel_1',
            component: 'default',
            title: 'Editor',
        });

        api.addPanel({
            id: 'panel_2',
            component: 'default',
            title: 'Preview',
            position: {
                direction: 'right',
                referencePanel: 'panel_1',
            },
        });
    }
}

// App module
@NgModule({
    declarations: [AppComponent, DefaultPanelComponent],
    imports: [BrowserModule, DockviewAngularModule],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }

// Bootstrap the application with JIT compilation
platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err));
