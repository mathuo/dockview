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
    template: `<div>{{ title || 'Default Panel' }}</div>`
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

        api.addPanel({
            id: 'panel_1',
            component: 'default',
        });

        api.addPanel({
            id: 'panel_2',
            component: 'default',
            position: {
                direction: 'right',
                referencePanel: 'panel_1',
            },
        });

        api.addPanel({
            id: 'panel_3',
            component: 'default',
            position: {
                direction: 'below',
                referencePanel: 'panel_1',
            },
        });

        api.addPanel({
            id: 'panel_4',
            component: 'default',
        });

        api.addPanel({
            id: 'panel_5',
            component: 'default',
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