import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { Component, Type } from '@angular/core';
import { DockviewAngularComponent } from 'dockview-angular';
import 'dockview-core/dist/styles/dockview.css';

// Default panel component
@Component({
    selector: 'default-panel',
    template: `<div>{{ api.title }}</div>`,
    standalone: true,
})
export class DefaultPanelComponent {
    api: any;

    constructor() {}
}

// Main app component  
@Component({
    selector: 'app-root',
    template: `
        <div style="height: 100vh;">
            <dv-dockview
                [components]="components"
                className="dockview-theme-abyss"
                (ready)="onReady($event)">
            </dv-dockview>
        </div>
    `,
    standalone: true,
    imports: [DockviewAngularComponent]
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

// Bootstrap the application
bootstrapApplication(AppComponent).catch(err => console.error(err));